import api from './api'

export const loginAdmin = (data) => api.post('/admin/auth/login', data).then((response) => response.data)
export const getDashboardStats = () => api.get('/admin/dashboard').then(({ data }) => data)
export const getBookings = (params) => api.get('/admin/bookings', { params }).then(({ data }) => data)
export const updateBookingStatus = (id, data) => api.patch(`/admin/bookings/${id}/status`, data).then((response) => response.data)

