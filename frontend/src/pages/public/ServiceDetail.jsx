import { ArrowLeft, Clock3 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../../components/common/Button'
import Loader from '../../components/common/Loader'
import { getServiceImage } from '../../data/allayImages'
import { placeholderServices } from '../../data/placeholderServices'
import { getServiceBySlug } from '../../services/servicesApi'
import { formatPriceLabel } from '../../utils/formatCurrency'
import NotFound from './NotFound'

export default function ServiceDetail() {
  const { slug } = useParams()
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

  if (loading && !service) return <Loader label="Opening service details" />
  if (missing || !service) return <NotFound />

  const image = service.imageUrl || service.image || getServiceImage(service.slug)

  return <section className="service-detail section">
    <div className="service-detail__image">
      <img src={image} alt={`${service.name} treatment`} width="900" height="1200" loading="eager" fetchPriority="high" decoding="async" onError={(event) => { event.currentTarget.hidden = true }} />
    </div>
    <div className="service-detail__content">
      <Link className="text-link" to="/services"><ArrowLeft size={15} /> All services</Link>
      <span className="eyebrow">{service.category}</span>
      <h1>{service.name}</h1>
      <p>{service.description}</p>
      <div className="service-detail__meta"><span><Clock3 size={17} />{service.durationMinutes} minutes</span><strong>{formatPriceLabel(service.price)}</strong></div>
      <Button to={`/book?service=${service.slug}`}>Choose this treatment</Button>
    </div>
  </section>
}
