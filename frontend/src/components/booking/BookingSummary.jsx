import { CalendarDays, Clock3 } from 'lucide-react'
import Button from '../common/Button'
import { calculateBookingTotal } from '../../utils/calculateBookingTotal'
import { formatCurrency } from '../../utils/formatCurrency'

export default function BookingSummary({ services, date, time, discount = 0, loading = false }) {
  const totals = calculateBookingTotal(services, discount)
  return <aside className="booking-summary"><span className="eyebrow">Booking summary</span>{services.length ? <div className="booking-summary__services">{services.map((service) => <div key={service.id}><span><strong>{service.name}</strong><small>{service.durationMinutes} mins · {service.category}</small></span><b>{formatCurrency(service.price)}</b></div>)}</div> : <p className="booking-summary__empty">Choose one or more services to begin your appointment.</p>}<div className="booking-summary__schedule"><p><CalendarDays size={15} />{date || 'Choose a date'}</p><p><Clock3 size={15} />{time || 'Choose a time'}{totals.totalDuration > 0 && ` · ${totals.totalDuration} mins total`}</p></div><dl><div><dt>Subtotal</dt><dd>{formatCurrency(totals.subtotal)}</dd></div><div><dt>Discount</dt><dd>{totals.discount ? `−${formatCurrency(totals.discount)}` : '—'}</dd></div><div className="booking-summary__total"><dt>Total</dt><dd>{formatCurrency(totals.total)}</dd></div></dl><Button type="submit" size="lg" loading={loading} disabled={!services.length}>Confirm booking request</Button><small>Your appointment request will be reviewed and confirmed by Allay House.</small></aside>
}
