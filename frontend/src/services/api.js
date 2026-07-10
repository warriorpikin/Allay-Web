import axios from 'axios'
import { ADMIN_TOKEN_KEY, CUSTOMER_TOKEN_KEY } from '../utils/constants'

function normalizeApiBaseUrl(value) {
  const raw = (value || 'http://localhost:5000/api').trim().replace(/\/+$/, '')
  if (raw.endsWith('/api/api')) return raw.replace(/\/api\/api$/, '/api')
  if (raw.endsWith('/api')) return raw
  return `${raw}/api`
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL)

const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000, headers: { 'Content-Type': 'application/json' } })

api.interceptors.request.use((config) => {
  const isAdminRequest = config.url?.startsWith('/admin')
  const token = localStorage.getItem(isAdminRequest ? ADMIN_TOKEN_KEY : CUSTOMER_TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (config.data instanceof FormData) delete config.headers['Content-Type']
  return config
})

export default api
