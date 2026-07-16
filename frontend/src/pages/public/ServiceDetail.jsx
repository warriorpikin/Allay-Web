import { ArrowLeft, Clock3 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Badge from '../../components/common/Badge'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import Button from '../../components/common/Button'
import ImagePlaceholder from '../../components/common/ImagePlaceholder'
import Loader from '../../components/common/Loader'
import Seo from '../../components/common/Seo'
import { getServiceImage } from '../../data/allayImages'
import { placeholderServices } from '../../data/placeholderServices'
import { useSiteMode } from '../../hooks/useSiteMode'
import { ANALYTICS_EVENTS, serviceParams, trackEvent } from '../../services/analytics'
import { getServiceBySlug } from '../../services/servicesApi'
import { formatServicePrice } from '../../utils/formatServicePrice'
import { buildServiceJsonLd } from '../../utils/structuredData'
import NotFound from './NotFound'

export default function ServiceDetail() {
  const { slug } = useParams()
  const { isLive } = useSiteMode()
  const [service, setService] = useState(() => placeholderServices.find((item) => item.slug === slug) || null)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    setLoading(true)
    setMissing(false)
    getServiceBySlug(slug)
      .then((data) => setService(data.service))
      .catch(() => {
        const fallback = placeholderServices.find((item) => item.slug === slug)
        setService(fallback || null)
        setMissing(!fallback)
      })
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (!service || loading) return
    trackEvent(ANALYTICS_EVENTS.VIEW_SERVICE, serviceParams(service, { source_section: 'service_detail' }))
  }, [service, loading])

  if (loading && !service) return <Loader label="Opening service details" />
  if (missing || !service) return <NotFound />

  const image = service.imageUrl || service.image || getServiceImage(service.slug)
  const selectPath = isLive ? `/book?service=${service.slug}` : `/waitlist?service=${service.slug}`
  const trackSelect = () => trackEvent(ANALYTICS_EVENTS.SELECT_SERVICE, serviceParams(service, { source_section: 'service_detail' }))

  return <>
    <Seo
      title={service.seoTitle || `${service.name} | Allay House`}
      description={service.seoDescription || service.shortDescription || service.description}
      path={`/services/${service.slug}`}
      image={image}
      type="product"
      jsonLd={buildServiceJsonLd(service)}
    />
    <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Services', path: '/services' }, { label: service.category, path: `/services/category/${service.categorySlug || ''}` }, { label: service.name, path: `/services/${service.slug}` }]} />
    <section className="service-detail section">
    <div className="service-detail__image">
      <ImagePlaceholder src={image} fallbackSrc={getServiceImage(service.slug)} alt={`${service.name} treatment at Allay House`} variant="arch" loading="eager" fetchPriority="high" width="900" height="1200" />
    </div>
    <div className="service-detail__content">
      <Link className="text-link" to="/services"><ArrowLeft size={15} /> All services</Link>
      <span className="eyebrow">{service.category}</span>
      {(service.isCouples || service.isAddon || service.sessionCount) && <div className="service-card__badges">
        {service.isCouples && <Badge status="paid">Couples experience</Badge>}
        {service.isAddon && <Badge status="pending">Add-on</Badge>}
        {service.sessionCount && <Badge status="paid">{service.sessionCount} sessions</Badge>}
      </div>}
      <h1>{service.name}</h1>
      <p>{service.description || service.shortDescription}</p>
      <div className="service-detail__meta"><span><Clock3 size={17} />{service.durationMinutes} minutes</span><strong>{formatServicePrice(service)}</strong></div>
      <Button to={selectPath} onClick={trackSelect}>{isLive ? 'Choose this treatment' : 'Join waitlist for this treatment'}</Button>
    </div>
    </section>
  </>
}
