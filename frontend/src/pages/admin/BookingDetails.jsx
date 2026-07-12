import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge'
import Loader from '../../components/common/Loader'
import { getAdminBooking } from '../../services/adminApi'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

function formatTime(value) {
  return String(value || '').slice(0, 5) || '-'
}

export default function BookingDetails() {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getAdminBooking(id)
      .then((data) => {
        setBooking(data.booking)
        setServices(data.services || [])
      })
      .catch(() => toast.error('Could not load booking details.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <><div className="admin-page-heading"><div><span className="eyebrow">Booking</span><h1>Booking details</h1><p>Customer, service, schedule, and payment information.</p></div></div><Loader label="Loading booking" /></>
  if (!booking) return <><div className="admin-page-heading"><div><span className="eyebrow">Booking</span><h1>Booking not found</h1><p>This booking could not be loaded.</p></div></div></>

  return <>
    <div className="admin-page-heading">
      <div><span className="eyebrow">Booking {booking.booking_reference}</span><h1>Booking details</h1><p>Customer, service, schedule, and payment information.</p></div>
      <Badge status={booking.status}>{booking.status}</Badge>
    </div>
    <div className="admin-detail-grid">
      <section className="admin-panel">
        <h2>Appointment</h2>
        <dl>
          <div><dt>Services</dt><dd>{services.length ? services.map((service) => service.service_name).join(', ') : '-'}</dd></div>
          <div><dt>Date</dt><dd>{formatDate(booking.appointment_date)}</dd></div>
          <div><dt>Preferred time</dt><dd>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</dd></div>
          <div><dt>Duration</dt><dd>{booking.total_duration_minutes || 0} mins</dd></div>
          <div><dt>Total amount</dt><dd>{formatCurrency(booking.total_amount || 0)}</dd></div>
          <div><dt>Payment</dt><dd><Badge status={booking.payment_status}>{booking.payment_status}</Badge></dd></div>
          <div><dt>Status</dt><dd><Badge status={booking.status}>{booking.status}</Badge></dd></div>
        </dl>
      </section>
      <section className="admin-panel">
        <h2>Customer</h2>
        <dl>
          <div><dt>Name</dt><dd>{booking.customer_name || '-'}</dd></div>
          <div><dt>Email</dt><dd>{booking.customer_email || '-'}</dd></div>
          <div><dt>Phone</dt><dd>{booking.customer_phone || '-'}</dd></div>
          <div><dt>Notes</dt><dd>{booking.customer_note || '-'}</dd></div>
          <div><dt>Created</dt><dd>{formatDate(booking.created_at)}</dd></div>
          <div><dt>Last updated</dt><dd>{formatDate(booking.updated_at)}</dd></div>
        </dl>
        <Link className="text-link" to="/allay-admin/bookings">Back to bookings</Link>
      </section>
    </div>
  </>
}
