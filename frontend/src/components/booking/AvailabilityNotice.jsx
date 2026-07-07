import { AlertCircle, CheckCircle2, Sparkles } from 'lucide-react'

export default function AvailabilityNotice({ status, message, suggestions = [], onSelectSuggestion }) {
  if (!message) return null
  const available = status === 'available'
  const Icon = available ? CheckCircle2 : status === 'suggestions' ? Sparkles : AlertCircle
  return <div className={`availability-notice availability-notice--${available ? 'available' : 'unavailable'}`}>
    <Icon size={18} />
    <div>
      <strong>{available ? 'Available' : 'Availability update'}</strong>
      <p>{message}</p>
      {suggestions.length > 0 && <div className="availability-notice__suggestions">
        {suggestions.map((time) => <button type="button" key={time} onClick={() => onSelectSuggestion(time)}>{time}</button>)}
      </div>}
    </div>
  </div>
}
