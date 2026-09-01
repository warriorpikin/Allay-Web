import { ArrowRight, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSiteMode } from '../../hooks/useSiteMode'
import { ANALYTICS_EVENTS, serviceParams, trackEvent } from '../../services/analytics'
import { formatServicePrice } from '../../utils/formatServicePrice'
import Badge from './Badge'
import Button from './Button'

export default function ServiceCard({ service }) {
  const { isLive } = useSiteMode()
  const image = service.imageUrl || service.image || ''
  const selectPath = isLive ? `/book?service=${service.slug}` : `/waitlist?service=${service.slug}`
  const trackSelect = (sourceSection) => trackEvent(ANALYTICS_EVENTS.SELECT_SERVICE, serviceParams(service, { source_section: sourceSection }))
  const cardDescription = service.description && service.description !== `${service.serviceGroup} at Allay House.`
    ? service.description
    : null

  return <article className={`service-card ${image ? 'has-image' : ''}`} data-category={service.categorySlug || ''}>
    {image && <img className="service-card__background" src={image} alt="" loading="lazy" decoding="async" />}
    <div className="service-card__wash" aria-hidden="true" />
    <div className="service-card__body">
      <div className="service-card__topline">
        <span className="service-card__category">{service.serviceGroup || service.category}</span>
        {(service.isCouples || service.isAddon || service.sessionCount) && <div className="service-card__badges">
          {service.isCouples && <Badge status="paid">Couples</Badge>}
          {service.isAddon && <Badge status="pending">Add-on</Badge>}
          {service.sessionCount && <Badge status="paid">{service.sessionCount} sessions</Badge>}
        </div>}
      </div>
      <h3><Link to={`/services/${service.slug}`} onClick={() => trackSelect('service_card_title')}>{service.name}</Link></h3>
      {cardDescription && <p>{cardDescription}</p>}
      <div className="service-card__meta">
        {service.durationLabel ? <span><Clock3 size={14} />{service.durationLabel}</span> : <span>{service.category}</span>}
        <strong>{formatServicePrice(service)}</strong>
      </div>
      <div className="service-card__actions">
        <Link className="text-link" to={`/services/${service.slug}`} onClick={() => trackSelect('service_card_details')}>Details <ArrowRight size={15} /></Link>
        <Button to={selectPath} variant={image ? 'outline' : 'ghost'} size="sm" onClick={() => trackSelect('service_card_booking')}>{isLive ? 'Book' : 'Join waitlist'}</Button>
      </div>
    </div>
  </article>
}
