import { CalendarDays, Check, Clock3, Copy, Mail, MessageCircle, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link, useLocation } from 'react-router-dom'
import Button from '../../components/common/Button'
import { markWhatsAppHandoff } from '../../services/bookingApi'
import { formatCurrency } from '../../utils/formatCurrency'
import { ALLAY_WHATSAPP_NUMBER, clientWhatsAppHandoff, copyText } from '../../utils/whatsapp'
import { bookingWhatsAppMessage, recordHandoffWithoutWaiting, servicePriceLabel } from '../../utils/bookingHandoff'

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
  const saved = confirmation?.saveState !== 'unverified' && Boolean(confirmation?.reference)
  const whatsapp = confirmation ? clientWhatsAppHandoff(bookingWhatsAppMessage(confirmation)) : null

  const copyBookingMessage = async () => {
    const copied = await copyText(whatsapp?.message)
    if (copied) toast.success('Booking message copied. Paste it into the Allay House WhatsApp chat.')
    else toast('Copy the message from the booking message box below.')
  }

  if (!confirmation) {
    return <section className="success-page section">
      <span className="success-page__icon"><MessageCircle /></span>
      <span className="eyebrow">Booking request</span>
      <h1>Your booking details are not available in this tab.</h1>
      <p>We cannot verify a booking from this page alone. Check your email or contact Allay House with the email address and phone number you used.</p>
      <Button to="/book">Start a booking</Button>
      <Link className="text-link" to="/contact">Contact Allay House</Link>
    </section>
  }

  return <section className="success-page success-page--receipt section">
    <span className="success-page__icon">{saved ? <Check /> : <MessageCircle />}</span>
    <span className="eyebrow">{saved ? 'Request saved' : 'WhatsApp request — save not verified'}</span>
    <h1>Request your invoice on WhatsApp.</h1>
    <p>{saved && confirmation.emailSent ? 'A copy of this pending request has been emailed to you. ' : ''}{!saved ? 'The website could not verify that your request was saved. Ask the team to check for an existing request before creating another. ' : ''}Send the prepared WhatsApp message so Allay House can confirm availability, check the final amount, and send your invoice. Your appointment is not confirmed and no payment has been taken.</p>

    <div className="booking-receipt">
      <header><div><span>{saved ? 'Booking code' : 'Request status'}</span><strong>{saved ? confirmation.reference : 'Awaiting verification by Allay House'}</strong></div><small>{saved ? (confirmation.status || 'pending') : 'request only'}</small></header>
      <div className="booking-receipt__grid">
        <p><Mail size={15} /><span>{confirmation.customer?.fullName}<small>{confirmation.customer?.email}</small><small>{confirmation.customer?.phone}</small></span></p>
        <p><CalendarDays size={15} /><span>{String(confirmation.date || '').slice(0, 10)}<small>Preferred date</small></span></p>
        <p><Clock3 size={15} /><span>{confirmation.time} WAT<small>{confirmation.totalDurationMinutes || 0} minutes planned</small></span></p>
      </div>
      <div className="booking-receipt__services">
        {services.map((service) => <div key={service.id || service.slug}>
          <span><strong>{service.name}</strong>{service.durationLabel && <small>{service.durationLabel}</small>}</span>
          <b>{servicePriceLabel(service)}</b>
        </div>)}
      </div>
      <dl>
        <div><dt>Subtotal</dt><dd>{formatCurrency(confirmation.subtotal || 0)}</dd></div>
        <div><dt>Discount{confirmation.discountCode ? ` (${confirmation.discountCode})` : ''}</dt><dd>{confirmation.discountAmount ? `-${formatCurrency(confirmation.discountAmount)}` : '-'}</dd></div>
        <div><dt>{confirmation.priceIsEstimated || !saved ? 'Estimated total' : 'Total before confirmation'}</dt><dd>{formatCurrency(confirmation.totalAmount || 0)}</dd></div>
      </dl>
      {confirmation.customerNote && <p>Note: {confirmation.customerNote}</p>}
    </div>

    <div className="success-page__actions">
      <a className="button button--primary button--md" href={whatsapp.url} onClick={() => recordHandoffWithoutWaiting(saved ? confirmation.reference : null, markWhatsAppHandoff)}><MessageCircle size={17} /><span>Continue on WhatsApp</span></a>
      <Button type="button" variant="outline" onClick={copyBookingMessage}><Copy size={15} /> Copy booking message</Button>
      <Button to="/book" variant="outline">Book another service</Button>
      <Button type="button" variant="ghost" onClick={() => window.print()}><Printer size={15} /> Print</Button>
    </div>
    <p className="success-page__note">WhatsApp will open with your message prepared. Tap Send in WhatsApp to deliver it to Allay House at +234 701 211 9202.</p>
    <details className="success-page__note">
      <summary>View or manually copy your complete booking message</summary>
      <textarea aria-label="Complete WhatsApp booking message" readOnly value={whatsapp.message} rows={14} style={{ width: '100%' }} />
      <a className="text-link" href={`https://wa.me/${ALLAY_WHATSAPP_NUMBER}`}>Open Allay House chat without prefilled text</a>
    </details>
  </section>
}
