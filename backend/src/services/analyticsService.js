import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { env } from '../config/env.js'

const PRESETS = {
  '7d': 7,
  '28d': 28,
  '30d': 30,
  '90d': 90,
}

const BOOKING_FUNNEL_EVENTS = [
  'view_service',
  'select_service',
  'booking_start',
  'booking_date_selected',
  'booking_time_selected',
  'booking_details_completed',
  'booking_submit',
  'booking_complete',
]

const CUSTOM_DIMENSIONS = [
  'customEvent:service_name',
  'customEvent:service_slug',
  'customEvent:service_category',
  'customEvent:booking_step',
  'customEvent:result',
  'customEvent:error_type',
  'customEvent:source_section',
  'customEvent:lead_type',
  'customEvent:link_type',
  'customEvent:category_name',
]

let analyticsClient
let metadataCache
let metadataCacheExpires = 0
const reportCache = new Map()
const reportRuntime = {
  lastAttemptedAt: '',
  lastSuccessfulAt: '',
  lastError: null,
}

function todayUtc() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(date, amount) {
  const next = new Date(`${date}T00:00:00.000Z`)
  next.setUTCDate(next.getUTCDate() + amount)
  return next.toISOString().slice(0, 10)
}

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
}

function dateDiffDays(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00.000Z`).getTime()
  const end = new Date(`${endDate}T00:00:00.000Z`).getTime()
  return Math.floor((end - start) / 86400000) + 1
}

function parseNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function metricValue(row, index) {
  return parseNumber(row?.metricValues?.[index]?.value)
}

function dimensionValue(row, index) {
  return row?.dimensionValues?.[index]?.value || ''
}

function stripQuery(path = '') {
  return String(path || '').split('?')[0].split('#')[0] || '/'
}

function round(value, decimals = 2) {
  const factor = 10 ** decimals
  return Math.round((parseNumber(value) + Number.EPSILON) * factor) / factor
}

function compare(current, previous) {
  const currentValue = round(current)
  const previousValue = round(previous)
  const change = round(currentValue - previousValue)
  const changePercent = previousValue === 0 ? (currentValue > 0 ? 100 : 0) : round((change / previousValue) * 100)
  return { current: currentValue, previous: previousValue, change, changePercent }
}

export function normalizeAnalyticsPropertyId(value = env.GA4_PROPERTY_ID) {
  const raw = String(value || '').trim()
  const match = raw.match(/^(?:properties\/)?(\d+)$/)
  const propertyId = match?.[1] || ''
  return {
    raw,
    propertyId,
    propertyName: propertyId ? `properties/${propertyId}` : '',
    valid: Boolean(propertyId),
    numeric: /^\d+$/.test(propertyId),
    message: raw ? 'GA4_PROPERTY_ID must be a numeric property ID, optionally prefixed with properties/.' : 'GA4_PROPERTY_ID is required.',
  }
}

export function normalizeAnalyticsPrivateKey(value = '') {
  let key = String(value || '').trim()
  const quoted = (key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))
  if (quoted) key = key.slice(1, -1).trim()
  key = key.replace(/\\n/g, '\n')
  return key.trim()
}

function keyDiagnostics(privateKey = '') {
  const raw = String(privateKey || '')
  const normalized = normalizeAnalyticsPrivateKey(privateKey)
  return {
    exists: Boolean(normalized),
    hasPemBoundaries: normalized.includes('-----BEGIN PRIVATE KEY-----') && normalized.includes('-----END PRIVATE KEY-----'),
    length: normalized.length,
    escapedNewlinesConverted: raw.includes('\\n') && normalized.includes('\n'),
  }
}

function maskEmail(email = '') {
  const [name, domain] = String(email || '').split('@')
  if (!name || !domain) return ''
  const visible = name.length <= 3 ? name.slice(0, 1) : name.slice(0, 3)
  return `${visible}${'*'.repeat(Math.max(3, name.length - visible.length))}@${domain}`
}

function projectIdFromServiceAccountEmail(email = '') {
  const domain = String(email || '').split('@')[1] || ''
  const suffix = '.iam.gserviceaccount.com'
  return domain.endsWith(suffix) ? domain.slice(0, -suffix.length) : ''
}

function parseServiceAccountBase64(value) {
  if (!value) return null
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64').toString('utf8'))
    if (!parsed.client_email || !parsed.private_key) return null
    return {
      client_email: String(parsed.client_email).trim(),
      private_key: normalizeAnalyticsPrivateKey(parsed.private_key),
      project_id: parsed.project_id,
    }
  } catch {
    return null
  }
}

function getCredentials() {
  const fromBase64 = parseServiceAccountBase64(env.GA4_SERVICE_ACCOUNT_BASE64)
  if (fromBase64) {
    return {
      credentials: fromBase64,
      mode: 'service_account_base64',
      clientEmail: fromBase64.client_email,
      maskedClientEmail: maskEmail(fromBase64.client_email),
      privateKey: keyDiagnostics(fromBase64.private_key),
      projectId: fromBase64.project_id || '',
    }
  }
  if (env.GA4_CLIENT_EMAIL && env.GA4_PRIVATE_KEY) {
    const privateKey = normalizeAnalyticsPrivateKey(env.GA4_PRIVATE_KEY)
    const clientEmail = String(env.GA4_CLIENT_EMAIL || '').trim()
    return {
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      mode: 'email_private_key',
      clientEmail,
      maskedClientEmail: maskEmail(clientEmail),
      privateKey: keyDiagnostics(privateKey),
      projectId: projectIdFromServiceAccountEmail(clientEmail),
    }
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return {
      credentials: null,
      mode: 'application_default',
      clientEmail: '',
      maskedClientEmail: '',
      privateKey: { exists: false, hasPemBoundaries: false },
      projectId: '',
    }
  }
  return {
    credentials: null,
    mode: '',
    clientEmail: '',
    maskedClientEmail: '',
    privateKey: { exists: false, hasPemBoundaries: false },
    projectId: '',
  }
}

export function getAnalyticsStatus() {
  const enabled = env.GA4_ANALYTICS_ENABLED !== 'false'
  const property = normalizeAnalyticsPropertyId()
  const credentials = getCredentials()
  const credentialUsable = credentials.mode === 'application_default' || Boolean(credentials.credentials && credentials.privateKey.hasPemBoundaries)
  const configured = Boolean(enabled && property.valid && credentials.mode && credentialUsable)
  const missing = []
  if (!env.GA4_PROPERTY_ID) missing.push('GA4_PROPERTY_ID')
  if (env.GA4_PROPERTY_ID && !property.valid) missing.push('GA4_PROPERTY_ID must be numeric, for example 123456789 or properties/123456789')
  if (!credentials.mode) missing.push('GA4_SERVICE_ACCOUNT_BASE64 or GA4_CLIENT_EMAIL + GA4_PRIVATE_KEY')
  if (credentials.credentials && !credentials.privateKey.hasPemBoundaries) missing.push('GA4 private key must include valid PEM boundaries')
  return {
    success: true,
    configured,
    enabled,
    propertyIdValid: property.valid,
    propertyIdNumeric: property.numeric,
    propertyId: property.propertyId,
    propertyName: property.propertyName,
    credentialMode: credentials.mode || 'not_configured',
    serviceAccountEmail: credentials.maskedClientEmail,
    serviceAccountEmailMasked: credentials.maskedClientEmail,
    projectId: credentials.projectId || '',
    privateKeyConfigured: credentials.privateKey.exists,
    privateKeyHasPemBoundaries: credentials.privateKey.hasPemBoundaries,
    privateKeyLength: credentials.privateKey.length || 0,
    privateKeyEscapedNewlinesConverted: Boolean(credentials.privateKey.escapedNewlinesConverted),
    missing,
    gaUrl: property.valid ? `https://analytics.google.com/analytics/web/#/p${property.propertyId}/reports/intelligenthome` : '',
    reportState: reportRuntime.lastError ? 'error' : reportRuntime.lastSuccessfulAt ? 'verified' : 'not_checked',
    lastAttemptedAt: reportRuntime.lastAttemptedAt,
    lastSuccessfulAt: reportRuntime.lastSuccessfulAt,
    lastError: reportRuntime.lastError,
  }
}

