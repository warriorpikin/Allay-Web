import api from './api'

export const getSiteMode = () => api.get('/settings/site-mode').then(({ data }) => data)
