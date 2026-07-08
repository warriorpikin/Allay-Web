import { CalendarDays, Check, Clock3 } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import Button from '../../components/common/Button'
import { calculateBookingTotal } from '../../utils/calculateBookingTotal'
import { formatCurrency } from '../../utils/formatCurrency'
import { generateBookingReference } from '../../utils/generateBookingReference'

export default function BookingSuccess() {
  const { state } = useLocation()
  const reference = state?.reference || generateBookingReference()
  const services = state?.services || []
  const totals = calculateBookingTotal(services)

  return <section className="success-page section"><span className="success-page__icon"><Check /></span><span className="eyebrow">Appointment request received</span><h1>Your time is being held.</h1><p>Reference <strong>{reference}</strong></p>{services.length > 0 && <div className="phase-note success-page__summary"><div className="success-page__services">{services.map((service) => <span key={service.id}>{service.name}</span>)}</div>{state?.date && <p><CalendarDays size={14} /> {state.date}</p>}{state?.time && <p><Clock3 size={14} /> {state.time}</p>}<p><strong>{formatCurrency(totals.total)}</strong></p></div>}<p>Your appointment request will be reviewed and confirmed by Allay House. We will be in touch by email shortly.</p><Button to="/">Return home</Button><Link className="text-link" to="/contact">Contact Allay House</Link></section>
}