function getClient() {
  const status = getAnalyticsStatus()
  if (!status.configured) return null
  if (analyticsClient) return analyticsClient
  const credentialConfig = getCredentials()
  analyticsClient = credentialConfig.credentials
    ? new BetaAnalyticsDataClient({ credentials: credentialConfig.credentials })
    : new BetaAnalyticsDataClient()
  return analyticsClient
}

function propertyName() {
  return normalizeAnalyticsPropertyId().propertyName
}

function resolveDateRange(query = {}) {
  const preset = PRESETS[query.preset] ? query.preset : '28d'
  let endDate = isDate(query.endDate) ? query.endDate : todayUtc()
  let startDate = isDate(query.startDate) ? query.startDate : addDays(endDate, -(PRESETS[preset] - 1))
  if (new Date(startDate) > new Date(endDate)) [startDate, endDate] = [endDate, startDate]
  if (dateDiffDays(startDate, endDate) > 180) startDate = addDays(endDate, -179)
  const days = dateDiffDays(startDate, endDate)
  return {
    preset,
    startDate,
    endDate,
    days,
    previousStartDate: addDays(startDate, -days),
    previousEndDate: addDays(startDate, -1),
  }
}

function cacheGet(key) {
  const hit = reportCache.get(key)
  if (!hit || hit.expiresAt < Date.now()) {
    reportCache.delete(key)
    return null
  }
  return hit.value
}

