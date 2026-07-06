import api from './api'

export const initializePayment = (data) => api.post('/payments/initialize', data).then((response) => response.data)
export const verifyPayment = (reference) => api.post('/payments/verify', { reference }).then((response) => response.data)

