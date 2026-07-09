import { Check } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import AvailabilityNotice from '../../components/booking/AvailabilityNotice'
import BookingCalendar from '../../components/booking/BookingCalendar'
import BookingSummary from '../../components/booking/BookingSummary'
import PreferredTimeClock from '../../components/booking/PreferredTimeClock'
import ServiceMultiSelect from '../../components/booking/ServiceMultiSelect'
import Button from '../../components/common/Button'
import Loader from '../../components/common/Loader'
import SectionHeader from '../../components/common/SectionHeader'
import Input from '../../components/forms/Input'
import Textarea from '../../components/forms/Textarea'
import { placeholderServices } from '../../data/placeholderServices'
import { useAuth } from '../../hooks/useAuth'
import { useBooking } from '../../hooks/useBooking'
import { useSiteMode } from '../../hooks/useSiteMode'
import { checkAvailability, getAvailabilityDays, getAvailabilityTimes } from '../../services/availabilityApi'
import { createBooking } from '../../services/bookingApi'
import { getServices } from '../../services/servicesApi'
import { calculateBookingTotal } from '../../utils/calculateBookingTotal'
import { generateBookingReference } from '../../utils/generateBookingReference'

const fallbackTimes = ['09:00', '10:30', '12:00', '13:30', '15:00'].map((time) => ({ time, available: true, reason: 'available', remainingCapacity: 2 }))

function serviceQuery(services) {
  return services.map((service) => service.id).join(',')
}

