import { ArrowRight, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getServiceImage } from '../../data/allayImages'
import { ANALYTICS_EVENTS, serviceParams, trackEvent } from '../../services/analytics'
import { formatPriceLabel } from '../../utils/formatCurrency'
import Button from './Button'
import ImagePlaceholder from './ImagePlaceholder'

export default function ServiceCard({ service }) {
  const image = service.imageUrl || service.image || getServiceImage(service.slug)
  const trackSelect = (sourceSection) => trackEvent(ANALYTICS_EVENTS.SELECT_SERVICE, serviceParams(service, { source_section: sourceSection }))
  return <article className="service-card">
    <Link className="service-card__image" to={`/services/${service.slug}`} onClick={() => trackSelect('service_card_image')}>
      <ImagePlaceholder src={image} fallbackSrc={getServiceImage(service.slug)} alt={`${service.name} treatment`} variant="card" width="640" height="480" />
    </Link>
    <div className="service-card__body">
      <span className="service-card__category">{service.category}</span>
      <h3><Link to={`/services/${service.slug}`} onClick={() => trackSelect('service_card_title')}>{service.name}</Link></h3>
      <p>{service.description}</p>
      <div className="service-card__meta"><span><Clock3 size={14} />{service.durationMinutes} mins</span><strong>{formatPriceLabel(service.price)}</strong></div>
      <div className="service-card__actions"><Link className="text-link" to={`/services/${service.slug}`} onClick={() => trackSelect('service_card_details')}>View details <ArrowRight size={15} /></Link><Button to={`/book?service=${service.slug}`} variant="ghost" size="sm" onClick={() => trackSelect('service_card_booking')}>Select</Button></div>
    </div>
  </article>
}
