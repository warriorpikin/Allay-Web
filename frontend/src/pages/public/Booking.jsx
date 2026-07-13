import { Check } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { ANALYTICS_EVENTS, bookingValue, bucketTimeOfDay, serviceParams, trackEvent } from '../../services/analytics'
import { createBooking, validateDiscountCode } from '../../services/bookingApi'
import { getServices } from '../../services/servicesApi'
import { calculateBookingTotal } from '../../utils/calculateBookingTotal'
import { generateBookingReference } from '../../utils/generateBookingReference'
import { imagePaths } from '../../utils/imagePaths'

const fallbackTimes = ['09:00', '10:30', '12:00', '13:30', '15:00'].map((time) => ({ time, available: true, reason: 'available', remainingCapacity: 2 }))

function serviceQuery(services) {
  return services.map((service) => service.id).join(',')
}

function serviceKey(service) {
  return service?.slug || service?.id
}

function uniqueServices(services = []) {
  const seen = new Set()
  return services.filter((service) => {
    const key = serviceKey(service)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function replaceWithCurrentServices(selected = [], currentServices = []) {
  return uniqueServices(selected.map((selectedService) => {
    const selectedKey = serviceKey(selectedService)
    return currentServices.find((service) => serviceKey(service) === selectedKey || service.id === selectedService.id) || selectedService
  }))
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
  const [coupon, setCoupon] = useState({ code: '', applied: null, loading: false, message: '', error: '' })
  const [loadingDays, setLoadingDays] = useState(false)
  const [loadingTimes, setLoadingTimes] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const bookingStarted = useRef(false)
  const trackedDetailsComplete = useRef(false)
  const lastTrackedTime = useRef('')
  const requestedService = useMemo(() => services.find((service) => service.slug === requestedSlug), [services, requestedSlug])
  const totals = useMemo(() => calculateBookingTotal(booking.services, coupon.applied?.discountAmount || 0), [booking.services, coupon.applied])
  const availableTimeSlots = useMemo(() => timeSlots.filter((slot) => slot.available), [timeSlots])
  const fullTimeSlots = useMemo(() => timeSlots.filter((slot) => !slot.available), [timeSlots])

  useEffect(() => {
    getServices()
      .then((data) => {
        if (data.services?.length) {
          setServices(data.services)
          updateBooking((current) => ({ services: replaceWithCurrentServices(current.services, data.services) }))
        }
      })
      .catch(() => setServices(placeholderServices))
  }, [updateBooking])

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
    if (!requestedSlug || !requested) return
    updateBooking((current) => {
      if (current.services.some((service) => serviceKey(service) === serviceKey(requested))) return {}
      return { services: uniqueServices([...current.services, requested]) }
    })
  }, [requestedSlug, services, updateBooking])

  useEffect(() => {
    if (!booking.services.length) {
      setCalendarDays([])
      setTimeSlots([])
      setLoadingDays(false)
      return
    }
    let cancelled = false
    setLoadingDays(true)
    getAvailabilityDays({
      month: monthDate.getMonth() + 1,
      year: monthDate.getFullYear(),
      serviceIds: serviceQuery(booking.services),
      durationMinutes: totals.totalDuration || 30,
    })
      .then((data) => { if (!cancelled) setCalendarDays(data.days || []) })
      .catch(() => { if (!cancelled) setCalendarDays([]) })
      .finally(() => { if (!cancelled) setLoadingDays(false) })
    return () => { cancelled = true }
  }, [booking.services, monthDate, totals.totalDuration])

  useEffect(() => {
    if (!booking.date || !booking.services.length) {
      setTimeSlots([])
      setLoadingTimes(false)
      return
    }
    let cancelled = false
    setLoadingTimes(true)
    setNotice(null)
    setSuggestions([])
    getAvailabilityTimes({
      date: booking.date,
      serviceIds: serviceQuery(booking.services),
      durationMinutes: totals.totalDuration || 30,
    })
      .then((data) => { if (!cancelled) setTimeSlots(data.times || []) })
      .catch(() => { if (!cancelled) setTimeSlots(fallbackTimes) })
      .finally(() => { if (!cancelled) setLoadingTimes(false) })
    return () => { cancelled = true }
  }, [booking.date, booking.services, totals.totalDuration])

  const updateCustomer = (field) => (event) => updateBooking({ customer: { ...booking.customer, [field]: event.target.value } })
  const selectDate = (date) => {
    updateBooking({ date })
    trackEvent(ANALYTICS_EVENTS.BOOKING_DATE_SELECTED, { booking_step: 'date', result: 'selected' })
    trackEvent(ANALYTICS_EVENTS.BOOKING_STEP_VIEW, { booking_step: 'time' })
    setNotice(null)
    setSuggestions([])
  }

  const selectTime = useCallback(async (time) => {
    updateBooking({ time })
    if (lastTrackedTime.current !== time) {
      lastTrackedTime.current = time
      trackEvent(ANALYTICS_EVENTS.BOOKING_TIME_SELECTED, { booking_step: 'time', time_bucket: bucketTimeOfDay(time), result: 'selected' })
      trackEvent(ANALYTICS_EVENTS.BOOKING_STEP_VIEW, { booking_step: 'details' })
    }
    setSuggestions([])
    if (!booking.date) {
      setNotice({ status: 'pending', message: 'Choose a date to check whether this time is available.' })
      return
    }
    try {
      const result = await checkAvailability({ date: booking.date, preferredTime: time, serviceIds: booking.services.map((service) => service.id), totalDurationMinutes: totals.totalDuration })
      setNotice({ status: result.available ? 'available' : 'suggestions', message: result.message || (result.available ? 'This period is available.' : 'This period has already been booked. Please choose one of the available times below.'), suggestions: result.suggestedTimes || [] })
      setSuggestions(result.suggestedTimes || [])
      if (!result.available) updateBooking({ time: '' })
    } catch {
      setNotice({ status: 'available', message: 'This preferred time is selected. Final availability will be checked when you confirm.' })
    }
  }, [booking.date, booking.services, totals.totalDuration, updateBooking])

  useEffect(() => {
    if (!booking.date || !booking.time || !booking.services.length) return
    selectTime(booking.time)
  }, [booking.date, booking.services, booking.time, selectTime])

  const showClockError = (message) => {
    setNotice({ status: 'pending', message, suggestions })
  }

  const selectedServiceIds = useMemo(() => booking.services.map((service) => service.id).filter(Boolean), [booking.services])

  const applyCoupon = async () => {
    const code = coupon.code.trim()
    if (!code) {
      setCoupon((current) => ({ ...current, error: 'Enter a discount code first.', message: '' }))
      return
    }
    setCoupon((current) => ({ ...current, loading: true, error: '', message: '' }))
    try {
      const result = await validateDiscountCode({ code, serviceIds: selectedServiceIds, subtotal: calculateBookingTotal(booking.services).subtotal })
      setCoupon({ code: result.code, applied: result, loading: false, message: `You saved ${result.formattedDiscount || 'on this booking'}.`, error: '' })
    } catch (error) {
      setCoupon((current) => ({ ...current, applied: null, loading: false, error: error.response?.data?.message || 'This discount code could not be applied.', message: '' }))
    }
  }

  const removeCoupon = () => setCoupon({ code: '', applied: null, loading: false, message: '', error: '' })

  const updateSelectedServices = (nextServices) => {
    updateBooking({ services: uniqueServices(nextServices), date: '', time: '' })
    lastTrackedTime.current = ''
    if (nextServices.length && !bookingStarted.current) {
      bookingStarted.current = true
      trackEvent(ANALYTICS_EVENTS.BOOKING_START, { booking_step: 'services', currency: 'NGN', value: bookingValue(nextServices) })
      trackEvent(ANALYTICS_EVENTS.BOOKING_STEP_VIEW, { booking_step: 'services' })
    }
    removeCoupon()
  }

  useEffect(() => {
    if (!booking.services.length || bookingStarted.current) return
    bookingStarted.current = true
    trackEvent(ANALYTICS_EVENTS.BOOKING_START, { booking_step: 'services', currency: 'NGN', value: bookingValue(booking.services) })
    trackEvent(ANALYTICS_EVENTS.BOOKING_STEP_VIEW, { booking_step: 'services' })
  }, [booking.services])

  useEffect(() => {
    if (trackedDetailsComplete.current) return
    if (!booking.customer.fullName || !booking.customer.email || !booking.customer.phone) return
    trackedDetailsComplete.current = true
    trackEvent(ANALYTICS_EVENTS.BOOKING_DETAILS_COMPLETED, { booking_step: 'details', result: 'completed' })
  }, [booking.customer.fullName, booking.customer.email, booking.customer.phone])

  const submit = (event) => {
    event.preventDefault()
    if (!booking.services.length) { toast.error('Choose at least one service.'); return }
    if (!booking.date || !booking.time) { toast.error('Choose a preferred date and time.'); return }
    trackEvent(ANALYTICS_EVENTS.BOOKING_SUBMIT, { booking_step: 'submit', currency: 'NGN', value: totals.total })
    setSubmitting(true)
    createBooking({
      customerName: booking.customer.fullName,
      customerEmail: booking.customer.email,
      customerPhone: booking.customer.phone,
      selectedServices: booking.services,
      appointmentDate: booking.date,
      preferredTime: booking.time,
      discountCode: coupon.applied?.code || '',
      customerNote: booking.note,
    })
      .then((data) => {
        const confirmation = data.confirmation || { reference: data.bookingReference || generateBookingReference(), services: booking.services, date: booking.date, time: booking.time, customer: booking.customer, emailSent: data.emailStatus?.customer }
        sessionStorage.setItem('allay:lastBookingConfirmation', JSON.stringify(confirmation))
        trackEvent(ANALYTICS_EVENTS.BOOKING_COMPLETE, serviceParams(booking.services[0] || {}, { booking_step: 'complete', currency: 'NGN', value: totals.total, result: 'success' }))
        toast.success(confirmation.emailSent ? 'Your booking is confirmed and the email is on its way.' : 'Your booking is confirmed. Please save your reference.')
        navigate('/booking-success', { state: { confirmation } })
      })
      .catch((error) => {
        const data = error.response?.data
        if (error.response?.status === 409) {
          setSuggestions(data?.suggestedTimes || [])
          setNotice({ status: 'suggestions', message: data?.message || 'This period has already been booked. Please choose one of the available times below.', suggestions: data?.suggestedTimes || [] })
          trackEvent(ANALYTICS_EVENTS.BOOKING_ERROR, { booking_step: 'submit', error_type: 'availability_conflict', result: 'failed' })
          toast.error('That time is unavailable.')
        } else {
          trackEvent(ANALYTICS_EVENTS.BOOKING_ERROR, { booking_step: 'submit', error_type: 'request_failed', result: 'failed' })
          toast.error('We could not create the booking yet. Please check the backend connection.')
        }
      })
      .finally(() => setSubmitting(false))
  }

  if (siteModeLoading || authLoading) return <Loader label="Opening the Allay booking diary" />

  if (!isLive) {
    return <section className="booking-disabled section compact" style={{ '--booking-page-image': `url(${imagePaths.booking.empty})` }}>
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
    <form className="booking-flow section compact" onSubmit={submit}><div className="booking-flow__main"><section className="booking-step"><header><span>01</span><div><h2>Choose your services</h2><p>Select as many experiences as you would like for this visit.</p></div></header><ServiceMultiSelect services={services} selectedServices={booking.services} onChange={updateSelectedServices} /></section><section className="booking-step"><header><span>02</span><div><h2>Choose your preferred date</h2><p>Fully booked, blocked, and closed days are softened out of the calendar.</p></div></header><BookingCalendar monthDate={monthDate} selectedDate={booking.date} days={calendarDays} onMonthChange={setMonthDate} onSelectDate={selectDate} disabled={!booking.services.length} loading={loadingDays} /></section><section className="booking-step"><header><span>03</span><div><h2>Preferred Booking Time</h2><p>Set your preferred time like a calm booking clock. Minutes move in clean 5-minute intervals and full slots stay hidden from the available list.</p></div></header><PreferredTimeClock value={booking.time} selectedDate={booking.date} availableTimeSlots={availableTimeSlots} fullTimeSlots={fullTimeSlots} suggestedTimes={suggestions} onSelect={selectTime} onInvalid={showClockError} loading={loadingTimes} /><AvailabilityNotice status={notice?.status} message={notice?.message} suggestions={notice?.suggestions} onSelectSuggestion={selectTime} /></section><section className="booking-step"><header><span>04</span><div><h2>Your details</h2><p>Tell us where to send your appointment confirmation.</p></div></header><div className="form-row"><Input id="booking-name" label="Full name" required value={booking.customer.fullName} onChange={updateCustomer('fullName')} /><Input id="booking-email" label="Email" type="email" required value={booking.customer.email} onChange={updateCustomer('email')} /></div><Input id="booking-phone" label="Phone number" type="tel" required value={booking.customer.phone} onChange={updateCustomer('phone')} /><Textarea id="booking-note" label="Optional note" value={booking.note} onChange={(event) => updateBooking({ note: event.target.value })} /></section></div><BookingSummary services={booking.services} date={booking.date} time={booking.time} customer={booking.customer} discount={coupon.applied?.discountAmount || 0} coupon={coupon} onCouponChange={(code) => setCoupon((current) => ({ ...current, code }))} onApplyCoupon={applyCoupon} onRemoveCoupon={removeCoupon} loading={submitting} /></form></>
}
