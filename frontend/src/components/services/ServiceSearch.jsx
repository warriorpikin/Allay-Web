import { ArrowUpRight, Search, X } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { formatServicePrice } from '../../utils/formatServicePrice'
import { matchesServiceSearch } from '../../utils/serviceSearch'

export default function ServiceSearch({ services, value, onChange, onSelect }) {
  const listboxId = useId()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const suggestions = useMemo(() => {
    const query = value.trim()
    if (!query) return []
    return services.filter((service) => matchesServiceSearch(service, query)).slice(0, 7)
  }, [services, value])

  const choose = (service) => {
    setOpen(false)
    onSelect(service)
  }

  const handleKeyDown = (event) => {
    if (!open || !suggestions.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + suggestions.length) % suggestions.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(suggestions[activeIndex])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return <div className="service-search">
    <div className="service-search__control">
      <Search size={20} aria-hidden="true" />
      <input
        type="search"
        value={value}
        placeholder="Search massage, braids, Pilates, pedicure…"
        aria-label="Search Allay House services"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={open && Boolean(value.trim())}
        aria-activedescendant={open && suggestions[activeIndex] ? `${listboxId}-${suggestions[activeIndex].id}` : undefined}
        onChange={(event) => { onChange(event.target.value); setOpen(true); setActiveIndex(0) }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={handleKeyDown}
      />
      {value && <button type="button" aria-label="Clear service search" onClick={() => { onChange(''); setOpen(false) }}><X size={16} /></button>}
    </div>

    {open && value.trim() && <div className="service-search__suggestions" id={listboxId} role="listbox" aria-label="Service suggestions">
      {suggestions.length ? suggestions.map((service, index) => <button
        type="button"
        role="option"
        aria-selected={index === activeIndex}
        id={`${listboxId}-${service.id}`}
        key={service.id || service.slug}
        className={index === activeIndex ? 'is-active' : ''}
        onMouseDown={(event) => event.preventDefault()}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => choose(service)}
      >
        <span><strong>{service.name}</strong><small>{service.serviceGroup || service.category}</small></span>
        <span><b>{formatServicePrice(service)}</b><ArrowUpRight size={15} /></span>
      </button>) : <p>No matching service yet. Try a treatment, category, or style name.</p>}
    </div>}

    <p className="service-search__hint">Search by treatment, style, body area, category, or service group.</p>
  </div>
}
