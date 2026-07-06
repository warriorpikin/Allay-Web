import api from './api'

export const joinWaitlist = (data) => api.post('/waitlist', data).then((response) => response.data)

