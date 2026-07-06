import { ArrowRight, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/formatCurrency'
import Button from './Button'
import ImagePlaceholder from './ImagePlaceholder'

export default function ServiceCard({ service }) {
  return <article className="service-card">
    <Link className="service-card__image" to={`/services/${service.slug}`}><ImagePlaceholder src={service.image} alt={`${service.name} treatment`} category={service.category} variant="card" className={`accent-${service.accent || 'stone'}`} /></Link>
    <div className="service-card__body">
      <span className="service-card__category">{service.category}</span>
      <h3><Link to={`/services/${service.slug}`}>{service.name}</Link></h3>
      <p>{service.description}</p>
      <div className="service-card__meta"><span><Clock3 size={14} />{service.durationMinutes} mins</span><strong>{formatCurrency(service.price)}</strong></div>
      <div className="service-card__actions"><Link className="text-link" to={`/services/${service.slug}`}>View details <ArrowRight size={15} /></Link><Button to={`/book?service=${service.slug}`} variant="ghost" size="sm">Select</Button></div>
    </div>
  </article>
}
