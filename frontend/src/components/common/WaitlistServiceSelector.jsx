import { Check, Clock3 } from 'lucide-react'
import { getServiceImage } from '../../data/allayImages'
import { formatCurrency } from '../../utils/formatCurrency'
import { imagePaths } from '../../utils/imagePaths'
import ImagePlaceholder from './ImagePlaceholder'

export default function WaitlistServiceSelector({ services, selected = [], onChange }) {
  const toggle = (service) => {
    const active = selected.some((item) => item.id === service.id)
    onChange(active ? selected.filter((item) => item.id !== service.id) : [...selected, service])
  }
  return <div className="booking-service-grid waitlist-service-grid" role="group" aria-label="Services of interest">
    {services.map((service) => {
      const active = selected.some((item) => item.id === service.id)
      return <button key={service.id} type="button" className={`booking-service ${active ? 'is-selected' : ''}`} aria-pressed={active} onClick={() => toggle(service)}>
        <ImagePlaceholder src={service.image || getServiceImage(service.slug)} fallbackSrc={imagePaths.placeholders.service} category={service.category} variant="card" className={`accent-${service.accent || 'stone'}`} />
        <span className="booking-service__check"><Check size={15} /></span>
        <span className="booking-service__body">
          <small>{service.category}</small>
          <strong>{service.name}</strong>
          {service.durationMinutes ? <span><Clock3 size={13} />{service.durationMinutes} mins{service.price ? ` · ${formatCurrency(service.price)}` : ''}</span> : null}
        </span>
      </button>
    })}
  </div>
}
