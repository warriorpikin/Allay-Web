import { Clock3 } from 'lucide-react'

function statusLabel(slot) {
  if (slot.available && slot.remainingCapacity <= 1) return 'Few spots left'
  if (slot.available) return 'Available'
  if (slot.reason === 'blocked') return 'Blocked'
  if (slot.reason === 'date_full') return 'Full day'
  return 'Full'
}

export default function PreferredTimePicker({ value, slots = [], suggestions = [], onSelect, onUnavailableSelect, loading = false }) {
  if (loading) return <div className="preferred-time preferred-time--empty">Checking the diary...</div>
  if (!slots.length) return <div className="preferred-time preferred-time--empty">Select services and a date to view available times.</div>

  return <div className="preferred-time">
    <div className="preferred-time__grid" role="group" aria-label="Preferred appointment time">
      {slots.map((slot) => {
        const selected = value === slot.time
        return <button
          key={slot.time}
          type="button"
          className={`preferred-time__slot ${selected ? 'is-selected' : ''} ${!slot.available ? 'is-unavailable' : ''}`}
          aria-pressed={selected}
          aria-disabled={!slot.available}
          onClick={() => (slot.available ? onSelect(slot.time) : onUnavailableSelect?.(slot))}
        >
          <Clock3 size={14} />
          <strong>{slot.time}</strong>
          <small>{statusLabel(slot)}</small>
        </button>
      })}
    </div>
    {suggestions.length > 0 && <div className="preferred-time__suggestions">
      <span>Suggested times</span>
      {suggestions.map((time) => <button key={time} type="button" onClick={() => onSelect(time)}>{time}</button>)}
    </div>}
  </div>
}
