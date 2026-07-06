import SectionHeader from '../../components/common/SectionHeader'
import ServiceCard from '../../components/common/ServiceCard'
import { placeholderServices } from '../../data/placeholderServices'
import { PLACEHOLDER_NOTICE } from '../../utils/constants'

export default function Services() {
  return <><section className="page-hero"><SectionHeader eyebrow="The Allay House menu" title="Care for every part of you." subtitle="Explore the treatments and movement experiences being prepared for opening." centered as="h1" /></section><section className="section services-section"><p className="placeholder-notice">{PLACEHOLDER_NOTICE}</p><div className="service-grid">{placeholderServices.map((service) => <ServiceCard key={service.id} service={service} />)}</div></section></>
}

