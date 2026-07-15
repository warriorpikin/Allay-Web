import { Download, ExternalLink, RefreshCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../components/common/Button'
import Loader from '../../components/common/Loader'
import { useFetch } from '../../hooks/useFetch'
import { getAdminAnalyticsOverview, getAdminBusinessAnalytics } from '../../services/adminApi'
import { formatCurrency } from '../../utils/formatCurrency'

const presetOptions = [
  { value: '7d', label: '7 days' },
  { value: '28d', label: '28 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
]

function formatNumber(value) {
  return new Intl.NumberFormat('en-NG').format(Number(value || 0))
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`
}

function formatDuration(seconds) {
  const total = Math.round(Number(seconds || 0))
  const minutes = Math.floor(total / 60)
  const remaining = total % 60
  return minutes ? `${minutes}m ${remaining}s` : `${remaining}s`
}

function SectionError({ error }) {
  if (!error) return null
  return <div className="admin-empty-row admin-empty-row--warning">{error.message || 'This analytics section could not be loaded.'}</div>
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString('en-NG') : 'Not yet'
}

function reportStateLabel(status) {
  if (!status?.configured) return 'Not configured'
  if (status.reportState === 'verified') return 'Report access verified'
  if (status.reportState === 'error') return 'Report access failed'
  return 'Configured, not checked'
}

function credentialModeLabel(mode) {
  if (mode === 'service_account_base64') return 'Service-account JSON'
  if (mode === 'email_private_key') return 'Email and private key'
  if (mode === 'application_default') return 'Application default'
  return 'Not configured'
}

function serviceAccountLabel(status) {
  if (status?.credentialMode === 'application_default') return 'Application default'
  return status?.serviceAccountEmail || status?.serviceAccountEmailMasked || 'Not available'
}

function privateKeyLabel(status) {
  if (status?.credentialMode === 'application_default') return 'Application default'
  if (!status?.privateKeyConfigured) return 'Not loaded'
  return status.privateKeyHasPemBoundaries ? 'Loaded with PEM boundaries' : 'Loaded, invalid PEM shape'
}

function Comparison({ item, type = 'number' }) {
  if (!item) return <span>-</span>
  const display = type === 'percent' ? formatPercent(item.current * 100) : type === 'duration' ? formatDuration(item.current) : type === 'currency' ? formatCurrency(item.current) : formatNumber(item.current)
  const direction = item.changePercent > 0 ? 'up' : item.changePercent < 0 ? 'down' : 'flat'
  return <><strong>{display}</strong>{item.changePercent !== undefined && <small className={`analytics-change analytics-change--${direction}`}>{item.changePercent > 0 ? '+' : ''}{formatPercent(item.changePercent)} vs previous</small>}</>
}

function SimpleBars({ items = [], labelKey = 'label', valueKey = 'value', formatValue = formatNumber }) {
  const max = Math.max(...items.map((item) => Number(item[valueKey] || 0)), 0)
  if (!items.length) return <div className="admin-empty-row">No data yet</div>
  return <div className="analytics-bars">{items.map((item) => {
    const value = Number(item[valueKey] || 0)
    return <div key={`${item[labelKey]}-${value}`} className="analytics-bar">
      <div><span>{item[labelKey] || 'Unknown'}</span><strong>{formatValue(value)}</strong></div>
      <b style={{ width: `${max ? Math.max((value / max) * 100, 4) : 0}%` }} />
    </div>
  })}</div>
}

function Sparkline({ data = [], metric = 'activeUsers' }) {
  const max = Math.max(...data.map((item) => Number(item[metric] || 0)), 1)
  if (!data.length) return <div className="admin-empty-row">No traffic data yet</div>
  return <div className="analytics-sparkline" aria-label={`${metric} over time`}>
    {data.map((item) => <span key={item.date} title={`${item.date}: ${formatNumber(item[metric])}`} style={{ height: `${Math.max((Number(item[metric] || 0) / max) * 100, 4)}%` }} />)}
  </div>
}

function downloadCsv(filename, rows) {
  if (!rows.length) {
    toast.error('There is no table data to export yet.')
    return
  }
  const headers = Object.keys(rows[0])
  const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function BusinessAnalyticsPanel({ data, loading, error }) {
  if (loading && !data) return <Loader label="Loading business analytics" />
  if (error && !data) return <div className="admin-empty-row admin-empty-row--warning">Business analytics could not be loaded. {error.message}</div>

  const overview = data?.overview || {}
  const segments = data?.customerSegments || []
  const revenueByService = data?.revenueByService || []
  const salesTrend = data?.salesTrend || []

  return <>
    <div className="admin-cards analytics-cards">
      <article><span>Booking revenue</span><Comparison item={overview.bookingRevenue} type="currency" /></article>
      <article><span>Collected revenue (paid)</span><Comparison item={overview.collectedRevenue} type="currency" /></article>
      <article><span>Average booking value</span><Comparison item={overview.averageBookingValue} type="currency" /></article>
      <article><span>Total bookings</span><Comparison item={overview.totalBookings} /></article>
      <article><span>Completed bookings</span><Comparison item={overview.completedBookings} /></article>
      <article><span>Cancelled / no-shows</span><strong>{formatNumber((overview.cancelledBookings?.current || 0) + (overview.noShowBookings?.current || 0))}</strong></article>
      <article><span>Total customers</span><Comparison item={overview.totalCustomers} /></article>
      <article><span>New customers</span><Comparison item={overview.newCustomers} /></article>
      <article><span>Returning customers</span><Comparison item={overview.returningCustomers} /></article>
    </div>

    <section className="admin-panel">
      <header><div><h2>Sales trend</h2><p>Daily booking revenue for the selected period, sourced from confirmed bookings — not GA4.</p></div></header>
      <Sparkline data={salesTrend} metric="revenue" />
    </section>

    <div className="admin-detail-grid admin-detail-grid--section">
      <section className="admin-panel">
        <header><div><h2>Revenue by service</h2><p>Top services by booked revenue this period.</p></div></header>
        <SimpleBars items={revenueByService} formatValue={formatCurrency} />
      </section>
      <section className="admin-panel">
        <header><div><h2>Customer frequency</h2><p>All-time booking-count segments across every registered customer.</p></div></header>
        <SimpleBars items={segments} />
      </section>
    </div>
  </>
}

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('business')
  const [preset, setPreset] = useState('28d')
  const [metric, setMetric] = useState('activeUsers')
  const fetcher = useMemo(() => () => getAdminAnalyticsOverview({ preset }), [preset])
  const { data, error, loading, setData } = useFetch(fetcher)
  const businessFetcher = useMemo(() => () => getAdminBusinessAnalytics({ preset }), [preset])
  const { data: businessData, error: businessError, loading: businessLoading, execute: refreshBusiness } = useFetch(businessFetcher)

  const sections = data?.sections || {}
  const status = data?.status
  const overview = sections.overview?.data || {}
  const disconnected = data && !status?.configured
  const reportError = status?.lastError

  const topPages = sections.topPages?.data || []
  const landingPages = sections.landingPages?.data || []
  const acquisition = sections.acquisition?.data || []
  const events = sections.events?.data || []
  const audience = sections.audience?.data || {}
  const realtime = sections.realtime?.data || {}
  const serviceInterest = sections.serviceInterest?.data || {}
  const bookingFunnel = sections.bookingFunnel?.data || []
  const waitlist = sections.waitlist?.data || {}

  const refresh = () => {
    if (activeTab === 'business') {
      return refreshBusiness().then(() => toast.success('Business analytics refreshed.')).catch(() => toast.error('Business analytics could not be refreshed.'))
    }
    return getAdminAnalyticsOverview({ preset, force: 'true' })
      .then((nextData) => {
        setData(nextData)
        toast.success('Analytics refreshed.')
      })
      .catch(() => toast.error('Analytics could not be refreshed.'))
  }

  if (activeTab === 'ga4' && loading && !data) return <><div className="admin-page-heading"><div><span className="eyebrow">Customer insight</span><h1>Analytics</h1><p>Loading customer behaviour and GA4 reporting.</p></div></div><Loader label="Loading analytics" /></>

  return <>
    <div className="admin-page-heading">
      <div>
        <span className="eyebrow">Customer insight</span>
        <h1>Analytics</h1>
        <p>Business analytics comes from Allay House bookings and customer records. Website analytics comes from GA4. The two are never mixed into the same figure.</p>
      </div>
      <div className="analytics-actions">
        <select value={preset} onChange={(event) => setPreset(event.target.value)} aria-label="Analytics date range">
          {presetOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <Button type="button" variant="outline" size="sm" onClick={refresh} loading={activeTab === 'business' ? businessLoading : loading}><RefreshCcw size={15} /> Refresh</Button>
        {activeTab === 'ga4' && status?.gaUrl && <a className="button button--ghost button--sm" href={status.gaUrl} target="_blank" rel="noreferrer">Open GA4 <ExternalLink size={15} /></a>}
      </div>
    </div>

    <div className="analytics-tabs" role="tablist" aria-label="Analytics source">
      <button type="button" role="tab" aria-selected={activeTab === 'business'} className={activeTab === 'business' ? 'is-active' : ''} onClick={() => setActiveTab('business')}>Business Analytics</button>
      <button type="button" role="tab" aria-selected={activeTab === 'ga4'} className={activeTab === 'ga4' ? 'is-active' : ''} onClick={() => setActiveTab('ga4')}>Website Analytics (GA4)</button>
    </div>

    {activeTab === 'business' && <BusinessAnalyticsPanel data={businessData} loading={businessLoading} error={businessError} />}

    {activeTab === 'ga4' && <>
      {error && <div className="admin-empty-row admin-empty-row--warning">Analytics could not be reached. Your admin session or backend connection may need attention.</div>}

      <section className="admin-panel analytics-status">
        <header><div><h2>Connection status</h2><p>Last updated {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleString('en-NG') : 'not yet'}.</p></div></header>
        {disconnected
          ? <div className="analytics-setup"><h3>GA4 reporting is not connected yet.</h3><p>Add these variables in the hosting environments, then rebuild the frontend and restart the backend.</p><div><span>Frontend</span><code>VITE_GA4_MEASUREMENT_ID</code></div><div><span>Backend</span><code>GA4_PROPERTY_ID</code><code>GA4_SERVICE_ACCOUNT_BASE64</code><small>or</small><code>GA4_CLIENT_EMAIL</code><code>GA4_PRIVATE_KEY</code></div></div>
          : <>
              {reportError && <div className="admin-empty-row admin-empty-row--warning analytics-diagnostic">
                <strong>{reportError.message}</strong>
                <span>Category: {reportError.diagnostic?.category || reportError.code}. Google status: {reportError.diagnostic?.googleStatusCode || 'not provided'}.</span>
                <span>Make sure the displayed service-account email has Viewer access to the displayed GA4 property in Google Analytics Property Access Management.</span>
              </div>}
              <div className="admin-detail-grid analytics-diagnostics-grid">
                <article><span>Report access</span><strong>{reportStateLabel(status)}</strong></article>
                <article><span>Credential mode</span><strong>{credentialModeLabel(status?.credentialMode)}</strong></article>
                <article><span>Property ID</span><strong>{status?.propertyId || 'Missing'}</strong></article>
                <article><span>Service account</span><strong>{serviceAccountLabel(status)}</strong></article>
                <article><span>Private key</span><strong>{privateKeyLabel(status)}</strong></article>
                <article><span>Date range</span><strong>{data?.dateRange?.startDate} to {data?.dateRange?.endDate}</strong></article>
                <article><span>Last attempt</span><strong>{formatDateTime(status?.lastAttemptedAt)}</strong></article>
                <article><span>Last success</span><strong>{formatDateTime(status?.lastSuccessfulAt)}</strong></article>
              </div>
            </>}
      </section>

      {!disconnected && <div className="admin-cards analytics-cards">
        <article><span>Active users</span><Comparison item={overview.activeUsers} /></article>
        <article><span>Total users</span><Comparison item={overview.totalUsers} /></article>
        <article><span>New website visitors</span><Comparison item={overview.newUsers} /></article>
        <article><span>Sessions</span><Comparison item={overview.sessions} /></article>
        <article><span>Views</span><Comparison item={overview.views} /></article>
        <article><span>Engagement rate</span><Comparison item={overview.engagementRate} type="percent" /></article>
        <article><span>Average session duration</span><Comparison item={overview.averageSessionDuration} type="duration" /></article>
        <article><span>Key events</span><Comparison item={overview.keyEvents} /></article>
        <article><span>Booking completions</span><Comparison item={overview.bookingCompletions} /></article>
        <article><span>Waitlist leads</span><Comparison item={overview.waitlistLeads} /></article>
      </div>}

      {!disconnected && <section className="admin-panel">
        <header><div><h2>Traffic over time</h2><p>Public route traffic from GA4. Page views exclude query-string values.</p></div><select value={metric} onChange={(event) => setMetric(event.target.value)}><option value="activeUsers">Active users</option><option value="sessions">Sessions</option><option value="views">Views</option></select></header>
        <SectionError error={sections.timeSeries?.error} />
        <Sparkline data={sections.timeSeries?.data || []} metric={metric} />
      </section>}

      {!disconnected && <div className="admin-detail-grid admin-detail-grid--section">
        <section className="admin-panel">
          <header><div><h2>Realtime</h2><p>Activity in the last 30 minutes.</p></div></header>
          <SectionError error={sections.realtime?.error} />
          <div className="analytics-realtime"><strong>{formatNumber(realtime.activeUsers)}</strong><span>active users now</span></div>
          <h3 className="analytics-subhead">Current pages</h3>
          <SimpleBars items={realtime.topPages || []} labelKey="page" valueKey="views" />
        </section>
        <section className="admin-panel">
          <header><div><h2>Current events</h2><p>Realtime event activity.</p></div></header>
          <SimpleBars items={realtime.topEvents || []} labelKey="eventName" valueKey="eventCount" />
          <h3 className="analytics-subhead">Devices</h3>
          <SimpleBars items={(realtime.devices || []).map((item) => ({ label: item.device, value: item.activeUsers }))} />
          <h3 className="analytics-subhead">Countries</h3>
          <SimpleBars items={(realtime.countries || []).map((item) => ({ label: item.country, value: item.activeUsers }))} />
        </section>
      </div>}

      {!disconnected && <section className="admin-panel">
        <header><div><h2>Top pages</h2><p>Most viewed public pages.</p></div><Button type="button" variant="outline" size="sm" onClick={() => downloadCsv('allay-top-pages.csv', topPages)}><Download size={15} /> CSV</Button></header>
        <SectionError error={sections.topPages?.error} />
        {topPages.length ? <div className="table-wrap"><table><thead><tr><th>Page</th><th>Path</th><th>Views</th><th>Users</th><th>Engagement</th></tr></thead><tbody>{topPages.map((page) => <tr key={`${page.path}-${page.title}`}><td>{page.title}</td><td>{page.path}</td><td>{formatNumber(page.views)}</td><td>{formatNumber(page.activeUsers)}</td><td>{formatDuration(page.engagementSeconds)}</td></tr>)}</tbody></table></div> : <div className="admin-empty-row">No page data yet</div>}
      </section>}

      {!disconnected && <section className="admin-panel">
        <header><div><h2>Landing pages</h2><p>Entry pages for public sessions.</p></div><Button type="button" variant="outline" size="sm" onClick={() => downloadCsv('allay-landing-pages.csv', landingPages)}><Download size={15} /> CSV</Button></header>
        <SectionError error={sections.landingPages?.error} />
        {landingPages.length ? <div className="table-wrap"><table><thead><tr><th>Landing page</th><th>Sessions</th><th>Users</th><th>Engaged</th><th>Key events</th></tr></thead><tbody>{landingPages.map((page) => <tr key={page.path}><td>{page.path}</td><td>{formatNumber(page.sessions)}</td><td>{formatNumber(page.activeUsers)}</td><td>{formatNumber(page.engagedSessions)}</td><td>{formatNumber(page.keyEvents)}</td></tr>)}</tbody></table></div> : <div className="admin-empty-row">No landing-page data yet</div>}
      </section>}

      {!disconnected && <div className="admin-detail-grid admin-detail-grid--section">
        <section className="admin-panel">
          <header><div><h2>Acquisition</h2><p>Channels and sources sending sessions.</p></div><Button type="button" variant="outline" size="sm" onClick={() => downloadCsv('allay-acquisition.csv', acquisition)}><Download size={15} /> CSV</Button></header>
          <SectionError error={sections.acquisition?.error} />
          {acquisition.length ? <div className="table-wrap"><table><thead><tr><th>Channel</th><th>Source</th><th>Medium</th><th>Sessions</th><th>Engaged</th></tr></thead><tbody>{acquisition.map((row) => <tr key={`${row.channel}-${row.source}-${row.medium}`}><td>{row.channel}</td><td>{row.source}</td><td>{row.medium}</td><td>{formatNumber(row.sessions)}</td><td>{formatNumber(row.engagedSessions)}</td></tr>)}</tbody></table></div> : <div className="admin-empty-row">No acquisition data yet</div>}
        </section>
        <section className="admin-panel">
          <header><div><h2>Audience</h2><p>Aggregate device and location signals.</p></div></header>
          <h3 className="analytics-subhead">Devices</h3>
          <SimpleBars items={audience.devices || []} />
          <h3 className="analytics-subhead">Browsers</h3>
          <SimpleBars items={audience.browsers || []} />
          <h3 className="analytics-subhead">Operating systems</h3>
          <SimpleBars items={audience.operatingSystems || []} />
          <h3 className="analytics-subhead">Countries</h3>
          <SimpleBars items={audience.countries || []} />
          <h3 className="analytics-subhead">Cities</h3>
          <SimpleBars items={audience.cities || []} />
          <h3 className="analytics-subhead">New vs returning</h3>
          <SimpleBars items={audience.returning || []} />
        </section>
      </div>}

      {!disconnected && <section className="admin-panel">
        <header><div><h2>Events</h2><p>Allay events are shown beside standard GA4 events.</p></div><Button type="button" variant="outline" size="sm" onClick={() => downloadCsv('allay-events.csv', events)}><Download size={15} /> CSV</Button></header>
        <SectionError error={sections.events?.error} />
        {events.length ? <div className="table-wrap"><table><thead><tr><th>Event</th><th>Count</th><th>Active users</th><th>Key events</th></tr></thead><tbody>{events.map((event) => <tr key={event.eventName}><td>{event.eventName}</td><td>{formatNumber(event.eventCount)}</td><td>{formatNumber(event.activeUsers)}</td><td>{formatNumber(event.keyEvents)}</td></tr>)}</tbody></table></div> : <div className="admin-empty-row">No events yet</div>}
      </section>}

      {!disconnected && <div className="admin-detail-grid admin-detail-grid--section">
        <section className="admin-panel">
          <header><div><h2>Service interest</h2><p>Uses GA4 event-scoped custom dimensions.</p></div></header>
          <SectionError error={sections.serviceInterest?.error} />
          {serviceInterest.setupNeeded
            ? <div className="analytics-setup"><h3>Custom definitions needed</h3><p>Create these GA4 event-scoped custom dimensions to unlock service reports.</p>{(serviceInterest.missingCustomDimensions || []).map((dimension) => <code key={dimension}>{dimension.replace('customEvent:', '')}</code>)}</div>
            : <>
                <h3 className="analytics-subhead">Most viewed services</h3>
                <SimpleBars items={serviceInterest.viewed || []} labelKey="service" valueKey="count" />
                <h3 className="analytics-subhead">Most selected services</h3>
                <SimpleBars items={serviceInterest.selected || []} labelKey="service" valueKey="count" />
                <h3 className="analytics-subhead">Booking starts by service</h3>
                <SimpleBars items={serviceInterest.bookingStarts || []} labelKey="service" valueKey="count" />
                <h3 className="analytics-subhead">Booking completions by service</h3>
                <SimpleBars items={serviceInterest.bookingCompletions || []} labelKey="service" valueKey="count" />
                <h3 className="analytics-subhead">Service categories</h3>
                <SimpleBars items={serviceInterest.categories || []} labelKey="category" valueKey="count" />
              </>}
        </section>
        <section className="admin-panel">
          <header><div><h2>Waitlist</h2><p>Lead generation based on successful waitlist saves.</p></div></header>
          <div className="admin-detail-grid"><article><span>Starts</span><strong>{formatNumber(waitlist.starts)}</strong></article><article><span>Leads</span><strong>{formatNumber(waitlist.leads)}</strong></article><article><span>Completion</span><strong>{formatPercent(waitlist.completionRate)}</strong></article></div>
        </section>
      </div>}

      {!disconnected && <section className="admin-panel">
        <header><div><h2>Booking journey</h2><p>Event progression report. Counts are event totals, not guaranteed unique sequential users.</p></div></header>
        <SectionError error={sections.bookingFunnel?.error} />
        {bookingFunnel.length ? <div className="table-wrap"><table><thead><tr><th>Stage</th><th>Events</th><th>Of first stage</th><th>Drop-off</th></tr></thead><tbody>{bookingFunnel.map((stage) => <tr key={stage.eventName}><td>{stage.label}</td><td>{formatNumber(stage.count)}</td><td>{formatPercent(stage.percentOfFirst)}</td><td>{formatPercent(stage.dropoffFromPrevious)}</td></tr>)}</tbody></table></div> : <div className="admin-empty-row">No booking journey events yet</div>}
      </section>}
    </>}
  </>
}
