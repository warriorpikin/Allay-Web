function serviceSearchText(service) {
  return [service.name, service.serviceGroup, service.category, service.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function matchesServiceSearch(service, query) {
  const terms = String(query || '').trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return true
  const haystack = serviceSearchText(service)
  return terms.every((term) => haystack.includes(term))
}
