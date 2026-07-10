import api from './api'

function normalizeService(service = {}) {
  const imageUrl = service.imageUrl || service.image || service.localImagePath || ''
  return { ...service, imageUrl, image: imageUrl }
}

export const getServices = () => api.get('/services').then(({ data }) => ({ ...data, services: (data.services || []).map(normalizeService) }))
export const getServiceBySlug = (slug) => api.get(`/services/${slug}`).then(({ data }) => ({ ...data, service: normalizeService(data.service) }))
export const getServiceCategories = () => api.get('/service-categories').then(({ data }) => data)
export const getTestimonials = () => api.get('/testimonials').then(({ data }) => data)
