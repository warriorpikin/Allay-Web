import { Flower2, Leaf, Scissors, Sparkles } from 'lucide-react'
import PageHero from '../../components/common/PageHero'
import ServiceCard from '../../components/common/ServiceCard'
import { placeholderServices } from '../../data/placeholderServices'
import { serviceCategories } from '../../data/serviceCategories'
import { PLACEHOLDER_NOTICE } from '../../utils/constants'

const icons = [Leaf, Sparkles, Flower2, Scissors, Leaf, Sparkles]

export default function Services() {
  return <><PageHero eyebrow="Explore the house" title="Care, in every form." subtitle="Beauty, wellness, and movement live together at Allay House—each experience considered, unhurried, and made personal." tags={['Spa rituals', 'Mindful movement', 'Beauty finishing']} imageCategory="The Allay House menu" /><section className="category-showcase section"><div className="category-showcase__track">{serviceCategories.slice(0, 6).map((category, index) => { const Icon = icons[index]; return <article key={category.id} className={`category-card category-card--${index % 3}`}><span>0{index + 1}</span><Icon size={24} strokeWidth={1.3} /><h3>{category.name}</h3><p>{category.description}</p></article> })}</div></section><section className="section services-section"><p className="placeholder-notice">{PLACEHOLDER_NOTICE}</p><div className="service-grid">{placeholderServices.map((service) => <ServiceCard key={service.id} service={service} />)}</div></section></>
}