function cacheSet(key, value, ttlSeconds) {
  reportCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
  return value
}

function cacheIdentity() {
  const property = normalizeAnalyticsPropertyId()
  const credentials = getCredentials()
  return [
    property.propertyId || 'no-property',
    credentials.mode || 'no-credentials',
    credentials.clientEmail || credentials.maskedClientEmail || 'application-default',
  ].join(':')
}

function collectSectionErrors(sections = {}) {
  return Object.values(sections).map((section) => section?.error).filter(Boolean)
}

function updateRuntimeFromSections(sections = {}) {
  const errors = collectSectionErrors(sections)
  const now = new Date().toISOString()
  reportRuntime.lastAttemptedAt = now
  if (errors.length) {
    const primary = errors.find((error) => error.code === 'GA4_PERMISSION_DENIED') || errors[0]
    reportRuntime.lastError = {
      code: primary.code,
      message: primary.message,
      diagnostic: primary.diagnostic || null,
      at: now,
    }
    return { ok: false, errors }
  }
  reportRuntime.lastSuccessfulAt = now
  reportRuntime.lastError = null
  return { ok: true, errors: [] }
}

function safeGoogleError(error) {
  const code = Number(error?.code || error?.response?.status || 0)
  const text = `${error?.message || ''} ${error?.details || ''}`.toLowerCase()
  const diagnostic = {
    googleStatusCode: code || null,
    category: 'report_failed',
  }
  if (text.includes('disabled') || text.includes('has not been used') || text.includes('api has not')) {
    return {
      code: 'GA4_API_DISABLED',
      message: 'The credentials were recognized, but the Google Analytics Data API is disabled for the associated Google Cloud project.',
      diagnostic: { ...diagnostic, category: 'api_disabled' },
    }
  }
  if (text.includes('property') && (text.includes('not found') || text.includes('not exist'))) {
    return {
      code: 'GA4_PROPERTY_NOT_FOUND',
      message: 'Google Analytics could not find the requested GA4 property for these credentials.',
      diagnostic: { ...diagnostic, category: 'property_not_found' },
    }
  }
  if (code === 7 || code === 403 || text.includes('permission') || text.includes('access')) {
    return {
      code: 'GA4_PERMISSION_DENIED',
      message: 'Google accepted the credentials, but this service account does not have access to this GA4 property.',
      diagnostic: { ...diagnostic, category: 'permission_denied' },
    }
  }
  if (code === 8 || code === 429 || text.includes('quota')) {
    return {
      code: 'GA4_RATE_LIMITED',
      message: 'Google Analytics quota was exceeded. Please try again later.',
      diagnostic: { ...diagnostic, category: 'rate_limited' },
    }
  }
  if (code === 3 || code === 400 || text.includes('invalid') || text.includes('not found')) {
    return {
      code: 'GA4_REQUEST_FAILED',
      message: 'A Google Analytics report field or property value is not valid for this request.',
      diagnostic: { ...diagnostic, category: 'invalid_request' },
    }
  }
  if (code === 16 || code === 401 || text.includes('unauthenticated')) {
    return {
      code: 'GA4_AUTHENTICATION_FAILED',
      message: 'The service-account credentials could not be authenticated. Check that the email and private key belong to the same service account.',
      diagnostic: { ...diagnostic, category: 'authentication_failed' },
    }
  }
  if (code === 14 || code === 4 || code === 503 || code === 504) {
    return {
      code: 'GA4_REQUEST_FAILED',
      message: 'Google Analytics is temporarily unavailable.',
      diagnostic: { ...diagnostic, category: 'provider_unavailable' },
    }
  }
  return {
    code: 'GA4_REQUEST_FAILED',
    message: 'Analytics data could not be loaded right now.',
    diagnostic,
  }
}

