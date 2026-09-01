import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import Loader from '../../components/common/Loader'
import Input from '../../components/forms/Input'
import { exportBookingsCsv, getBookings } from '../../services/adminApi'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

function formatTime(value) {
  return String(value || '').slice(0, 5) || '-'
}

function downloadBlob(blob, disposition) {
  const filename = disposition?.match(/filename="?([^";]+)"?/i)?.[1] || `allay-house-bookings-${new Date().toISOString().slice(0, 10)}.csv`
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [search, setSearch] = useState('')
  const [searchField, setSearchField] = useState('any')
  const [status, setStatus] = useState('pending')
  const [paymentStatus, setPaymentStatus] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      setLoading(true)
      getBookings({ search, searchField, status, paymentStatus, page, limit: 50 })
        .then((data) => {
          if (cancelled) return
          setBookings(data.bookings || [])
          setPagination(data.pagination || { page, total: data.bookings?.length || 0, totalPages: 1 })
        })
        .catch(() => { if (!cancelled) toast.error('Could not load bookings.') })
        .finally(() => { if (!cancelled) setLoading(false) })
    }, 260)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [page, paymentStatus, search, searchField, status])

  const updateFilter = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }

  const exportCsv = async () => {
    setExporting(true)
    try {
      const result = await exportBookingsCsv({ search, searchField, status, paymentStatus })
      downloadBlob(result.blob, result.disposition)
      toast.success('Booking CSV exported.')
    } catch {
      toast.error('Could not export bookings.')
    } finally {
      setExporting(false)
    }
  }

  return <>
    <div className="admin-page-heading">
      <div><span className="eyebrow">Appointments</span><h1>Bookings</h1><p>Find pending requests, compare booking codes and customer details, record payment, and confirm appointments manually.</p></div>
      <Button type="button" variant="outline" loading={exporting} onClick={exportCsv}><Download size={16} /> Export CSV</Button>
    </div>
    <section className="admin-panel">
      <div className="admin-filters admin-booking-filters">
        <select aria-label="Search bookings by" value={searchField} onChange={updateFilter(setSearchField)}>
          <option value="any">Search everything</option>
          <option value="reference">Booking code</option>
          <option value="name">Customer name</option>
          <option value="email">Email address</option>
          <option value="phone">Phone number</option>
          <option value="service">Service name</option>
        </select>
        <Input id="booking-search" placeholder="Type a name, email, phone, service, or booking code" aria-label="Search bookings" value={search} onChange={updateFilter(setSearch)} />
        <select aria-label="Booking status" value={status} onChange={updateFilter(setStatus)}>
          <option value="all">All booking statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No show</option>
        </select>
        <select aria-label="Payment status" value={paymentStatus} onChange={updateFilter(setPaymentStatus)}>
          <option value="all">All payment statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <p className="admin-results-count">{pagination.total} matching booking{pagination.total === 1 ? '' : 's'}</p>
      {loading ? <Loader label="Loading bookings" /> : !bookings.length ? <EmptyState title="No bookings found" message="Try a different search field or status. New guest and signed-in requests appear here as soon as they are saved." /> : <div className="table-wrap">
        <table>
          <thead><tr><th>Booking code</th><th>Customer</th><th>Service</th><th>Date</th><th>Time</th><th>Total</th><th>Paid</th><th>Status</th><th>Payment</th><th>WhatsApp</th><th>Created</th><th /></tr></thead>
          <tbody>
            {bookings.map((booking) => <tr key={booking.id}>
              <td><strong>{booking.bookingReference}</strong></td>
              <td><span className="admin-service-name">{booking.customerName || '-'}<small>{booking.customerEmail || '-'} / {booking.customerPhone || '-'}</small></span></td>
              <td><span className="admin-table-copy">{booking.serviceNames || '-'}</span></td>
              <td>{formatDate(booking.appointmentDate)}</td>
              <td>{formatTime(booking.startTime)}</td>
              <td>{formatCurrency(booking.totalAmount || 0)}</td>
              <td>{formatCurrency(booking.amountPaid || 0)}</td>
              <td><Badge status={booking.status}>{booking.status}</Badge></td>
              <td><Badge status={booking.paymentStatus}>{booking.paymentStatus}</Badge></td>
              <td><Badge status={booking.whatsappHandoffAt ? 'confirmed' : 'unpaid'}>{booking.whatsappHandoffAt ? 'Directed' : 'Saved only'}</Badge></td>
              <td>{formatDate(booking.createdAt)}</td>
              <td><Link to={`/allay-admin/bookings/${booking.id}`}>Review</Link></td>
            </tr>)}
          </tbody>
        </table>
      </div>}

      {pagination.totalPages > 1 && <div className="admin-pagination">
        <span>Page {pagination.page} of {pagination.totalPages}</span>
        <div><Button type="button" size="sm" variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</Button><Button type="button" size="sm" variant="outline" disabled={page >= pagination.totalPages || loading} onClick={() => setPage((current) => current + 1)}>Next</Button></div>
      </div>}
    </section>
  </>
}
