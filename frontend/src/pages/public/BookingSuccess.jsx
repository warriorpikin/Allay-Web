import { CalendarDays, Check, Clock3, Mail, MessageCircle, Printer } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useLocation } from 'react-router-dom'
import Button from '../../components/common/Button'
import { markWhatsAppHandoff } from '../../services/bookingApi'
import { formatCurrency } from '../../utils/formatCurrency'
import { prepareWhatsAppHandoff } from '../../utils/whatsapp'

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
  const [openingWhatsApp, setOpeningWhatsApp] = useState(false)

  const continueOnWhatsApp = async () => {
    if (!confirmation?.whatsapp?.url) {
      toast.error('WhatsApp is not configured for this request yet.')
      return
    }
    setOpeningWhatsApp(true)
    try {
      await markWhatsAppHandoff(confirmation.reference).catch(() => null)
      const handoff = await prepareWhatsAppHandoff(confirmation.whatsapp)
      if (handoff.copied) toast.success('Booking details copied. Paste them into the Allay House chat if needed.')
      window.location.assign(confirmation.whatsapp.url)
    } catch (error) {
      toast.error(error.message || 'Could not open WhatsApp. Please try again.')
      setOpeningWhatsApp(false)
    }
  }

  if (!confirmation) {
    return <section className="success-page section">
      <span className="success-page__icon"><Check /></span>
      <span className="eyebrow">Booking request</span>
      <h1>Your booking request was received.</h1>
      <p>If you just completed a request, check your email or contact Allay House with the email address and phone number you used.</p>
      <Button to="/book">Start another booking</Button>
      <Link className="text-link" to="/contact">Contact Allay House</Link>
    </section>
  }

  return <section className="success-page success-page--receipt section">
    <span className="success-page__icon"><Check /></span>
    <span className="eyebrow">Request saved</span>
    <h1>Finish your booking on WhatsApp.</h1>
    <p>{confirmation.emailSent ? 'A copy of this pending request has been emailed to you. ' : ''}Send the prepared WhatsApp message so the Allay House team can confirm availability, the final price, and payment. Your appointment is not confirmed yet.</p>

    <div className="booking-receipt">
      <header><div><span>Booking code</span><strong>{confirmation.reference}</strong></div><small>{confirmation.status || 'pending'}</small></header>
      <div className="booking-receipt__grid">
        <p><Mail size={15} /><span>{confirmation.customer?.fullName}<small>{confirmation.customer?.email}</small></span></p>
        <p><CalendarDays size={15} /><span>{confirmation.date}<small>Preferred date</small></span></p>
        <p><Clock3 size={15} /><span>{confirmation.time}<small>{confirmation.totalDurationMinutes || 0} minutes planned</small></span></p>
      </div>
      <div className="booking-receipt__services">
        {services.map((service) => <div key={service.id || service.slug}>
          <span><strong>{service.name}</strong>{service.durationLabel && <small>{service.durationLabel}</small>}</span>
          <b>{formatCurrency(service.price)}</b>
        </div>)}
      </div>
      <dl>
        <div><dt>Subtotal</dt><dd>{formatCurrency(confirmation.subtotal || 0)}</dd></div>
        <div><dt>Discount</dt><dd>{confirmation.discountAmount ? `-${formatCurrency(confirmation.discountAmount)}` : '-'}</dd></div>
        <div><dt>{confirmation.priceIsEstimated ? 'Estimated total' : 'Total before confirmation'}</dt><dd>{formatCurrency(confirmation.totalAmount || 0)}</dd></div>
      </dl>
    </div>

    <div className="success-page__actions">
      <Button type="button" loading={openingWhatsApp} onClick={continueOnWhatsApp}><MessageCircle size={17} /> Complete booking</Button>
      <Button to="/book" variant="outline">Book another service</Button>
      <Button type="button" variant="ghost" onClick={() => window.print()}><Printer size={15} /> Print</Button>
    </div>
    {confirmation.whatsapp?.requiresCopy && <p className="success-page__note">Because Allay House supplied a WhatsApp business short link, the prepared message will be copied before the chat opens. Paste it into WhatsApp if it does not appear automatically.</p>}
  </section>
}
