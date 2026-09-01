import { Flower2, Leaf, Scissors, Sparkles } from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import EmptyState from '../../components/common/EmptyState'
import SectionHeader from '../../components/common/SectionHeader'
import Seo from '../../components/common/Seo'
import ServiceCard from '../../components/common/ServiceCard'
import ServiceSearch from '../../components/services/ServiceSearch'
import { categoryMatchesService, serviceCategories } from '../../data/serviceCategories'
import { ANALYTICS_EVENTS, trackEvent } from '../../services/analytics'
import { getServices } from '../../services/servicesApi'
import { matchesServiceSearch } from '../../utils/serviceSearch'

const icons = [Leaf, Sparkles, Flower2, Scissors]

export default function Services() {
  const [searchParams] = useSearchParams()
  const { categorySlug: routeCategorySlug } = useParams()
  const navigate = useNavigate()
  const [services, setServices] = useState([])
  const [query, setQuery] = useState(() => searchParams.get('q') || '')
  const deferredQuery = useDeferredValue(query)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const categoryRefs = useRef(new Map())
  const requestedCategory = routeCategorySlug || searchParams.get('category') || 'all'
  const activeCategoryData = requestedCategory === 'all' ? null : serviceCategories.find((category) => category.slug === requestedCategory)
  const activeCategory = activeCategoryData ? requestedCategory : 'all'

  useEffect(() => {
    setLoading(true)
    setFailed(false)
    getServices()
      .then((data) => setServices(data.services || []))
      .catch(() => { setServices([]); setFailed(true) })
      .finally(() => setLoading(false))
  }, [])

  const availableCategories = useMemo(() => serviceCategories.filter((category) => services.some((service) => categoryMatchesService(category, service))), [services])
  const filteredServices = useMemo(() => services.filter((service) => {
    const categoryMatch = !activeCategoryData || categoryMatchesService(activeCategoryData, service)
    return categoryMatch && matchesServiceSearch(service, deferredQuery)
  }), [activeCategoryData, deferredQuery, services])

  const selectCategory = (slug) => {
    navigate(slug === 'all' ? '/services' : `/services/category/${slug}`)
    const category = slug === 'all' ? { name: 'All services' } : serviceCategories.find((item) => item.slug === slug)
    trackEvent(ANALYTICS_EVENTS.CATEGORY_VIEW, { category_name: category?.name || slug, source_section: 'services_category_showcase' })
    categoryRefs.current.get(slug)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  const pageTitle = activeCategoryData ? `${activeCategoryData.name} | Allay House` : 'Beauty & Wellness Services | Allay House'
  const pageDescription = activeCategoryData?.description
    ? `${activeCategoryData.description} Book ${activeCategoryData.name.toLowerCase()} at Allay House in Lagos.`
    : 'Explore the complete Allay House price list for spa rituals, hair, Pilates, nails, massage, head spa, hammam, facials, and body treatments.'
  const canonicalPath = activeCategoryData ? `/services/category/${activeCategoryData.slug}` : '/services'

  return <>
    <Seo title={pageTitle} description={pageDescription} path={canonicalPath} />
    <Breadcrumbs items={activeCategoryData ? [{ label: 'Home', path: '/' }, { label: 'Services', path: '/services' }, { label: activeCategoryData.name, path: canonicalPath }] : [{ label: 'Home', path: '/' }, { label: 'Services', path: '/services' }]} />
    <header className="page-intro services-intro">
      <SectionHeader eyebrow="Explore the house" title={activeCategoryData ? activeCategoryData.name : 'Care, in every form.'} subtitle={activeCategoryData?.description || 'The complete Allay House service menu, with transparent pricing and WhatsApp booking.'} as="h1" />
      <ServiceSearch services={services} value={query} onChange={setQuery} onSelect={(service) => navigate(`/services/${service.slug}`)} />
    </header>

    <section className="category-showcase section" aria-label="Filter by service category">
      <div className="category-showcase__track">
        <button type="button" ref={(node) => { if (node) categoryRefs.current.set('all', node) }} className={`category-card category-card--all ${activeCategory === 'all' ? 'is-active' : ''}`} aria-pressed={activeCategory === 'all'} onClick={() => selectCategory('all')}>
          <span>All</span><Sparkles size={21} strokeWidth={1.3} /><h3 className="category-card__title">All services</h3><p>View the full price list.</p>
        </button>
        {availableCategories.map((category, index) => {
          const Icon = icons[index % icons.length]
          const selected = activeCategory === category.slug
          const count = services.filter((service) => categoryMatchesService(category, service)).length
          return <button type="button" key={category.id} ref={(node) => { if (node) categoryRefs.current.set(category.slug, node) }} className={`category-card category-card--${index % 4} ${selected ? 'is-active' : ''}`} aria-pressed={selected} aria-label={`Show ${category.name} services`} onClick={() => selectCategory(category.slug)}>
            <span>{String(count).padStart(2, '0')} services</span><Icon size={21} strokeWidth={1.3} /><h3 className="category-card__title">{category.name}</h3><p>{category.description}</p>
          </button>
        })}
      </div>
    </section>

    <section className="section services-section compact">
      <div className="selected-services-note" aria-live="polite">
        <strong>{filteredServices.length}</strong> {filteredServices.length === 1 ? 'service' : 'services'} shown
        {activeCategoryData && <span> under {activeCategoryData.name}</span>}
        {query.trim() && <span> matching “{query.trim()}”</span>}
      </div>
      {loading
        ? <div className="service-grid" aria-label="Loading services">{Array.from({ length: 6 }).map((_, index) => <div className="service-card-skeleton" key={index} aria-hidden="true"><div><i /><b /><em /></div></div>)}</div>
        : failed
          ? <EmptyState title="The service menu could not load" message="Please refresh the page or contact Allay House on WhatsApp for the current price list." />
          : filteredServices.length
            ? <div className="service-grid">{filteredServices.map((service) => <ServiceCard key={service.id} service={service} />)}</div>
            : <EmptyState title="No matching service" message="Try a broader service name, another category, or clear the search." />}
    </section>
  </>
}
