import { Check } from 'lucide-react'

export default function WaitlistServiceSelector({ services, selected = [], onChange }) {
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id])
  return <div className="waitlist-selector" role="group" aria-label="Services of interest">
    {services.map((service) => {
      const active = selected.includes(service.id)
      return <button key={service.id} type="button" className={`service-selector ${active ? 'is-selected' : ''}`} aria-pressed={active} onClick={() => toggle(service.id)}><span>{service.name}</span>{active && <Check size={16} />}</button>
    })}
  </div>
}

