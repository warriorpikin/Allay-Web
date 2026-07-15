import api from './api'

export const getActivePromotions = () => api.get('/promotions/active').then(({ data }) => data.promotions || [])
