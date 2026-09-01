import { Check, Search } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import { categoryMatchesService, serviceCategories } from '../../data/serviceCategories'
import { ANALYTICS_EVENTS, serviceParams, trackEvent } from '../../services/analytics'
import { formatServicePrice } from '../../utils/formatServicePrice'
import { matchesServiceSearch } from '../../utils/serviceSearch'

const PAGE_SIZE = 36

function serviceKey(service) {
  return service?.slug || service?.id
}

export default function ServiceMultiSelect({ services, selectedServices, onChange }) {
  const [query, setQuery] = useState('')
  const [categorySlug, setCategorySlug] = useState('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const deferredQuery = useDeferredValue(query)
  const activeCategory = serviceCategories.find((category) => category.slug === categorySlug)

  const availableCategories = useMemo(
    () => serviceCategories.filter((category) => services.some((service) => categoryMatchesService(category, service))),
    [services],
  )
  const filteredServices = useMemo(() => services.filter((service) => {
    const matchesCategory = !activeCategory || categoryMatchesService(activeCategory, service)
    return matchesCategory && matchesServiceSearch(service, deferredQuery)
  }), [activeCategory, deferredQuery, services])
  const visibleServices = filteredServices.slice(0, visibleCount)

  const toggle = (service) => {
    const key = serviceKey(service)
    const selected = selectedServices.some((item) => serviceKey(item) === key)
    if (!selected) trackEvent(ANALYTICS_EVENTS.SELECT_SERVICE, serviceParams(service, { source_section: 'booking_service_selector' }))
    onChange(selected ? selectedServices.filter((item) => serviceKey(item) !== key) : [...selectedServices, service])
  }

  const changeQuery = (value) => {
    setQuery(value)
    setVisibleCount(PAGE_SIZE)
  }
  const changeCategory = (value) => {
    setCategorySlug(value)
    setVisibleCount(PAGE_SIZE)
  }
  const selectedPreview = selectedServices.slice(0, 3).map((service) => service.name).join(', ')
  const remainingSelected = Math.max(selectedServices.length - 3, 0)

  return <>
    <div className="selected-services-note" aria-live="polite">
      {selectedServices.length
        ? <><strong>{selectedServices.length}</strong> {selectedServices.length === 1 ? 'service' : 'services'} selected: {selectedPreview}{remainingSelected ? ` and ${remainingSelected} more` : ''}</>
        : 'No services selected yet.'}
    </div>

    <div className="booking-service-filters">
      <label className="booking-service-search">
        <Search size={17} aria-hidden="true" />
        <span className="sr-only">Search services</span>
        <input type="search" value={query} onChange={(event) => changeQuery(event.target.value)} placeholder="Search massage, braids, Pilates, nails…" />
      </label>
      <select aria-label="Filter services by category" value={categorySlug} onChange={(event) => changeCategory(event.target.value)}>
        <option value="all">All categories</option>
        {availableCategories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
      </select>
    </div>

    <p className="booking-service-results" aria-live="polite">{filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'} found</p>
    <div className="booking-service-grid">
      {visibleServices.map((service) => {
        const selected = selectedServices.some((item) => serviceKey(item) === serviceKey(service))
        const image = service.imageUrl || service.image || ''
        return <button type="button" key={service.id || service.slug} className={`booking-service ${selected ? 'is-selected' : ''} ${image ? 'has-image' : ''}`} aria-pressed={selected} onClick={() => toggle(service)}>
          {image && <img className="booking-service__background" src={image} alt="" loading="lazy" decoding="async" />}
          <span className="booking-service__check"><Check size={15} /></span>
          <span className="booking-service__body">
            <small>{service.serviceGroup || service.category}</small>
            <strong>{service.name}</strong>
            <span>{service.durationLabel || service.category}<b>{formatServicePrice(service)}</b></span>
          </span>
        </button>
      })}
    </div>
    {!filteredServices.length && <p className="booking-service-empty">No matching service. Try another treatment name or category.</p>}
    {visibleServices.length < filteredServices.length && <button className="booking-service-more" type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>Show more services</button>}
  </>
}
