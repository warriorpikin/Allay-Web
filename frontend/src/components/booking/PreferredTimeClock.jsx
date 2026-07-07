import { Clock3 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1)
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'))
const PERIODS = ['AM', 'PM']

function toTime24(hour, minute, period) {
  const numericHour = Number(hour)
  const hour24 = period === 'PM' ? (numericHour === 12 ? 12 : numericHour + 12) : (numericHour === 12 ? 0 : numericHour)
  return `${String(hour24).padStart(2, '0')}:${minute}`
}

function fromTime24(time) {
  if (!time) return { hour: 10, minute: '00', period: 'AM' }
  const [rawHour, minute] = String(time).slice(0, 5).split(':')
  const hour24 = Number(rawHour)
  return {
    hour: hour24 % 12 || 12,
    minute: MINUTES.includes(minute) ? minute : '00',
    period: hour24 >= 12 ? 'PM' : 'AM',
  }
}

function displayTime(time) {
  const { hour, minute, period } = fromTime24(time)
  return `${hour}:${minute} ${period}`
}

function slotLabel(slot) {
  if (!slot.available) return 'Full'
  if (slot.remainingCapacity <= 1) return '1 spot left'
  if (slot.remainingCapacity) return `${slot.remainingCapacity} spots`
  return 'Available'
}

function normalizeSlots(slots = []) {
  return slots.map((slot) => typeof slot === 'string' ? { time: slot, available: true, reason: 'available' } : slot)
}

export default function PreferredTimeClock({
  value,
  selectedDate,
  availableTimeSlots = [],
  fullTimeSlots = [],
  suggestedTimes = [],
  onSelect,
  onInvalid,
  loading = false,
}) {
  const parsed = useMemo(() => fromTime24(value), [value])
  const [selectedHour, setSelectedHour] = useState(parsed.hour)
  const [selectedMinute, setSelectedMinute] = useState(parsed.minute)
  const [selectedPeriod, setSelectedPeriod] = useState(parsed.period)
  const [validationError, setValidationError] = useState('')

  const activeSlots = useMemo(() => normalizeSlots(availableTimeSlots).filter((slot) => slot.available), [availableTimeSlots])
  const unavailableSlots = useMemo(() => normalizeSlots(fullTimeSlots).filter((slot) => !slot.available), [fullTimeSlots])
  const activeTimeSet = useMemo(() => new Set(activeSlots.map((slot) => slot.time)), [activeSlots])
  const fullTimeSet = useMemo(() => new Set(unavailableSlots.map((slot) => slot.time)), [unavailableSlots])
  const selectedPreferredTime = toTime24(selectedHour, selectedMinute, selectedPeriod)
  const suggestedTimeSet = useMemo(() => new Set(suggestedTimes), [suggestedTimes])
  const visibleSlots = useMemo(() => [...activeSlots].sort((a, b) => Number(suggestedTimeSet.has(b.time)) - Number(suggestedTimeSet.has(a.time))), [activeSlots, suggestedTimeSet])

  useEffect(() => {
    setSelectedHour(parsed.hour)
    setSelectedMinute(parsed.minute)
    setSelectedPeriod(parsed.period)
  }, [parsed.hour, parsed.minute, parsed.period])

  const raiseError = (message) => {
    setValidationError(message)
    onInvalid?.(message)
  }

  const validateAndSelect = (hour, minute, period) => {
    const time = toTime24(hour, minute, period)
    setSelectedHour(hour)
    setSelectedMinute(minute)
    setSelectedPeriod(period)

    if (!selectedDate) {
      raiseError('Please select a date before choosing a preferred time.')
      return
    }

    if (!MINUTES.includes(minute)) {
      raiseError('Please choose a valid 5-minute interval.')
      return
    }

    if (fullTimeSet.has(time)) {
      raiseError('This time is already fully booked.')
      return
    }

    if (!activeTimeSet.has(time)) {
      raiseError('This time is no longer available. Please choose another preferred booking time.')
      return
    }

    setValidationError('')
    onSelect(time)
  }

  const chooseSuggestion = (time) => {
    const next = fromTime24(time)
    setSelectedHour(next.hour)
    setSelectedMinute(next.minute)
    setSelectedPeriod(next.period)
    setValidationError('')
    onSelect(time)
  }

  if (loading) return <div className="preferred-clock booking-clock time-picker-clock preferred-clock--empty">Checking the Allay House diary...</div>

  return <div className="preferred-clock">
    <div className="preferred-clock__panel booking-clock time-picker-clock clock-card">
      <div className="preferred-clock__face" aria-label="Preferred Booking Time clock">
        <span className="preferred-clock__halo" />
        {HOURS.map((hour, index) => {
          const angle = index * 30
          return <button
            key={hour}
            type="button"
            className={`preferred-clock__hour ${selectedHour === hour ? 'is-selected' : ''}`}
            style={{ '--clock-angle': `${angle}deg` }}
            onClick={() => validateAndSelect(hour, selectedMinute, selectedPeriod)}
          >
            {hour}
          </button>
        })}
        <span className="preferred-clock__hand" style={{ transform: `translate(-50%, -100%) rotate(${(selectedHour % 12) * 30}deg)` }} />
        <div className="preferred-clock__center">
          <Clock3 size={18} />
          <span>Selected time</span>
          <strong>{selectedHour}:{selectedMinute} {selectedPeriod}</strong>
        </div>
      </div>

      <div className="preferred-clock__controls">
        <div>
          <span className="preferred-clock__label">Minute</span>
          <div className="preferred-clock__minutes minute-options minutes-grid clock-minutes">
            {MINUTES.map((minute) => <button key={minute} type="button" className={selectedMinute === minute ? 'is-selected' : ''} onClick={() => validateAndSelect(selectedHour, minute, selectedPeriod)}>{minute}</button>)}
          </div>
        </div>
        <div>
          <span className="preferred-clock__label">Period</span>
          <div className="preferred-clock__periods">
            {PERIODS.map((period) => <button key={period} type="button" className={selectedPeriod === period ? 'is-selected' : ''} onClick={() => validateAndSelect(selectedHour, selectedMinute, period)}>{period}</button>)}
          </div>
        </div>
      </div>
    </div>

    <aside className="preferred-clock__suggestions">
      <span className="eyebrow">Available preferred times</span>
      {activeSlots.length ? <div className="preferred-clock__chips">
        {visibleSlots.map((slot) => <button key={slot.time} type="button" className={value === slot.time ? 'is-selected' : ''} onClick={() => chooseSuggestion(slot.time)}>
          <strong>{displayTime(slot.time)}</strong>
          <small>{slotLabel(slot)}</small>
        </button>)}
      </div> : <p>No preferred time slots are available for this date. Please choose another date or contact Allay House.</p>}
      {validationError && <p className="preferred-clock__error">{validationError}</p>}
      <small className="preferred-clock__note">Full slots are hidden from this list. Final availability is still checked before your booking is confirmed.</small>
      <div className="preferred-clock__selected">Selected time: <strong>{displayTime(selectedPreferredTime)}</strong></div>
    </aside>
  </div>
}
