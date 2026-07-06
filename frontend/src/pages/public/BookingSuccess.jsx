import { Check } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import Button from '../../components/common/Button'
import { generateBookingReference } from '../../utils/generateBookingReference'

export default function BookingSuccess() {
  const { state } = useLocation()
  const reference = state?.reference || generateBookingReference()
  return <section className="success-page section"><span className="success-page__icon"><Check /></span><span className="eyebrow">Appointment request received</span><h1>Your time is being held.</h1><p>Reference <strong>{reference}</strong></p><div className="phase-note">A full service, date, customer, payment, and policy summary will appear here after live booking confirmation.</div><Button to="/">Return home</Button><Link className="text-link" to="/contact">Contact Allay House</Link></section>
}

