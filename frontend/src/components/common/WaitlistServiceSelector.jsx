import { Check, Clock3 } from 'lucide-react'
import { formatPriceLabel } from '../../utils/formatCurrency'

function sameService(first = {}, second = {}) {
  return Boolean((first.id && first.id === second.id) || (first.slug && first.slug === second.slug))
}

export default function WaitlistServiceSelector({ services, selected = [], isLive = false, onChange }) {
  const toggle = (service) => {
    const active = selected.some((item) => sameService(item, service))
    onChange(active ? selected.filter((item) => !sameService(item, service)) : [...selected, service])
  }

  return <div className="waitlist-service-grid" role="group" aria-label="Services of interest">
    {services.map((service) => {
      const active = selected.some((item) => sameService(item, service))
      return <button key={service.id} type="button" className={`waitlist-service-option ${active ? 'is-selected' : ''}`} aria-pressed={active} onClick={() => toggle(service)}>
        <span className="waitlist-service-option__check" aria-hidden="true"><Check size={15} /></span>
        <span className="waitlist-service-option__body">
          <small>{service.category}</small>
          <strong>{service.name}</strong>
          {service.durationMinutes ? <span><Clock3 size={13} />{service.durationMinutes} mins{isLive && service.price ? ` / ${formatPriceLabel(service.price)}` : ''}{!isLive ? ' / Pricing at launch' : ''}</span> : null}
        </span>
        <span className="waitlist-service-option__state">{active ? 'Selected' : 'Select'}</span>
      </button>
    })}
  </div>
}
