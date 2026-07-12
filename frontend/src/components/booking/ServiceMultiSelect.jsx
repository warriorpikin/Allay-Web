import { Check, Clock3 } from 'lucide-react'
import ImagePlaceholder from '../common/ImagePlaceholder'
import { getServiceImage } from '../../data/allayImages'
import { formatPriceLabel } from '../../utils/formatCurrency'

function serviceKey(service) {
  return service?.slug || service?.id
}

export default function ServiceMultiSelect({ services, selectedServices, onChange }) {
  const toggle = (service) => {
    const key = serviceKey(service)
    const selected = selectedServices.some((item) => serviceKey(item) === key)
    onChange(selected ? selectedServices.filter((item) => serviceKey(item) !== key) : [...selectedServices, service])
  }

  const selectedNames = selectedServices.map((service) => service.name).join(', ')

  return <>
    <div className="selected-services-note" aria-live="polite">
      {selectedServices.length
        ? <><strong>{selectedServices.length}</strong> {selectedServices.length === 1 ? 'service' : 'services'} selected: {selectedNames}</>
        : 'No services selected yet.'}
    </div>
    <div className="booking-service-grid">
      {services.map((service) => {
        const selected = selectedServices.some((item) => serviceKey(item) === serviceKey(service))
        const image = service.imageUrl || service.image || getServiceImage(service.slug)
        return <button type="button" key={service.id} className={`booking-service ${selected ? 'is-selected' : ''}`} aria-pressed={selected} onClick={() => toggle(service)}>
          <span className="booking-service__image"><ImagePlaceholder src={image} fallbackSrc={getServiceImage(service.slug)} alt={`${service.name} treatment`} variant="card" width="420" height="315" /></span>
          <span className="booking-service__check"><Check size={15} /></span>
          <span className="booking-service__body"><small>{service.category}</small><strong>{service.name}</strong><span><Clock3 size={13} />{service.durationMinutes} mins / {formatPriceLabel(service.price)}</span></span>
        </button>
      })}
    </div>
  </>
}
