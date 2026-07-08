import api from './api'

export const sendContactMessage = (data) => api.post('/contact', data).then((response) => response.data)
