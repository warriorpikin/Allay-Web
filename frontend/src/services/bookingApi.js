import api from './api'

export const createBooking = (data) => api.post('/bookings', data).then((response) => response.data)
export const markWhatsAppHandoff = (reference) => api.post(`/bookings/${encodeURIComponent(reference)}/whatsapp-handoff`).then((response) => response.data)
export const validateDiscountCode = (data) => api.post('/discount-codes/validate', data).then((response) => response.data)
