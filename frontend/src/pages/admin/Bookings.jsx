import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge'
import EmptyState from '../../components/common/EmptyState'
import Loader from '../../components/common/Loader'
import Input from '../../components/forms/Input'
import { getBookings } from '../../services/adminApi'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

function formatTime(value) {
  return String(value || '').slice(0, 5) || '-'
}

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  useEffect(() => {
    setLoading(true)
    getBookings()
      .then((data) => setBookings(data.bookings || []))
      .catch(() => toast.error('Could not load bookings.'))
      .finally(() => setLoading(false))
  }, [])

  const filteredBookings = useMemo(() => {
    const searchText = search.trim().toLowerCase()
    return bookings.filter((booking) => {
      const matchesStatus = status === 'all' || booking.status === status
      const matchesSearch = !searchText || [
        booking.bookingReference,
        booking.customerName,
        booking.customerEmail,
        booking.customerPhone,
        booking.serviceNames,
      ].some((value) => String(value || '').toLowerCase().includes(searchText))
      return matchesStatus && matchesSearch
    })
  }, [bookings, search, status])

  return <>
    <div className="admin-page-heading"><div><span className="eyebrow">Appointments</span><h1>Bookings</h1><p>Search, filter, and manage customer appointments.</p></div></div>
    <section className="admin-panel">
      <div className="admin-filters">
        <Input id="booking-search" placeholder="Search customer, phone, email, service, or reference" aria-label="Search bookings" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select aria-label="Booking status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No show</option>
        </select>
      </div>

      {loading ? <Loader label="Loading bookings" /> : !filteredBookings.length ? <EmptyState title="No bookings found" message="Confirmed booking requests will appear here with customer and service details." /> : <div className="table-wrap">
        <table>
          <thead><tr><th>Reference</th><th>Customer</th><th>Service</th><th>Date</th><th>Time</th><th>Duration</th><th>Total</th><th>Status</th><th>Payment</th><th>Created</th><th /></tr></thead>
          <tbody>
            {filteredBookings.map((booking) => <tr key={booking.id}>
              <td>{booking.bookingReference}</td>
              <td><span className="admin-service-name">{booking.customerName || '-'}<small>{booking.customerEmail || '-'} / {booking.customerPhone || '-'}</small></span></td>
              <td>{booking.serviceNames || '-'}</td>
              <td>{formatDate(booking.appointmentDate)}</td>
              <td>{formatTime(booking.startTime)}</td>
              <td>{booking.totalDurationMinutes || 0} mins</td>
              <td>{formatCurrency(booking.totalAmount || 0)}</td>
              <td><Badge status={booking.status}>{booking.status}</Badge></td>
              <td><Badge status={booking.paymentStatus}>{booking.paymentStatus}</Badge></td>
              <td>{formatDate(booking.createdAt)}</td>
              <td><Link to={`/allay-admin/bookings/${booking.id}`}>View</Link></td>
            </tr>)}
          </tbody>
        </table>
      </div>}
    </section>
  </>
}