async function runCoreReport({ dimensions = [], metrics = [], dateRanges, orderBys, limit = 25, dimensionFilter }) {
  const client = getClient()
  if (!client) return { rows: [] }
  const [response] = await client.runReport({
    property: propertyName(),
    dateRanges,
    dimensions: dimensions.map((name) => ({ name })),
    metrics: metrics.map((name) => ({ name })),
    orderBys,
    limit,
    dimensionFilter,
  })
  return response
}

async function runRealtimeReport({ dimensions = [], metrics = [], limit = 10 }) {
  const client = getClient()
  if (!client) return { rows: [] }
  const [response] = await client.runRealtimeReport({
    property: propertyName(),
    dimensions: dimensions.map((name) => ({ name })),
    metrics: metrics.map((name) => ({ name })),
    limit,
  })
  return response
}

async function getMetadata() {
  const client = getClient()
  if (!client) return { availableCustomDimensions: [], missingCustomDimensions: CUSTOM_DIMENSIONS }
  if (metadataCache && metadataCacheExpires > Date.now()) return metadataCache
  const [metadata] = await client.getMetadata({ name: `${propertyName()}/metadata` })
  const available = new Set((metadata.dimensions || []).map((dimension) => dimension.apiName))
  metadataCache = {
    availableCustomDimensions: CUSTOM_DIMENSIONS.filter((dimension) => available.has(dimension)),
    missingCustomDimensions: CUSTOM_DIMENSIONS.filter((dimension) => !available.has(dimension)),
  }
  metadataCacheExpires = Date.now() + 3600 * 1000
  return metadataCache
}

function emptyRows(response) {
  return response?.rows || []
}

function fillTimeSeries(rows, range) {
  const byDate = new Map(rows.map((row) => {
    const raw = dimensionValue(row, 0)
    const date = raw.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3')
    return [date, {
      date,
      activeUsers: metricValue(row, 0),
      sessions: metricValue(row, 1),
      views: metricValue(row, 2),
      engagedSessions: metricValue(row, 3),
      keyEvents: metricValue(row, 4),
    }]
  }))
  const days = []
  for (let index = 0; index < range.days; index += 1) {
    const date = addDays(range.startDate, index)
    days.push(byDate.get(date) || { date, activeUsers: 0, sessions: 0, views: 0, engagedSessions: 0, keyEvents: 0 })
  }
  return days
}

function eventFilter(eventNames) {
  return {
    filter: {
      fieldName: 'eventName',
      inListFilter: { values: eventNames },
    },
  }
}

function normalizeEvents(rows = []) {
  return rows.map((row) => ({
    eventName: dimensionValue(row, 0),
    eventCount: metricValue(row, 0),
    activeUsers: metricValue(row, 1),
    keyEvents: metricValue(row, 2),
  }))
}

async function safeSection(loader, fallback) {
  try {
    return { data: await loader(), error: null }
  } catch (error) {
    const safe = safeGoogleError(error)
    console.warn(`[analytics] ${safe.code}: ${safe.message}`)
    return { data: fallback, error: safe }
  }
}

