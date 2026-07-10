import { Flower2, Leaf, Scissors, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SectionHeader from '../../components/common/SectionHeader'
import ServiceCard from '../../components/common/ServiceCard'
import { getCategoryImage } from '../../data/allayImages'
import { placeholderServices } from '../../data/placeholderServices'
import { serviceCategories } from '../../data/serviceCategories'
import { getServices } from '../../services/servicesApi'

const icons = [Leaf, Sparkles, Flower2, Scissors, Leaf, Sparkles]

function normalizeCategory(value = '') {
  return String(value).trim().toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [services, setServices] = useState(placeholderServices)
  const categoryRefs = useRef(new Map())
  const activeCategory = searchParams.get('category') || 'all'

  useEffect(() => {
    getServices()
      .then((data) => {
        if (data.services?.length) setServices(data.services)
      })
      .catch(() => setServices(placeholderServices))
  }, [])

  const filteredServices = useMemo(() => {
    if (activeCategory === 'all') return services
    return services.filter((service) => normalizeCategory(service.category) === activeCategory)
  }, [activeCategory, services])

  const selectCategory = (slug) => {
    if (slug === 'all') setSearchParams({})
    else setSearchParams({ category: slug })
    categoryRefs.current.get(slug)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  return <>
    <header className="page-intro">
      <SectionHeader eyebrow="Explore the house" title="Care, in every form." subtitle="Beauty, wellness, and movement, each considered and made personal." as="h1" />
    </header>

    <section className="category-showcase section">
      <div className="category-showcase__track">
        <button type="button" ref={(node) => { if (node) categoryRefs.current.set('all', node) }} className={`category-card category-card--all ${activeCategory === 'all' ? 'is-active' : ''}`} style={{ '--card-image': `url(${getCategoryImage('all')})` }} aria-pressed={activeCategory === 'all'} onClick={() => selectCategory('all')}>
          <span>All</span>
          <Sparkles size={24} strokeWidth={1.3} />
          <h3 className="category-card__title">All services</h3>
          <p>View every Allay House experience.</p>
        </button>
        {serviceCategories.map((category, index) => {
          const Icon = icons[index % icons.length]
          const selected = activeCategory === category.slug
          return <button type="button" key={category.id} ref={(node) => { if (node) categoryRefs.current.set(category.slug, node) }} className={`category-card category-card--${index % 3} ${selected ? 'is-active' : ''}`} style={{ '--card-image': `url(${getCategoryImage(category.slug)})` }} aria-pressed={selected} aria-label={`Show ${category.name} services`} onClick={() => selectCategory(category.slug)}>
            <span>0{index + 1}</span>
            <Icon size={24} strokeWidth={1.3} />
            <h3 className="category-card__title">{category.name}</h3>
            <p>{category.description}</p>
          </button>
        })}
      </div>
    </section>

    <section className="section services-section compact">
      <div className="selected-services-note">
        <strong>{filteredServices.length}</strong> {filteredServices.length === 1 ? 'service' : 'services'} shown
        {activeCategory !== 'all' && <span> under {serviceCategories.find((category) => category.slug === activeCategory)?.name || 'this category'}</span>}
      </div>
      {filteredServices.length ? <div className="service-grid">{filteredServices.map((service) => <ServiceCard key={service.id} service={service} />)}</div> : <div className="empty-state"><h3>No services are currently available in this category.</h3><p>Please explore another Allay House category.</p></div>}
    </section>
  </>
}
