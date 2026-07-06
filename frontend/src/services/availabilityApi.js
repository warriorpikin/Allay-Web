import api from './api'

export const getAvailability = (params) => api.get('/availability', { params }).then(({ data }) => data)

