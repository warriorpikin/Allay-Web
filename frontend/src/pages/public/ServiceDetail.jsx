import { ArrowLeft, Clock3 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import Button from '../../components/common/Button'
import ImagePlaceholder from '../../components/common/ImagePlaceholder'
import { placeholderServices } from '../../data/placeholderServices'
import { formatCurrency } from '../../utils/formatCurrency'
import NotFound from './NotFound'

export default function ServiceDetail() {
  const { slug } = useParams()
  const service = placeholderServices.find((item) => item.slug === slug)
  if (!service) return <NotFound />
  return <section className="service-detail section"><div className="service-detail__image"><ImagePlaceholder src={service.image} alt={`${service.name} treatment`} category={service.category} variant="arch" className={`accent-${service.accent || 'stone'}`} /></div><div className="service-detail__content"><Link className="text-link" to="/services"><ArrowLeft size={15} /> All services</Link><span className="eyebrow">{service.category}</span><h1>{service.name}</h1><p>{service.description}</p><div className="service-detail__meta"><span><Clock3 size={17} />{service.durationMinutes} minutes</span><strong>{formatCurrency(service.price)}</strong></div><p className="placeholder-notice">Placeholder price—final menu details remain editable.</p><Button to={`/book?service=${service.slug}`}>Choose this treatment</Button></div></section>
}
