import api from './api'
import { resolveImageUrl } from '../utils/resolveImageUrl'

function normalizeService(service = {}) {
  const imageUrl = resolveImageUrl(service.imageUrl || service.image || service.localImagePath || '')
  return { ...service, imageUrl, image: imageUrl }
}

function normalizeTestimonial(testimonial = {}) {
  const imageUrl = resolveImageUrl(testimonial.imageUrl || testimonial.profileImageUrl || '')
  return { ...testimonial, imageUrl, profileImageUrl: imageUrl }
}

const analyticsOverviewCache = new Map()
const analyticsOverviewInflight = new Map()
const analyticsOverviewTtlMs = 5000

function analyticsKey(params = {}) {
  return JSON.stringify({ ...params, force: undefined })
}

export const loginAdmin = (data) => api.post('/admin/auth/login', data).then((response) => response.data)
export const getAdminAnalyticsOverview = (params = {}) => {
  const key = analyticsKey(params)
  const force = params.force === true || params.force === 'true'
  const cached = analyticsOverviewCache.get(key)
  if (!force && cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.data)
  if (!force && analyticsOverviewInflight.has(key)) return analyticsOverviewInflight.get(key)
  const request = api.get('/admin/analytics/overview', { params }).then(({ data }) => {
    analyticsOverviewCache.set(key, { data, expiresAt: Date.now() + analyticsOverviewTtlMs })
    return data
  }).finally(() => analyticsOverviewInflight.delete(key))
  analyticsOverviewInflight.set(key, request)
  return request
}
export const getDashboardStats = () => api.get('/admin/dashboard/summary').then(({ data }) => data)
export const getAdminBusinessAnalytics = (params = {}) => api.get('/admin/analytics/business-overview', { params }).then(({ data }) => data)
export const getBookings = (params) => api.get('/admin/bookings', { params }).then(({ data }) => data)
export const getAdminBooking = (id) => api.get(`/admin/bookings/${id}`).then(({ data }) => data)
export const getAdminUsers = (params) => api.get('/admin/users', { params }).then(({ data }) => data)
export const getAdminCustomers = (params) => api.get('/admin/customers', { params }).then(({ data }) => data)
export const getAdminCustomer = (id) => api.get(`/admin/customers/${id}`).then(({ data }) => data)
export const getAdminServices = () => api.get('/admin/services').then(({ data }) => ({ ...data, services: (data.services || []).map(normalizeService) }))
export const getAdminServiceCategories = () => api.get('/admin/services/meta/categories').then(({ data }) => data)
export const createAdminService = (data) => api.post('/admin/services', data).then(({ data: response }) => ({ ...response, service: normalizeService(response.service) }))
export const updateAdminService = (id, data) => api.patch(`/admin/services/${id}`, data).then(({ data: response }) => ({ ...response, service: normalizeService(response.service) }))
export const deleteAdminService = (id) => api.delete(`/admin/services/${id}`)
export const getAdminTestimonials = () => api.get('/admin/testimonials').then(({ data }) => ({ ...data, testimonials: (data.testimonials || []).map(normalizeTestimonial) }))
export const createAdminTestimonial = (data) => api.post('/admin/testimonials', data).then(({ data: response }) => ({ ...response, testimonial: normalizeTestimonial(response.testimonial) }))
export const updateAdminTestimonial = (id, data) => api.patch(`/admin/testimonials/${id}`, data).then(({ data: response }) => ({ ...response, testimonial: normalizeTestimonial(response.testimonial) }))
export const deleteAdminTestimonial = (id) => api.delete(`/admin/testimonials/${id}`)
export const getWaitlist = () => api.get('/admin/waitlist').then(({ data }) => data)
export const sendWaitlistCoupons = (ids = []) => api.post('/admin/waitlist/send-coupons', { ids }).then(({ data }) => data)
export const getSettings = () => api.get('/admin/settings').then(({ data }) => data)
export const updateSetting = (key, data) => api.patch(`/admin/settings/${key}`, data).then(({ data: response }) => response)
export const updateBookingStatus = (id, data) => api.patch(`/admin/bookings/${id}/status`, data).then((response) => response.data)
export const updateBookingPaymentStatus = (id, data) => api.patch(`/admin/bookings/${id}/payment-status`, data).then((response) => response.data)

export const getAdminPromotions = () => api.get('/admin/promotions').then(({ data }) => data)
export const getAdminPromotion = (id) => api.get(`/admin/promotions/${id}`).then(({ data }) => data)
export const createAdminPromotion = (data) => api.post('/admin/promotions', data).then(({ data: response }) => response)
export const updateAdminPromotion = (id, data) => api.patch(`/admin/promotions/${id}`, data).then(({ data: response }) => response)
export const deleteAdminPromotion = (id) => api.delete(`/admin/promotions/${id}`)
export const duplicateAdminPromotion = (id) => api.post(`/admin/promotions/${id}/duplicate`).then(({ data }) => data)
export const setAdminPromotionStatus = (id, status) => api.patch(`/admin/promotions/${id}/status`, { status }).then(({ data }) => data)
export const uploadPromotionImage = (file) => {
  const form = new FormData()
  form.append('image', file)
  return api.post('/admin/promotions/upload-image', form).then(({ data }) => data)
}

export const getEmailRecipients = (params) => api.get('/admin/emails/recipients', { params }).then(({ data }) => data)
export const previewCampaignEmail = (payload) => api.post('/admin/emails/preview', payload).then(({ data }) => data)
export const sendTestCampaignEmail = (payload) => api.post('/admin/emails/test', payload).then(({ data }) => data)
export const sendCampaignEmail = (payload) => api.post('/admin/emails/send', payload).then(({ data }) => data)
export const getEmailCampaigns = () => api.get('/admin/emails/campaigns').then(({ data }) => data)
export const getEmailCampaign = (id) => api.get(`/admin/emails/campaigns/${id}`).then(({ data }) => data)
export const uploadCampaignImage = (file) => {
  const form = new FormData()
  form.append('image', file)
  return api.post('/admin/emails/upload-image', form).then(({ data }) => data)
}
export const previewWaitlistCouponEmail = (payload) => api.post('/admin/emails/preview-waitlist-coupon', payload).then(({ data }) => data)
export const sendWaitlistCouponTest = (payload) => api.post('/admin/emails/test-waitlist-coupon', payload).then(({ data }) => data)

export const getBusinessHours = () => api.get('/admin/availability/business-hours').then(({ data }) => data)
export const updateBusinessHours = (id, data) => api.patch(`/admin/availability/business-hours/${id}`, data).then(({ data: response }) => response)
export const getBlockedPeriods = () => api.get('/admin/availability/blocked-periods').then(({ data }) => data)
export const createBlockedPeriod = (data) => api.post('/admin/availability/blocked-periods', data).then(({ data: response }) => response)
export const deleteBlockedPeriod = (id) => api.delete(`/admin/availability/blocked-periods/${id}`)
export const getCapacityOverrides = () => api.get('/admin/availability/capacity-overrides').then(({ data }) => data)
export const createCapacityOverride = (data) => api.post('/admin/availability/capacity-overrides', data).then(({ data: response }) => response)
export const deleteCapacityOverride = (id) => api.delete(`/admin/availability/capacity-overrides/${id}`)
