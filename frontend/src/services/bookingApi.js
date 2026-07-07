import api from './api'

export const createBooking = (data) => api.post('/bookings', data).then((response) => response.data)
