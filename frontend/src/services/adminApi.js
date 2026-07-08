import api from './api'

export const loginAdmin = (data) => api.post('/admin/auth/login', data).then((response) => response.data)
export const getDashboardStats = () => api.get('/admin/dashboard/summary').then(({ data }) => data)
export const getBookings = (params) => api.get('/admin/bookings', { params }).then(({ data }) => data)
export const getWaitlist = () => api.get('/admin/waitlist').then(({ data }) => data)
export const getSettings = () => api.get('/admin/settings').then(({ data }) => data)
export const updateSetting = (key, data) => api.patch(`/admin/settings/${key}`, data).then(({ data: response }) => response)
export const updateBookingStatus = (id, data) => api.patch(`/admin/bookings/${id}/status`, data).then((response) => response.data)
export const updateBookingPaymentStatus = (id, data) => api.patch(`/admin/bookings/${id}/payment-status`, data).then((response) => response.data)

export const getBusinessHours = () => api.get('/admin/availability/business-hours').then(({ data }) => data)
export const updateBusinessHours = (id, data) => api.patch(`/admin/availability/business-hours/${id}`, data).then(({ data: response }) => response)
export const getBlockedPeriods = () => api.get('/admin/availability/blocked-periods').then(({ data }) => data)
export const createBlockedPeriod = (data) => api.post('/admin/availability/blocked-periods', data).then(({ data: response }) => response)
export const deleteBlockedPeriod = (id) => api.delete(`/admin/availability/blocked-periods/${id}`)
export const getCapacityOverrides = () => api.get('/admin/availability/capacity-overrides').then(({ data }) => data)
export const createCapacityOverride = (data) => api.post('/admin/availability/capacity-overrides', data).then(({ data: response }) => response)
export const deleteCapacityOverride = (id) => api.delete(`/admin/availability/capacity-overrides/${id}`)
