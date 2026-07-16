import { ArrowRight, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getServiceImage } from '../../data/allayImages'
import { useSiteMode } from '../../hooks/useSiteMode'
import { ANALYTICS_EVENTS, serviceParams, trackEvent } from '../../services/analytics'
import { formatServicePrice } from '../../utils/formatServicePrice'
import Badge from './Badge'
import Button from './Button'
import ImagePlaceholder from './ImagePlaceholder'

export default function ServiceCard({ service }) {
  const { isLive } = useSiteMode()
  const image = service.imageUrl || service.image || getServiceImage(service.slug)
  const selectPath = isLive ? `/book?service=${service.slug}` : `/waitlist?service=${service.slug}`
  const trackSelect = (sourceSection) => trackEvent(ANALYTICS_EVENTS.SELECT_SERVICE, serviceParams(service, { source_section: sourceSection }))
  const cardDescription = service.shortDescription || service.description
  return <article className="service-card">
    <Link className="service-card__image" to={`/services/${service.slug}`} onClick={() => trackSelect('service_card_image')}>
      <ImagePlaceholder src={image} fallbackSrc={getServiceImage(service.slug)} alt={`${service.name} treatment at Allay House`} variant="card" width="640" height="480" />
    </Link>
    <div className="service-card__body">
      <span className="service-card__category">{service.category}</span>
      {(service.isCouples || service.isAddon || service.sessionCount) && <div className="service-card__badges">
        {service.isCouples && <Badge status="paid">Couples</Badge>}
        {service.isAddon && <Badge status="pending">Add-on</Badge>}
        {service.sessionCount && <Badge status="paid">{service.sessionCount} sessions</Badge>}
      </div>}
      <h3><Link to={`/services/${service.slug}`} onClick={() => trackSelect('service_card_title')}>{service.name}</Link></h3>
      <p>{cardDescription}</p>
      <div className="service-card__meta"><span><Clock3 size={14} />{service.durationMinutes} mins</span><strong>{formatServicePrice(service)}</strong></div>
      <div className="service-card__actions"><Link className="text-link" to={`/services/${service.slug}`} onClick={() => trackSelect('service_card_details')}>View details <ArrowRight size={15} /></Link><Button to={selectPath} variant="ghost" size="sm" onClick={() => trackSelect('service_card_booking')}>{isLive ? 'Select' : 'Join waitlist'}</Button></div>
    </div>
  </article>
}
