import { CalendarDays, Clock3, MessageCircle } from 'lucide-react'
import Button from '../common/Button'
import { calculateBookingTotal } from '../../utils/calculateBookingTotal'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatServicePrice } from '../../utils/formatServicePrice'

function missingReason({ services, date, time, customer }) {
  if (!services.length) return 'Choose at least one service.'
  if (!date) return 'Choose a date.'
  if (!time) return 'Choose a time.'
  if (!customer?.fullName || !customer?.email || !customer?.phone) return 'Complete your contact details.'
  return ''
}

export default function BookingSummary({
  services,
  date,
  time,
  customer,
  discount = 0,
  coupon,
  onCouponChange,
  onApplyCoupon,
  onRemoveCoupon,
  loading = false,
}) {
  const totals = calculateBookingTotal(services, discount)
  const reason = missingReason({ services, date, time, customer })
  const estimated = services.some((service) => service.priceIsFrom
    || (service.priceFrom != null && service.priceTo != null && Number(service.priceTo) > Number(service.priceFrom))
    || (Array.isArray(service.priceOptions) && service.priceOptions.length > 1))

  return <aside className="booking-summary">
    <span className="eyebrow">Booking summary</span>
    {services.length ? <div className="booking-summary__services">
      {services.map((service) => <div key={service.id || service.slug}>
        <span><strong>{service.name}</strong><small>{service.durationLabel || service.category}</small></span>
        <b>{formatServicePrice(service)}</b>
      </div>)}
    </div> : <p className="booking-summary__empty">Choose one or more services to begin your appointment.</p>}

    <div className="booking-summary__schedule">
      <p><CalendarDays size={15} />{date || 'Choose a date'}</p>
      <p><Clock3 size={15} />{time || 'Choose a time'}{totals.totalDuration > 0 && ` / ${totals.totalDuration} mins total`}</p>
    </div>

    <div className="booking-summary__coupon">
      <label htmlFor="booking-discount-code">Discount code</label>
      {coupon?.applied ? <div className="booking-summary__coupon-applied">
        <span><strong>{coupon.applied.code}</strong> applied</span>
        <button type="button" onClick={onRemoveCoupon}>Remove</button>
      </div> : <div className="booking-summary__coupon-row">
        <input id="booking-discount-code" value={coupon?.code || ''} onChange={(event) => onCouponChange?.(event.target.value)} placeholder="ALLAY10" />
        <Button type="button" size="sm" variant="outline" loading={coupon?.loading} disabled={!services.length || coupon?.loading} onClick={onApplyCoupon}>Apply</Button>
      </div>}
      {coupon?.message && <p className="booking-summary__coupon-success" aria-live="polite">{coupon.message}</p>}
      {coupon?.error && <p className="booking-summary__coupon-error" aria-live="polite">{coupon.error}</p>}
    </div>

    <dl>
      <div><dt>Subtotal</dt><dd>{formatCurrency(totals.subtotal)}</dd></div>
      <div><dt>Discount</dt><dd>{totals.discount ? `-${formatCurrency(totals.discount)}` : '-'}</dd></div>
      <div className="booking-summary__total"><dt>{estimated ? 'Estimated total' : 'Total'}</dt><dd>{formatCurrency(totals.total)}</dd></div>
    </dl>
    {reason && <p className="booking-summary__reason" aria-live="polite">{reason}</p>}
    <Button type="submit" size="lg" loading={loading} disabled={Boolean(reason)}><MessageCircle size={17} /> Complete booking</Button>
    <small>No online payment is taken here. Allay House will review the request, confirm the final price, and send payment instructions on WhatsApp.</small>
  </aside>
}
