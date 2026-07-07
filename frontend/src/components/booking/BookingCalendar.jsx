import { ChevronLeft, ChevronRight } from 'lucide-react'

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function monthLabel(date) {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date)
}

function buildCalendarDays(monthDate) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const first = new Date(year, month, 1)
  const leading = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []

  for (let i = 0; i < leading; i += 1) days.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) days.push(new Date(year, month, day))
  while (days.length % 7 !== 0) days.push(null)
  return days
}

export default function BookingCalendar({ monthDate, selectedDate, days = [], onMonthChange, onSelectDate, disabled = false, loading = false }) {
  const statusByDate = new Map(days.map((day) => [day.date, day]))
  const todayKey = toDateKey(new Date())
  const calendarDays = buildCalendarDays(monthDate)
  const shiftMonth = (direction) => onMonthChange(new Date(monthDate.getFullYear(), monthDate.getMonth() + direction, 1))

  return <section className={`booking-calendar ${disabled ? 'is-disabled' : ''}`}>
    <header className="booking-calendar__header">
      <div>
        <span className="eyebrow">Appointment calendar</span>
        <h3>{monthLabel(monthDate)}</h3>
      </div>
      <div className="booking-calendar__nav">
        <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month"><ChevronLeft size={17} /></button>
        <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month"><ChevronRight size={17} /></button>
      </div>
    </header>
    <div className="booking-calendar__weekdays">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}</div>
    <div className="booking-calendar__grid">
      {calendarDays.map((date, index) => {
        if (!date) return <span key={`blank-${index}`} className="booking-calendar__blank" />
        const dateKey = toDateKey(date)
        const status = statusByDate.get(dateKey)
        const isPast = dateKey < todayKey
        const isBlocked = status?.isBlocked || isPast
        const isFull = status?.isFullyBooked
        const isSelected = selectedDate === dateKey
        const canSelect = !disabled && !isBlocked && !isFull
        return <button
          key={dateKey}
          type="button"
          className={`booking-calendar__day ${isSelected ? 'is-selected' : ''} ${isBlocked ? 'is-blocked' : ''} ${isFull ? 'is-full' : ''}`}
          onClick={() => canSelect && onSelectDate(dateKey)}
          aria-pressed={isSelected}
          aria-disabled={!canSelect}
        >
          <strong>{date.getDate()}</strong>
          <small>{isPast ? 'Past' : status?.reason || (status?.isAvailable ? 'Open' : loading ? 'Checking' : 'Open')}</small>
        </button>
      })}
    </div>
  </section>
}
