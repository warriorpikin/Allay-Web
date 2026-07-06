import { CalendarDays, Clock3 } from 'lucide-react'
import { formatCurrency } from '../../utils/formatCurrency'

export default function BookingCard({ service, date, time, total }) {
  return <aside className="booking-card">
    <span className="eyebrow">Your appointment</span>
    <h3>{service?.name || 'Choose a service'}</h3>
    <div className="booking-card__rows">
      <p><CalendarDays size={16} /><span>{date || 'Date not selected'}</span></p>
      <p><Clock3 size={16} /><span>{time || 'Time not selected'}</span></p>
    </div>
    <div className="booking-card__total"><span>Estimated total</span><strong>{formatCurrency(total ?? service?.price ?? 0)}</strong></div>
    <small>Final pricing and availability are confirmed before payment.</small>
  </aside>
}

