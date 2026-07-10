import api from './api'
import { resolveImageUrl } from '../utils/resolveImageUrl'

function normalizeService(service = {}) {
  const imageUrl = resolveImageUrl(service.imageUrl || service.image || service.localImagePath || '')
  return { ...service, imageUrl, image: imageUrl }
}

export const getServices = () => api.get('/services').then(({ data }) => ({ ...data, services: (data.services || []).map(normalizeService) }))
export const getServiceBySlug = (slug) => api.get(`/services/${slug}`).then(({ data }) => ({ ...data, service: normalizeService(data.service) }))
export const getServiceCategories = () => api.get('/service-categories').then(({ data }) => data)
export const getTestimonials = () => api.get('/testimonials').then(({ data }) => ({ ...data, testimonials: (data.testimonials || []).map((testimonial) => {
  const imageUrl = resolveImageUrl(testimonial.imageUrl || testimonial.profileImageUrl || '')
  return { ...testimonial, imageUrl, profileImageUrl: imageUrl }
}) }))
