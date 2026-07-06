import Badge from '../../components/common/Badge'

const stats = [
  { label: 'Today’s bookings', value: '—', note: 'Awaiting Booking API' },
  { label: 'Upcoming bookings', value: '—', note: 'Awaiting Booking API' },
  { label: 'Waitlist', value: '—', note: 'Awaiting Waitlist API' },
  { label: 'Booking status', value: 'Paused', note: 'Pre-launch mode' },
]

export default function Dashboard() {
  return <><div className="admin-page-heading"><div><span className="eyebrow">Control room</span><h1>Good morning.</h1><p>Your operational overview is ready for live data connections.</p></div><Badge status="pending">Pre-launch</Badge></div><div className="admin-cards">{stats.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></article>)}</div><section className="admin-panel"><header><div><h2>Recent activity</h2><p>Bookings, payments, and waitlist activity will appear here.</p></div></header><div className="admin-empty-row">No live activity yet.</div></section></>
}