export default function Booking() {
  const { booking, updateBooking } = useBooking()
  const { isLive, isLoading: siteModeLoading } = useSiteMode()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const requestedSlug = searchParams.get('service')
  const [services, setServices] = useState(placeholderServices)
  const [monthDate, setMonthDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [calendarDays, setCalendarDays] = useState([])
  const [timeSlots, setTimeSlots] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [notice, setNotice] = useState(null)
  const [loadingDays, setLoadingDays] = useState(false)
  const [loadingTimes, setLoadingTimes] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const requestedService = useMemo(() => services.find((service) => service.slug === requestedSlug), [services, requestedSlug])
  const totals = useMemo(() => calculateBookingTotal(booking.services), [booking.services])
  const availableTimeSlots = useMemo(() => timeSlots.filter((slot) => slot.available), [timeSlots])
  const fullTimeSlots = useMemo(() => timeSlots.filter((slot) => !slot.available), [timeSlots])

  useEffect(() => {
    getServices()
      .then((data) => {
        if (data.services?.length) setServices(data.services)
      })
      .catch(() => setServices(placeholderServices))
  }, [])

  useEffect(() => {
    if (!user) return
    updateBooking({
      customer: {
        fullName: booking.customer.fullName || user.fullName || '',
        email: booking.customer.email || user.email || '',
        phone: booking.customer.phone || user.phone || '',
      },
    })
  }, [user, booking.customer.fullName, booking.customer.email, booking.customer.phone, updateBooking])

  useEffect(() => {
    const requested = services.find((service) => service.slug === requestedSlug)
    if (requested && !booking.services.some((service) => service.id === requested.id)) updateBooking({ services: [...booking.services, requested] })
  }, [requestedSlug, booking.services, services, updateBooking])

  useEffect(() => {
    if (!booking.services.length) {
      setCalendarDays([])
      setTimeSlots([])
      return
    }
    setLoadingDays(true)
    getAvailabilityDays({
      month: monthDate.getMonth() + 1,
      year: monthDate.getFullYear(),
      serviceIds: serviceQuery(booking.services),
      durationMinutes: totals.totalDuration || 30,
    })
      .then((data) => setCalendarDays(data.days || []))
      .catch(() => setCalendarDays([]))
      .finally(() => setLoadingDays(false))
  }, [booking.services, monthDate, totals.totalDuration])

  useEffect(() => {
    if (!booking.date || !booking.services.length) {
      setTimeSlots([])
      return
    }
    setLoadingTimes(true)
    setNotice(null)
    setSuggestions([])
    getAvailabilityTimes({
      date: booking.date,
      serviceIds: serviceQuery(booking.services),
      durationMinutes: totals.totalDuration || 30,
    })
      .then((data) => setTimeSlots(data.times || []))
      .catch(() => setTimeSlots(fallbackTimes))
      .finally(() => setLoadingTimes(false))
  }, [booking.date, booking.services, totals.totalDuration])

  const updateCustomer = (field) => (event) => updateBooking({ customer: { ...booking.customer, [field]: event.target.value } })
  const selectDate = (date) => {
    updateBooking({ date, time: '' })
    setNotice(null)
    setSuggestions([])
  }

  const selectTime = async (time) => {
    updateBooking({ time })
    setSuggestions([])
    try {
      const result = await checkAvailability({ date: booking.date, preferredTime: time, serviceIds: booking.services.map((service) => service.id), totalDurationMinutes: totals.totalDuration })
      setNotice({ status: result.available ? 'available' : 'suggestions', message: result.message || (result.available ? 'This period is available.' : 'This period has already been booked. Please choose one of the available times below.'), suggestions: result.suggestedTimes || [] })
      setSuggestions(result.suggestedTimes || [])
      if (!result.available) updateBooking({ time: '' })
    } catch {
      setNotice({ status: 'available', message: 'This preferred time is selected. Final availability will be checked when you confirm.' })
    }
  }

  const showClockError = (message) => {
    setNotice({ status: 'suggestions', message, suggestions })
  }

  const submit = (event) => {
    event.preventDefault()
    if (!booking.services.length) { toast.error('Choose at least one service.'); return }
    if (!booking.date || !booking.time) { toast.error('Choose a preferred date and time.'); return }
    setSubmitting(true)
    createBooking({
      customerName: booking.customer.fullName,
      customerEmail: booking.customer.email,
      customerPhone: booking.customer.phone,
      selectedServices: booking.services,
      appointmentDate: booking.date,
      preferredTime: booking.time,
      customerNote: booking.note,
    })
      .then((data) => {
        toast.success('Your booking request is ready for confirmation.')
        navigate('/booking-success', { state: { reference: data.bookingReference || generateBookingReference(), services: booking.services, date: booking.date, time: booking.time } })
      })
      .catch((error) => {
        const data = error.response?.data
        if (error.response?.status === 409) {
          setSuggestions(data?.suggestedTimes || [])
          setNotice({ status: 'suggestions', message: data?.message || 'This period has already been booked. Please choose one of the available times below.', suggestions: data?.suggestedTimes || [] })
          toast.error('That time is unavailable.')
        } else {
          toast.error('We could not create the booking yet. Please check the backend connection.')
        }
      })
      .finally(() => setSubmitting(false))
  }

  if (siteModeLoading || authLoading) return <Loader label="Opening the Allay booking diary" />

  if (!isLive) {
    return <section className="booking-disabled section compact">
      <span className="eyebrow">Booking is not live yet</span>
      <h1>Private bookings open soon.</h1>
      <p>Allay House is currently in pre-launch mode, so appointments cannot be booked yet. Join the private waitlist for launch access and service updates.</p>
      <div className="hero__actions">
        <Button to="/waitlist">Join the private waitlist</Button>
        <Link className="text-link" to="/services">Explore services</Link>
      </div>
    </section>
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/auth/sign-up?redirect=${redirect}`} replace />
  }

  return <>
    <header className="page-intro">
      <SectionHeader eyebrow="Book your visit" title="Book your Allay House experience" subtitle="Choose one service or compose a fuller visit — your summary updates as you go." as="h1" />
      {requestedService && <div className="page-intro__selected"><Check size={14} /> Selected: <strong>{requestedService.name}</strong></div>}
    </header>
    <form className="booking-flow section compact" onSubmit={submit}><div className="booking-flow__main"><section className="booking-step"><header><span>01</span><div><h2>Choose your services</h2><p>Select as many experiences as you would like for this visit.</p></div></header><ServiceMultiSelect services={services} selectedServices={booking.services} onChange={(nextServices) => updateBooking({ services: nextServices, date: '', time: '' })} /></section><section className="booking-step"><header><span>02</span><div><h2>Choose your preferred date</h2><p>Fully booked, blocked, and closed days are softened out of the calendar.</p></div></header><BookingCalendar monthDate={monthDate} selectedDate={booking.date} days={calendarDays} onMonthChange={setMonthDate} onSelectDate={selectDate} disabled={!booking.services.length} loading={loadingDays} /></section><section className="booking-step"><header><span>03</span><div><h2>Preferred Booking Time</h2><p>Set your preferred time like a calm booking clock. Minutes move in clean 5-minute intervals and full slots stay hidden from the available list.</p></div></header><PreferredTimeClock value={booking.time} selectedDate={booking.date} availableTimeSlots={availableTimeSlots} fullTimeSlots={fullTimeSlots} suggestedTimes={suggestions} onSelect={selectTime} onInvalid={showClockError} loading={loadingTimes} /><AvailabilityNotice status={notice?.status} message={notice?.message} suggestions={notice?.suggestions} onSelectSuggestion={selectTime} /></section><section className="booking-step"><header><span>04</span><div><h2>Your details</h2><p>Tell us where to send your appointment confirmation.</p></div></header><div className="form-row"><Input id="booking-name" label="Full name" required value={booking.customer.fullName} onChange={updateCustomer('fullName')} /><Input id="booking-email" label="Email" type="email" required value={booking.customer.email} onChange={updateCustomer('email')} /></div><Input id="booking-phone" label="Phone number" type="tel" required value={booking.customer.phone} onChange={updateCustomer('phone')} /><Textarea id="booking-note" label="Optional note" value={booking.note} onChange={(event) => updateBooking({ note: event.target.value })} /></section></div><BookingSummary services={booking.services} date={booking.date} time={booking.time} loading={submitting} /></form></>
}