export async function getAnalyticsOverview(query = {}) {
  const status = getAnalyticsStatus()
  const range = resolveDateRange(query)
  if (!status.configured) {
    return {
      success: true,
      status,
      dateRange: range,
      lastUpdated: new Date().toISOString(),
      sections: {},
      setup: {
        frontend: ['VITE_GA4_MEASUREMENT_ID'],
        backend: ['GA4_PROPERTY_ID', 'GA4_SERVICE_ACCOUNT_BASE64', 'GA4_CLIENT_EMAIL', 'GA4_PRIVATE_KEY'],
      },
    }
  }

  const forceRefresh = query.force === 'true'
  const cacheKey = `overview:${cacheIdentity()}:${range.startDate}:${range.endDate}:${query.limit || 10}`
  if (forceRefresh) reportCache.delete(cacheKey)
  if (!forceRefresh) {
    const cached = cacheGet(cacheKey)
    if (cached) return cached
  }

  const limit = Math.min(Math.max(Number(query.limit) || 10, 5), 50)
  const overview = await safeSection(async () => {
    const overviewMetrics = ['activeUsers', 'totalUsers', 'newUsers', 'sessions', 'screenPageViews', 'engagementRate', 'averageSessionDuration', 'keyEvents', 'eventCount']
    const currentResponse = await runCoreReport({
      dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
      metrics: overviewMetrics,
      limit: 1,
    })
    const previousResponse = await runCoreReport({
      dateRanges: [{ startDate: range.previousStartDate, endDate: range.previousEndDate }],
      metrics: overviewMetrics,
      limit: 1,
    })
    const currentEvents = await runCoreReport({
      dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
      dimensions: ['eventName'],
      metrics: ['eventCount'],
      dimensionFilter: eventFilter(['booking_complete', 'generate_lead']),
      limit: 10,
    })
    const previousEvents = await runCoreReport({
      dateRanges: [{ startDate: range.previousStartDate, endDate: range.previousEndDate }],
      dimensions: ['eventName'],
      metrics: ['eventCount'],
      dimensionFilter: eventFilter(['booking_complete', 'generate_lead']),
      limit: 10,
    })
    const current = currentResponse.rows?.[0]
    const previous = previousResponse.rows?.[0]
    const currentEventCounts = {}
    const previousEventCounts = {}
    for (const row of currentEvents.rows || []) currentEventCounts[dimensionValue(row, 0)] = metricValue(row, 0)
    for (const row of previousEvents.rows || []) previousEventCounts[dimensionValue(row, 0)] = metricValue(row, 0)
    return {
      activeUsers: compare(metricValue(current, 0), metricValue(previous, 0)),
      totalUsers: compare(metricValue(current, 1), metricValue(previous, 1)),
      newUsers: compare(metricValue(current, 2), metricValue(previous, 2)),
      sessions: compare(metricValue(current, 3), metricValue(previous, 3)),
      views: compare(metricValue(current, 4), metricValue(previous, 4)),
      engagementRate: compare(metricValue(current, 5), metricValue(previous, 5)),
      averageSessionDuration: compare(metricValue(current, 6), metricValue(previous, 6)),
      keyEvents: compare(metricValue(current, 7), metricValue(previous, 7)),
      eventCount: compare(metricValue(current, 8), metricValue(previous, 8)),
      bookingCompletions: compare(currentEventCounts.booking_complete || 0, previousEventCounts.booking_complete || 0),
      waitlistLeads: compare(currentEventCounts.generate_lead || 0, previousEventCounts.generate_lead || 0),
    }
  }, {})

  const timeSeries = await safeSection(async () => {
    const response = await runCoreReport({
      dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
      dimensions: ['date'],
      metrics: ['activeUsers', 'sessions', 'screenPageViews', 'engagedSessions', 'keyEvents'],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
      limit: 200,
    })
    return fillTimeSeries(response.rows || [], range)
  }, [])

  const realtime = await safeSection(async () => {
    const [summary, pages, events, devices, countries] = await Promise.all([
      runRealtimeReport({ metrics: ['activeUsers'], limit: 1 }),
      runRealtimeReport({ dimensions: ['unifiedScreenName'], metrics: ['screenPageViews', 'activeUsers'], limit: 5 }),
      runRealtimeReport({ dimensions: ['eventName'], metrics: ['eventCount', 'activeUsers'], limit: 8 }),
      runRealtimeReport({ dimensions: ['deviceCategory'], metrics: ['activeUsers'], limit: 5 }),
      runRealtimeReport({ dimensions: ['country'], metrics: ['activeUsers'], limit: 5 }),
    ])
    return {
      activeUsers: metricValue(summary.rows?.[0], 0),
      topPages: emptyRows(pages).map((row) => ({ page: dimensionValue(row, 0) || '/', views: metricValue(row, 0), activeUsers: metricValue(row, 1) })),
      topEvents: emptyRows(events).map((row) => ({ eventName: dimensionValue(row, 0), eventCount: metricValue(row, 0), activeUsers: metricValue(row, 1) })),
      devices: emptyRows(devices).map((row) => ({ device: dimensionValue(row, 0), activeUsers: metricValue(row, 0) })),
      countries: emptyRows(countries).map((row) => ({ country: dimensionValue(row, 0), activeUsers: metricValue(row, 0) })),
    }
  }, { activeUsers: 0, topPages: [], topEvents: [], devices: [], countries: [] })

  const topPages = await safeSection(async () => {
    const response = await runCoreReport({
      dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
      dimensions: ['pagePath', 'pageTitle'],
      metrics: ['screenPageViews', 'activeUsers', 'userEngagementDuration'],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit,
    })
    return emptyRows(response).map((row) => ({
      path: stripQuery(dimensionValue(row, 0)),
      title: dimensionValue(row, 1) || stripQuery(dimensionValue(row, 0)),
      views: metricValue(row, 0),
      activeUsers: metricValue(row, 1),
      engagementSeconds: metricValue(row, 2),
    }))
  }, [])

  const landingPages = await safeSection(async () => {
    const response = await runCoreReport({
      dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
      dimensions: ['landingPage'],
      metrics: ['sessions', 'activeUsers', 'engagedSessions', 'keyEvents'],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit,
    })
    return emptyRows(response).map((row) => ({
      path: stripQuery(dimensionValue(row, 0)),
      sessions: metricValue(row, 0),
      activeUsers: metricValue(row, 1),
      engagedSessions: metricValue(row, 2),
      keyEvents: metricValue(row, 3),
    }))
  }, [])

  const acquisition = await safeSection(async () => {
    const response = await runCoreReport({
      dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
      dimensions: ['sessionDefaultChannelGroup', 'sessionSource', 'sessionMedium'],
      metrics: ['sessions', 'activeUsers', 'engagedSessions', 'keyEvents'],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit,
    })
    return emptyRows(response).map((row) => ({
      channel: dimensionValue(row, 0) || 'Unassigned',
      source: dimensionValue(row, 1) || '(not set)',
      medium: dimensionValue(row, 2) || '(not set)',
      sessions: metricValue(row, 0),
      activeUsers: metricValue(row, 1),
      engagedSessions: metricValue(row, 2),
      keyEvents: metricValue(row, 3),
    }))
  }, [])

  const audience = await safeSection(async () => {
    const [devices, browsers, systems, countries, cities, returning] = await Promise.all([
      runCoreReport({ dateRanges: [{ startDate: range.startDate, endDate: range.endDate }], dimensions: ['deviceCategory'], metrics: ['activeUsers'], limit: 8 }),
      runCoreReport({ dateRanges: [{ startDate: range.startDate, endDate: range.endDate }], dimensions: ['browser'], metrics: ['activeUsers'], limit: 8 }),
      runCoreReport({ dateRanges: [{ startDate: range.startDate, endDate: range.endDate }], dimensions: ['operatingSystem'], metrics: ['activeUsers'], limit: 8 }),
      runCoreReport({ dateRanges: [{ startDate: range.startDate, endDate: range.endDate }], dimensions: ['country'], metrics: ['activeUsers'], limit: 8 }),
      runCoreReport({ dateRanges: [{ startDate: range.startDate, endDate: range.endDate }], dimensions: ['city'], metrics: ['activeUsers'], limit: 8 }),
      runCoreReport({ dateRanges: [{ startDate: range.startDate, endDate: range.endDate }], dimensions: ['newVsReturning'], metrics: ['activeUsers'], limit: 8 }),
    ])
    return {
      devices: emptyRows(devices).map((row) => ({ label: dimensionValue(row, 0), value: metricValue(row, 0) })),
      browsers: emptyRows(browsers).map((row) => ({ label: dimensionValue(row, 0), value: metricValue(row, 0) })),
      operatingSystems: emptyRows(systems).map((row) => ({ label: dimensionValue(row, 0), value: metricValue(row, 0) })),
      countries: emptyRows(countries).map((row) => ({ label: dimensionValue(row, 0), value: metricValue(row, 0) })),
      cities: emptyRows(cities).map((row) => ({ label: dimensionValue(row, 0), value: metricValue(row, 0) })),
      returning: emptyRows(returning).map((row) => ({ label: dimensionValue(row, 0), value: metricValue(row, 0) })),
    }
  }, { devices: [], browsers: [], operatingSystems: [], countries: [], cities: [], returning: [] })

  const events = await safeSection(async () => {
    const response = await runCoreReport({
      dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
      dimensions: ['eventName'],
      metrics: ['eventCount', 'activeUsers', 'keyEvents'],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 50,
    })
    return normalizeEvents(response.rows)
  }, [])

  const bookingFunnel = await safeSection(async () => {
    const response = await runCoreReport({
      dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
      dimensions: ['eventName'],
      metrics: ['eventCount'],
      dimensionFilter: eventFilter(BOOKING_FUNNEL_EVENTS),
      limit: BOOKING_FUNNEL_EVENTS.length,
    })
    const counts = new Map(emptyRows(response).map((row) => [dimensionValue(row, 0), metricValue(row, 0)]))
    let previous = 0
    const first = counts.get(BOOKING_FUNNEL_EVENTS[0]) || 0
    return BOOKING_FUNNEL_EVENTS.map((eventName, index) => {
      const count = counts.get(eventName) || 0
      const item = {
        eventName,
        label: eventName.replace(/_/g, ' '),
        count,
        percentOfFirst: first ? round((count / first) * 100) : 0,
        dropoffFromPrevious: index === 0 || previous === 0 ? 0 : round(((previous - count) / previous) * 100),
      }
      previous = count
      return item
    })
  }, [])

  const waitlist = await safeSection(async () => {
    const response = await runCoreReport({
      dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
      dimensions: ['eventName'],
      metrics: ['eventCount'],
      dimensionFilter: eventFilter(['waitlist_start', 'generate_lead', 'waitlist_error']),
      limit: 3,
    })
    const counts = new Map(emptyRows(response).map((row) => [dimensionValue(row, 0), metricValue(row, 0)]))
    const starts = counts.get('waitlist_start') || 0
    const leads = counts.get('generate_lead') || 0
    return { starts, leads, errors: counts.get('waitlist_error') || 0, completionRate: starts ? round((leads / starts) * 100) : 0 }
  }, { starts: 0, leads: 0, errors: 0, completionRate: 0 })

  const serviceInterest = await safeSection(async () => {
    const metadata = await getMetadata()
    const hasServiceName = metadata.availableCustomDimensions.includes('customEvent:service_name')
    const hasServiceCategory = metadata.availableCustomDimensions.includes('customEvent:service_category')
    if (!hasServiceName) return { setupNeeded: true, ...metadata, viewed: [], selected: [], bookingStarts: [], bookingCompletions: [], categories: [] }
    const [viewed, selected, bookingStarts, bookingCompletions, categories] = await Promise.all([
      runCoreReport({
        dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
        dimensions: ['customEvent:service_name'],
        metrics: ['eventCount'],
        dimensionFilter: eventFilter(['view_service']),
        limit,
      }),
      runCoreReport({
        dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
        dimensions: ['customEvent:service_name'],
        metrics: ['eventCount'],
        dimensionFilter: eventFilter(['select_service']),
        limit,
      }),
      runCoreReport({
        dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
        dimensions: ['customEvent:service_name'],
        metrics: ['eventCount'],
        dimensionFilter: eventFilter(['booking_start']),
        limit,
      }),
      runCoreReport({
        dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
        dimensions: ['customEvent:service_name'],
        metrics: ['eventCount'],
        dimensionFilter: eventFilter(['booking_complete']),
        limit,
      }),
      hasServiceCategory
        ? runCoreReport({
            dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
            dimensions: ['customEvent:service_category'],
            metrics: ['eventCount'],
            dimensionFilter: eventFilter(['view_service', 'select_service', 'booking_start', 'booking_complete']),
            limit,
          })
        : Promise.resolve({ rows: [] }),
    ])
    return {
      setupNeeded: false,
      ...metadata,
      viewed: emptyRows(viewed).map((row) => ({ service: dimensionValue(row, 0), count: metricValue(row, 0) })),
      selected: emptyRows(selected).map((row) => ({ service: dimensionValue(row, 0), count: metricValue(row, 0) })),
      bookingStarts: emptyRows(bookingStarts).map((row) => ({ service: dimensionValue(row, 0), count: metricValue(row, 0) })),
      bookingCompletions: emptyRows(bookingCompletions).map((row) => ({ service: dimensionValue(row, 0), count: metricValue(row, 0) })),
      categories: emptyRows(categories).map((row) => ({ category: dimensionValue(row, 0), count: metricValue(row, 0) })),
    }
  }, { setupNeeded: true, availableCustomDimensions: [], missingCustomDimensions: CUSTOM_DIMENSIONS, viewed: [], selected: [], bookingStarts: [], bookingCompletions: [], categories: [] })

  const sections = {
    overview,
    timeSeries,
    realtime,
    topPages,
    landingPages,
    acquisition,
    audience,
    events,
    serviceInterest,
    bookingFunnel,
    waitlist,
  }
  const runtime = updateRuntimeFromSections(sections)
  const result = {
    success: true,
    status: getAnalyticsStatus(),
    dateRange: range,
    lastUpdated: new Date().toISOString(),
    sections,
  }
  if (!runtime.ok) return result
  return cacheSet(cacheKey, result, env.GA4_CACHE_TTL_SECONDS)
}

