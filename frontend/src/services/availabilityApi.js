import api from './api'

export const getAvailabilityDays = (params) => api.get('/availability/days', { params }).then(({ data }) => data)
export const getAvailabilityTimes = (params) => api.get('/availability/times', { params }).then(({ data }) => data)
export const checkAvailability = (data) => api.post('/availability/check', data).then((response) => response.data)
