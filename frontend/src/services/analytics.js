export const ANALYTICS_CONSENT_KEY = 'allay:analytics-consent'

export const ANALYTICS_EVENTS = {
  VIEW_SERVICE: 'view_service',
  SELECT_SERVICE: 'select_service',
  CATEGORY_VIEW: 'category_view',
  SERVICE_SEARCH: 'service_search',
  BOOKING_START: 'booking_start',
  BOOKING_STEP_VIEW: 'booking_step_view',
  BOOKING_DATE_SELECTED: 'booking_date_selected',
  BOOKING_TIME_SELECTED: 'booking_time_selected',
  BOOKING_DETAILS_COMPLETED: 'booking_details_completed',
  BOOKING_SUBMIT: 'booking_submit',
  BOOKING_COMPLETE: 'booking_complete',
  BOOKING_ERROR: 'booking_error',
  GENERATE_LEAD: 'generate_lead',
  WAITLIST_START: 'waitlist_start',
  WAITLIST_ERROR: 'waitlist_error',
  LOGIN: 'login',
  SIGN_UP: 'sign_up',
  CONTACT_CLICK: 'contact_click',
}

const measurementId = (import.meta.env.VITE_GA4_MEASUREMENT_ID || '').trim()
const enabled = import.meta.env.VITE_GA4_ENABLED !== 'false'
const debug = import.meta.env.VITE_GA4_DEBUG === 'true'
const scriptId = 'allay-ga4-script'
let initialized = false
let warned = false
let lastPageViewPath = ''

function isMeasurementIdValid() {
  return /^G-[A-Z0-9]+$/i.test(measurementId)
}

export function isAdminPath(pathname = window.location.pathname) {
  return pathname === '/allay-admin'
    || pathname.startsWith('/allay-admin/')
    || pathname === '/admin'
    || pathname.startsWith('/admin/')
    || pathname === '/luma-control-room'
    || pathname.startsWith('/luma-control-room/')
}

function isLocalHost() {
  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
}

function shouldTrack(pathname = window.location.pathname) {
  if (!enabled || !isMeasurementIdValid()) return false
  if (isAdminPath(pathname)) return false
  if (isLocalHost() && !debug) return false
  return getAnalyticsConsent() === 'granted'
}

function warnOnce(message) {
  if (warned || import.meta.env.PROD) return
  warned = true
  console.warn(`[analytics] ${message}`)
}

function setupDataLayer() {
  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments) }
}

export function getAnalyticsConsent() {
  try {
    return localStorage.getItem(ANALYTICS_CONSENT_KEY) || 'unset'
  } catch {
    return 'unset'
  }
}

export function setAnalyticsConsent(consent) {
  const granted = consent === 'granted'
  try {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, granted ? 'granted' : 'denied')
  } catch {
    return
  }
  setupDataLayer()
  window.gtag('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
  if (granted) initializeAnalytics()
}

export function isAnalyticsEnabled() {
  return shouldTrack()
}

export function initializeAnalytics() {
  setupDataLayer()
  window.gtag('consent', 'default', {
    analytics_storage: getAnalyticsConsent() === 'granted' ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })

  if (!enabled) return false
  if (!isMeasurementIdValid()) {
    warnOnce('VITE_GA4_MEASUREMENT_ID is missing or invalid; tracking is disabled.')
    return false
  }
  if (!shouldTrack()) return false
  if (!document.getElementById(scriptId)) {
    const script = document.createElement('script')
    script.id = scriptId
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
    document.head.appendChild(script)
  }
  if (!initialized) {
    window.gtag('js', new Date())
    window.gtag('config', measurementId, { send_page_view: false, debug_mode: debug })
    initialized = true
  }
  return true
}

function cleanValue(value) {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'number' || typeof value === 'boolean') return value
  return String(value).slice(0, 100)
}

export function serviceParams(service = {}, extra = {}) {
  return {
    service_name: cleanValue(service.name),
    service_slug: cleanValue(service.slug),
    service_category: cleanValue(service.category),
    service_duration: Number(service.durationMinutes || service.duration || 0) || undefined,
    service_price: Number(service.price || 0) || undefined,
    currency: service.price ? 'NGN' : undefined,
    ...extra,
  }
}

export function trackEvent(name, params = {}) {
  if (!name || !/^[a-z0-9_]+$/.test(name)) return
  try {
    if (!initializeAnalytics()) return
    const safeParams = Object.entries(params).reduce((next, [key, value]) => {
      const cleaned = cleanValue(value)
      if (cleaned !== undefined && /^[a-z0-9_]+$/.test(key)) next[key] = cleaned
      return next
    }, {})
    window.gtag('event', name, safeParams)
  } catch (error) {
    if (debug) console.warn('[analytics] event failed', error)
  }
}

export function trackPageView({ pathname = window.location.pathname, title = document.title } = {}) {
  if (isAdminPath(pathname)) return
  const pagePath = pathname || '/'
  if (lastPageViewPath === pagePath) return
  try {
    if (!initializeAnalytics()) return
    lastPageViewPath = pagePath
    window.gtag('event', 'page_view', {
      page_title: title || 'Allay House',
      page_location: `${window.location.origin}${pagePath}`,
      page_path: pagePath,
    })
  } catch (error) {
    if (debug) console.warn('[analytics] page view failed', error)
  }
}

export function resetAnalyticsPageViewMemory() {
  lastPageViewPath = ''
}

export function bucketTimeOfDay(value = '') {
  const hour = Number(String(value).split(':')[0])
  if (!Number.isFinite(hour)) return undefined
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

export function bookingValue(services = []) {
  return services.reduce((sum, service) => sum + Number(service.price || 0), 0)
}
