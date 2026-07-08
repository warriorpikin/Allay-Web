import Badge from '../../components/common/Badge'
import Loader from '../../components/common/Loader'
import { useFetch } from '../../hooks/useFetch'
import { getDashboardStats } from '../../services/adminApi'
import { formatCurrency } from '../../utils/formatCurrency'

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Dashboard() {
  const { data, loading } = useFetch(getDashboardStats)

  if (loading) return <><div className="admin-page-heading"><div><span className="eyebrow">Control room</span><h1>Good morning.</h1><p>Your operational overview is ready for live data connections.</p></div></div><Loader label="Loading dashboard" /></>

  const siteMode = data?.siteMode === 'live' ? 'live' : 'prelaunch'
  const bookings = data?.bookings || { today: 0, upcoming: 0, pending: 0, confirmed: 0 }
  const waitlist = data?.waitlist || { total: 0, recent: [] }
  const recentBookings = data?.recentBookings || []
  const popularServices = data?.popularServices || []
  const revenue = data?.revenue || { trackingActive: false, message: 'Revenue tracking will activate once payment confirmation is connected.' }

  const stats = [
    { label: 'Today’s bookings', value: bookings.today, note: 'Appointments scheduled today' },
    { label: 'Upcoming bookings', value: bookings.upcoming, note: 'Pending or confirmed, ahead' },
    { label: 'Pending bookings', value: bookings.pending, note: 'Awaiting confirmation' },
    { label: 'Confirmed bookings', value: bookings.confirmed, note: 'Ready to welcome' },
    { label: 'Waitlist', value: waitlist.total, note: 'Total signups' },
    { label: 'Customers', value: data?.customers?.total ?? 0, note: 'Total on file' },
    { label: 'Active services', value: data?.services?.active ?? 0, note: 'Live on the menu' },
    { label: 'Site mode', value: siteMode === 'live' ? 'Live' : 'Pre-launch', note: siteMode === 'live' ? 'Booking is the primary CTA' : 'Waitlist is the primary CTA' },
  ]

  return <>
    <div className="admin-page-heading">
      <div><span className="eyebrow">Control room</span><h1>Good morning.</h1><p>Your operational overview, from real bookings and waitlist data.</p></div>
      <Badge status={siteMode === 'live' ? 'confirmed' : 'pending'}>{siteMode === 'live' ? 'Live' : 'Pre-launch'}</Badge>
    </div>

    <div className="admin-cards">{stats.map((item) => <article key={item.label}><span>{item.label}</span><strong className={typeof item.value === 'string' ? 'admin-cards__value--text' : ''}>{item.value}</strong><small>{item.note}</small></article>)}</div>

    <div className="admin-detail-grid admin-detail-grid--section">
      <section className="admin-panel">
        <header><div><h2>Recent bookings</h2><p>Latest appointment requests.</p></div></header>
        {recentBookings.length ? <div className="table-wrap"><table><thead><tr><th>Reference</th><th>Customer</th><th>Date</th><th>Status</th></tr></thead><tbody>{recentBookings.map((booking) => <tr key={booking.id}><td>{booking.bookingReference}</td><td>{booking.customerName}</td><td>{formatDate(booking.appointmentDate)}</td><td><Badge status={booking.status}>{booking.status}</Badge></td></tr>)}</tbody></table></div> : <div className="admin-empty-row">No bookings yet</div>}
      </section>

      <section className="admin-panel">
        <header><div><h2>Recent waitlist signups</h2><p>Latest interest from the public waitlist.</p></div></header>
        {waitlist.recent?.length ? <div className="admin-list">{waitlist.recent.map((entry) => <article key={entry.id}><div><strong>{entry.email}</strong><small>Joined {formatDate(entry.createdAt)}</small></div></article>)}</div> : <div className="admin-empty-row">No waitlist signups yet</div>}
      </section>
    </div>

    <section className="admin-panel">
      <header><div><h2>Popular services</h2><p>Most selected across current bookings.</p></div></header>
      {popularServices.length ? <div className="admin-list">{popularServices.map((service) => <article key={service.name}><div><strong>{service.name}</strong><small>{service.count} booking{service.count === 1 ? '' : 's'}</small></div></article>)}</div> : <div className="admin-empty-row">No recent activity yet</div>}
    </section>

    <section className="admin-panel">
      <header><div><h2>Revenue</h2><p>Only shown once payment confirmation is reliable.</p></div></header>
      {revenue.trackingActive
        ? <div className="admin-detail-grid"><article><span>Confirmed revenue</span><strong>{formatCurrency(revenue.confirmedTotal)}</strong></article><article><span>Unpaid booking value</span><strong>{formatCurrency(revenue.unpaidTotal)}</strong></article></div>
        : <div className="admin-empty-row">{revenue.message}</div>}
    </section>
  </>
}
