import { CheckCircle2, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Loader from '../../components/common/Loader'
import Input from '../../components/forms/Input'
import Textarea from '../../components/forms/Textarea'
import { confirmAdminBooking, getAdminBooking, updateBookingStatus } from '../../services/adminApi'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

function formatTime(value) {
  return String(value || '').slice(0, 5) || '-'
}

function dateInputValue(value) {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

function whatsappNumber(value) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.startsWith('0') ? `234${digits.slice(1)}` : digits
}

function confirmationForm(booking) {
  return {
    appointmentDate: dateInputValue(booking?.appointment_date),
    startTime: formatTime(booking?.start_time) === '-' ? '' : formatTime(booking?.start_time),
    totalAmount: String(booking?.total_amount ?? ''),
    amountPaid: String(booking?.amount_paid ?? booking?.total_amount ?? 0),
    markPaid: booking?.payment_status === 'paid',
    adminNote: booking?.admin_note || '',
  }
}

export default function BookingDetails() {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [services, setServices] = useState([])
  const [form, setForm] = useState(confirmationForm(null))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusSaving, setStatusSaving] = useState('')

  useEffect(() => {
    setLoading(true)
    getAdminBooking(id)
      .then((data) => {
        setBooking(data.booking)
        setServices(data.services || [])
        setForm(confirmationForm(data.booking))
      })
      .catch(() => toast.error('Could not load booking details.'))
      .finally(() => setLoading(false))
  }, [id])

  const updateForm = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updatePaidStatus = (event) => {
    const markPaid = event.target.checked
    setForm((current) => ({
      ...current,
      markPaid,
      amountPaid: markPaid && Number(current.amountPaid || 0) <= 0 ? current.totalAmount : current.amountPaid,
    }))
  }

  const confirm = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const data = await confirmAdminBooking(id, {
        appointmentDate: form.appointmentDate,
        startTime: form.startTime,
        totalAmount: Number(form.totalAmount),
        amountPaid: Number(form.amountPaid || 0),
        markPaid: form.markPaid,
        adminNote: form.adminNote,
      })
      setBooking(data.booking)
      setServices(data.services || services)
      setForm(confirmationForm(data.booking))
      toast.success(data.emailStatus?.customer ? 'Booking confirmed and the customer was emailed.' : 'Booking confirmed. Email delivery was not available.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not confirm this booking.')
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (status) => {
    setStatusSaving(status)
    try {
      const data = await updateBookingStatus(id, { status })
      setBooking(data.booking)
      toast.success(`Booking marked ${status.replace('_', ' ')}.`)
    } catch {
      toast.error('Could not update booking status.')
    } finally {
      setStatusSaving('')
    }
  }

  if (loading) return <><div className="admin-page-heading"><div><span className="eyebrow">Booking</span><h1>Booking details</h1><p>Customer, service, schedule, and payment information.</p></div></div><Loader label="Loading booking" /></>
  if (!booking) return <><div className="admin-page-heading"><div><span className="eyebrow">Booking</span><h1>Booking not found</h1><p>This booking could not be loaded.</p></div></div></>

  return <>
    <div className="admin-page-heading">
      <div><span className="eyebrow">Booking code</span><h1>{booking.booking_reference}</h1><p>Compare the customer’s WhatsApp message with this saved request before confirming it.</p></div>
      <div className="admin-heading-actions"><Badge status={booking.status}>{booking.status}</Badge><Badge status={booking.payment_status}>{booking.payment_status}</Badge></div>
    </div>

    <div className="admin-detail-grid">
      <section className="admin-panel">
        <h2>Request summary</h2>
        <dl>
          <div><dt>Preferred date</dt><dd>{formatDate(booking.appointment_date)}</dd></div>
          <div><dt>Preferred time</dt><dd>{formatTime(booking.start_time)} – {formatTime(booking.end_time)}</dd></div>
          <div><dt>Planned duration</dt><dd>{booking.total_duration_minutes || 0} mins</dd></div>
          <div><dt>Catalogue subtotal</dt><dd>{formatCurrency(booking.subtotal || 0)}</dd></div>
          <div><dt>Discount</dt><dd>{formatCurrency(booking.discount_amount || 0)}</dd></div>
          <div><dt>Current total</dt><dd>{formatCurrency(booking.total_amount || 0)}</dd></div>
          <div><dt>Amount paid</dt><dd>{formatCurrency(booking.amount_paid || 0)}</dd></div>
          <div><dt>WhatsApp handoff</dt><dd>{booking.whatsapp_handoff_at ? <Badge status="confirmed">Directed</Badge> : <Badge status="unpaid">Not opened</Badge>}</dd></div>
          <div><dt>Created</dt><dd>{formatDate(booking.created_at)}</dd></div>
        </dl>
      </section>

      <section className="admin-panel">
        <h2>Customer</h2>
        <dl>
          <div><dt>Name</dt><dd>{booking.customer_name || '-'}</dd></div>
          <div><dt>Email</dt><dd>{booking.customer_email || '-'}</dd></div>
          <div><dt>Phone</dt><dd>{booking.customer_phone || '-'}</dd></div>
          <div><dt>Customer note</dt><dd>{booking.customer_note || '-'}</dd></div>
          <div><dt>Admin note</dt><dd>{booking.admin_note || '-'}</dd></div>
        </dl>
        <a className="text-link" href={`https://wa.me/${whatsappNumber(booking.customer_phone)}`} target="_blank" rel="noreferrer"><MessageCircle size={15} /> Message customer</a>
      </section>
    </div>

    <section className="admin-panel admin-panel--wide">
      <header><div><h2>Selected services</h2><p>Snapshot prices saved when the customer created the request.</p></div></header>
      <div className="table-wrap"><table><thead><tr><th>Service</th><th>Duration</th><th>Saved price</th></tr></thead><tbody>{services.map((service) => <tr key={service.id}><td>{service.service_name}</td><td>{service.duration_minutes} mins</td><td>{formatCurrency(service.price)}</td></tr>)}</tbody></table></div>
    </section>

    <form className="admin-panel admin-confirm-booking" onSubmit={confirm}>
      <header><div><h2>Confirm booking manually</h2><p>Verify the agreed date and final price, record what the customer paid, then confirm. This sends the customer a final confirmation email.</p></div><CheckCircle2 size={24} /></header>
      <div className="admin-form-grid">
        <Input id="confirm-booking-date" label="Confirmed date" type="date" required value={form.appointmentDate} onChange={updateForm('appointmentDate')} />
        <Input id="confirm-booking-time" label="Confirmed start time" type="time" required value={form.startTime} onChange={updateForm('startTime')} />
        <Input id="confirm-booking-total" label="Final total price (₦)" type="number" min="0" step="100" required value={form.totalAmount} onChange={updateForm('totalAmount')} />
        <Input id="confirm-booking-paid" label="Amount paid (₦)" type="number" min="0" step="100" required value={form.amountPaid} onChange={updateForm('amountPaid')} />
      </div>
      <label className="admin-toggle-row"><input type="checkbox" checked={form.markPaid} onChange={updatePaidStatus} /><span><strong>Mark payment as paid</strong><small>Use this after comparing the payment and booking code. Leave it off when confirming an unpaid or deposit-only request.</small></span></label>
      <Textarea id="confirm-booking-note" label="Internal confirmation note" value={form.adminNote} onChange={updateForm('adminNote')} />
      <div className="admin-confirm-booking__actions">
        <Button type="submit" loading={saving}>{booking.status === 'confirmed' ? 'Update confirmed booking' : 'Confirm booking'}</Button>
        {booking.status !== 'completed' && <Button type="button" variant="outline" loading={statusSaving === 'completed'} disabled={Boolean(statusSaving) || saving} onClick={() => changeStatus('completed')}>Mark completed</Button>}
        {booking.status !== 'cancelled' && <Button type="button" variant="ghost" loading={statusSaving === 'cancelled'} disabled={Boolean(statusSaving) || saving} onClick={() => changeStatus('cancelled')}>Cancel booking</Button>}
        {booking.status !== 'pending' && <Button type="button" variant="ghost" loading={statusSaving === 'pending'} disabled={Boolean(statusSaving) || saving} onClick={() => changeStatus('pending')}>Return to pending</Button>}
      </div>
    </form>

    <Link className="text-link" to="/allay-admin/bookings">Back to bookings</Link>
  </>
}
