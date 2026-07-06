import api from './api'

export const getServices = () => api.get('/services').then(({ data }) => data)
export const getServiceBySlug = (slug) => api.get(`/services/${slug}`).then(({ data }) => data)
export const getServiceCategories = () => api.get('/service-categories').then(({ data }) => data)

