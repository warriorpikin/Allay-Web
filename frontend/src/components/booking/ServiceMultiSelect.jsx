import { Check, Clock3 } from 'lucide-react'
import { getServiceImage } from '../../data/allayImages'
import ImagePlaceholder from '../common/ImagePlaceholder'
import { formatPriceLabel } from '../../utils/formatCurrency'

export default function ServiceMultiSelect({ services, selectedServices, onChange }) {
  const toggle = (service) => {
    const selected = selectedServices.some((item) => item.id === service.id)
    onChange(selected ? selectedServices.filter((item) => item.id !== service.id) : [...selectedServices, service])
  }
  return <div className="booking-service-grid">{services.map((service) => {
    const selected = selectedServices.some((item) => item.id === service.id)
    return <button type="button" key={service.id} className={`booking-service ${selected ? 'is-selected' : ''}`} aria-pressed={selected} onClick={() => toggle(service)}><ImagePlaceholder src={service.image || getServiceImage(service.slug)} category={service.category} variant="card" className={`accent-${service.accent || 'stone'}`} /><span className="booking-service__check"><Check size={15} /></span><span className="booking-service__body"><small>{service.category}</small><strong>{service.name}</strong><span><Clock3 size={13} />{service.durationMinutes} mins · {formatPriceLabel(service.price)}</span></span></button>
  })}</div>
}

