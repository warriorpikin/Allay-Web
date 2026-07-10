import { CalendarDays, Check, Clock3, Mail, Printer } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import Button from '../../components/common/Button'
import { formatCurrency } from '../../utils/formatCurrency'

function readStoredConfirmation() {
  try {
    return JSON.parse(sessionStorage.getItem('allay:lastBookingConfirmation') || 'null')
  } catch {
    return null
  }
}

export default function BookingSuccess() {
  const { state } = useLocation()
  const confirmation = state?.confirmation || readStoredConfirmation()
  const services = confirmation?.services || []

  if (!confirmation) {
    return <section className="success-page section">
      <span className="success-page__icon"><Check /></span>
      <span className="eyebrow">Booking confirmation</span>
      <h1>Your booking was received.</h1>
      <p>If you have just completed a booking, please check your email or contact Allay House with the email address used for the appointment.</p>
      <Button to="/book">Book another service</Button>
      <Link className="text-link" to="/contact">Contact Allay House</Link>
    </section>
  }

  return <section className="success-page success-page--receipt section">
    <span className="success-page__icon"><Check /></span>
    <span className="eyebrow">Booking confirmed</span>
    <h1>Your session has been booked successfully.</h1>
    <p>{confirmation.emailSent ? 'Your booking details have been sent to your email address. Please check your inbox for your confirmation and important information about your appointment.' : 'Your booking is confirmed. We could not confirm email delivery immediately, so please save your booking reference.'}</p>

    <div className="booking-receipt">
      <header><div><span>Reference</span><strong>{confirmation.reference}</strong></div><small>{confirmation.status || 'confirmed'}</small></header>
      <div className="booking-receipt__grid">
        <p><Mail size={15} /><span>{confirmation.customer?.fullName}<small>{confirmation.customer?.email}</small></span></p>
        <p><CalendarDays size={15} /><span>{confirmation.date}<small>Appointment date</small></span></p>
        <p><Clock3 size={15} /><span>{confirmation.time}<small>{confirmation.totalDurationMinutes || 0} minutes</small></span></p>
      </div>
      <div className="booking-receipt__services">
        {services.map((service) => <div key={service.id || service.slug}>
          <span><strong>{service.name}</strong><small>{service.durationMinutes} minutes</small></span>
          <b>{formatCurrency(service.price)}</b>
        </div>)}
      </div>
      <dl>
        <div><dt>Subtotal</dt><dd>{formatCurrency(confirmation.subtotal || 0)}</dd></div>
        <div><dt>Discount</dt><dd>{confirmation.discountAmount ? `-${formatCurrency(confirmation.discountAmount)}` : '-'}</dd></div>
        <div><dt>Total</dt><dd>{formatCurrency(confirmation.totalAmount || 0)}</dd></div>
      </dl>
    </div>

    <div className="success-page__actions">
      <Button to="/">Return home</Button>
      <Button to="/book" variant="outline">Book another service</Button>
      <Button type="button" variant="ghost" onClick={() => window.print()}><Printer size={15} /> Print</Button>
    </div>
  </section>
}
