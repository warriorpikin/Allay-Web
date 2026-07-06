import { useMemo } from 'react'
import toast from 'react-hot-toast'
import BookingCard from '../../components/common/BookingCard'
import Button from '../../components/common/Button'
import SectionHeader from '../../components/common/SectionHeader'
import Input from '../../components/forms/Input'
import Select from '../../components/forms/Select'
import { placeholderServices } from '../../data/placeholderServices'
import { useBooking } from '../../hooks/useBooking'

export default function Booking() {
  const { booking, updateBooking } = useBooking()
  const selectedService = useMemo(() => placeholderServices.find((item) => item.id === booking.service?.id) || booking.service, [booking.service])
  const submit = (event) => { event.preventDefault(); toast('Booking requests connect in the booking phase.', { icon: '✦' }) }
  return <><section className="page-hero"><SectionHeader eyebrow="Appointments" title="Your time at Allay House." subtitle="The booking interface is ready for live services and server-validated availability." centered as="h1" /></section><section className="booking-layout section"><form className="form-card" onSubmit={submit}><Select id="booking-service" label="Service" required value={selectedService?.id || ''} onChange={(event) => updateBooking({ service: placeholderServices.find((item) => item.id === event.target.value) || null })} options={placeholderServices.map((service) => ({ value: service.id, label: service.name }))} /><div className="form-row"><Input id="booking-date" label="Preferred date" type="date" required value={booking.date} onChange={(event) => updateBooking({ date: event.target.value })} /><Input id="booking-time" label="Preferred time" type="time" required value={booking.time} onChange={(event) => updateBooking({ time: event.target.value })} /></div><p className="phase-note">Available slots will be loaded from the backend and checked again before confirmation.</p><Button type="submit" size="lg">Continue booking</Button></form><BookingCard service={selectedService} date={booking.date} time={booking.time} /></section></>
}

