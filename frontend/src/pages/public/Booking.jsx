import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import BookingSummary from '../../components/booking/BookingSummary'
import ServiceMultiSelect from '../../components/booking/ServiceMultiSelect'
import TimeSlotPicker from '../../components/booking/TimeSlotPicker'
import PageHero from '../../components/common/PageHero'
import Input from '../../components/forms/Input'
import Textarea from '../../components/forms/Textarea'
import { placeholderServices } from '../../data/placeholderServices'
import { useBooking } from '../../hooks/useBooking'
import { generateBookingReference } from '../../utils/generateBookingReference'

export default function Booking() {
  const { booking, updateBooking } = useBooking()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const requestedSlug = searchParams.get('service')

  useEffect(() => {
    const requested = placeholderServices.find((service) => service.slug === requestedSlug)
    if (requested && !booking.services.some((service) => service.id === requested.id)) updateBooking({ services: [...booking.services, requested] })
  }, [requestedSlug, booking.services, updateBooking])

  const updateCustomer = (field) => (event) => updateBooking({ customer: { ...booking.customer, [field]: event.target.value } })
  const submit = (event) => {
    event.preventDefault()
    if (!booking.services.length) { toast.error('Choose at least one service.'); return }
    if (!booking.date || !booking.time) { toast.error('Choose a preferred date and time.'); return }
    const reference = generateBookingReference()
    toast.success('Your booking request is ready for confirmation.')
    navigate('/booking-success', { state: { reference, services: booking.services, date: booking.date, time: booking.time } })
  }

  return <><PageHero eyebrow="Book your time" title="Your Allay ritual, thoughtfully arranged." subtitle="Choose one service or compose a fuller visit. Your summary updates as you go." tags={['Multiple services', 'Flexible timing', 'Clear summary']} imageCategory="A visit made for you" /><form className="booking-flow section" onSubmit={submit}><div className="booking-flow__main"><section className="booking-step"><header><span>01</span><div><h2>Choose your services</h2><p>Select as many experiences as you would like for this visit.</p></div></header><ServiceMultiSelect services={placeholderServices} selectedServices={booking.services} onChange={(services) => updateBooking({ services })} /></section><section className="booking-step"><header><span>02</span><div><h2>Choose a date and time</h2><p>Live availability will replace these preview times when the booking API is connected.</p></div></header><Input id="booking-date" label="Preferred date" type="date" required value={booking.date} onChange={(event) => updateBooking({ date: event.target.value })} /><div className="form-group"><label>Preferred time</label><TimeSlotPicker value={booking.time} onChange={(time) => updateBooking({ time })} /></div></section><section className="booking-step"><header><span>03</span><div><h2>Your details</h2><p>Tell us where to send your appointment confirmation.</p></div></header><div className="form-row"><Input id="booking-name" label="Full name" required value={booking.customer.fullName} onChange={updateCustomer('fullName')} /><Input id="booking-email" label="Email" type="email" required value={booking.customer.email} onChange={updateCustomer('email')} /></div><Input id="booking-phone" label="Phone number" type="tel" required value={booking.customer.phone} onChange={updateCustomer('phone')} /><Textarea id="booking-note" label="Optional note" value={booking.note} onChange={(event) => updateBooking({ note: event.target.value })} /></section></div><BookingSummary services={booking.services} date={booking.date} time={booking.time} /></form></>
}

