const defaultSlots = ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00']

export default function TimeSlotPicker({ value, onChange, slots = defaultSlots }) {
  return <div className="time-slot-picker" role="group" aria-label="Preferred appointment time">{slots.map((slot) => <button key={slot} type="button" className={value === slot ? 'is-selected' : ''} aria-pressed={value === slot} onClick={() => onChange(slot)}>{slot}</button>)}</div>
}