export async function runAnalyticsDiagnosticReport() {
  const status = getAnalyticsStatus()
  const range = resolveDateRange({ preset: '7d' })
  const baseDetails = {
    configured: status.configured,
    enabled: status.enabled,
    credentialMode: status.credentialMode,
    propertyId: status.propertyId,
    propertyName: status.propertyName,
    propertyIdNumeric: status.propertyIdNumeric,
    projectId: status.projectId,
    serviceAccountEmailMasked: status.serviceAccountEmailMasked || status.serviceAccountEmail,
    privateKeyConfigured: status.privateKeyConfigured,
    privateKeyHasPemBoundaries: status.privateKeyHasPemBoundaries,
    privateKeyLength: status.privateKeyLength,
    privateKeyEscapedNewlinesConverted: status.privateKeyEscapedNewlinesConverted,
    missing: status.missing,
    requestAttempted: false,
    lastAttemptAt: null,
    lastSuccessAt: reportRuntime.lastSuccessfulAt || null,
    dateRange: { startDate: range.startDate, endDate: range.endDate },
    rowsReturned: 0,
    values: {},
  }
  if (!status.configured) {
    const invalidProperty = status.missing.some((item) => item.includes('GA4_PROPERTY_ID must be numeric'))
    const invalidKey = status.missing.some((item) => item.includes('private key'))
    const code = invalidProperty ? 'GA4_INVALID_PROPERTY_ID' : invalidKey ? 'GA4_INVALID_PRIVATE_KEY' : 'GA4_NOT_CONFIGURED'
    return {
      ok: false,
      success: false,
      stage: 'configuration',
      code,
      message: code === 'GA4_INVALID_PROPERTY_ID'
        ? 'GA4_PROPERTY_ID must be a numeric GA4 property ID.'
        : code === 'GA4_INVALID_PRIVATE_KEY'
          ? 'GA4 private key is present but does not have valid PEM boundaries.'
          : 'GA4 reporting is not fully configured.',
      details: baseDetails,
    }
  }

  let client
  try {
    client = getClient()
  } catch (error) {
    const safe = safeGoogleError(error)
    const now = new Date().toISOString()
    reportRuntime.lastAttemptedAt = now
    reportRuntime.lastError = { code: safe.code, message: safe.message, diagnostic: safe.diagnostic || null, at: now }
    return {
      ok: false,
      success: false,
      stage: 'client_creation',
      code: safe.code === 'GA4_REQUEST_FAILED' ? 'GA4_AUTHENTICATION_FAILED' : safe.code,
      message: safe.message,
      details: { ...baseDetails, lastAttemptAt: now },
    }
  }

  if (!client) {
    return {
      ok: false,
      success: false,
      stage: 'client_creation',
      code: 'GA4_NOT_CONFIGURED',
      message: 'GA4 client could not be created because reporting is not configured.',
      details: baseDetails,
    }
  }

  const attemptAt = new Date().toISOString()
  reportRuntime.lastAttemptedAt = attemptAt
  try {
    const [response] = await client.runReport({
      property: propertyName(),
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      metrics: [{ name: 'activeUsers' }],
      limit: 1,
    })
    const rowsReturned = response.rowCount || response.rows?.length || 0
    const activeUsers = metricValue(response.rows?.[0], 0)
    const code = rowsReturned && activeUsers > 0 ? 'GA4_SUCCESS' : 'GA4_NO_DATA'
    const successAt = new Date().toISOString()
    reportRuntime.lastSuccessfulAt = successAt
    reportRuntime.lastError = null
    return {
      ok: true,
      success: true,
      stage: 'response_interpretation',
      code,
      message: code === 'GA4_SUCCESS'
        ? 'GA4 reporting connection succeeded.'
        : 'GA4 reporting connection succeeded, but no analytics activity was found for the selected period.',
      details: {
        ...baseDetails,
        requestAttempted: true,
        lastAttemptAt: attemptAt,
        lastSuccessAt: successAt,
        rowsReturned,
        values: { activeUsers },
      },
    }
  } catch (error) {
    const safe = safeGoogleError(error)
    reportRuntime.lastError = { code: safe.code, message: safe.message, diagnostic: safe.diagnostic || null, at: attemptAt }
    return {
      ok: false,
      success: false,
      stage: 'google_request',
      code: safe.code,
      message: safe.message,
      details: {
        ...baseDetails,
        requestAttempted: true,
        lastAttemptAt: attemptAt,
        googleStatusCode: safe.diagnostic?.googleStatusCode || null,
        googleCategory: safe.diagnostic?.category || null,
      },
    }
  }
}
