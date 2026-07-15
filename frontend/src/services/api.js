import axios from 'axios'
import { ADMIN_PROFILE_KEY, ADMIN_TOKEN_KEY, CUSTOMER_TOKEN_KEY } from '../utils/constants'

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
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
    // Image uploads make a real outbound Cloudinary round trip on the server;
    // the default 15s timeout can abort a slow-but-healthy upload before it finishes.
    config.timeout = 30000
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const code = error.response?.data?.code
    const isAdminRequest = error.config?.url?.startsWith('/admin')
    const hadToken = Boolean(error.config?.headers?.Authorization)

    // A redeployed/rotated JWT_SECRET invalidates every previously issued admin
    // token at once; without this, ProtectedRoute only checks token *presence*
    // and every admin page silently 401s forever until localStorage is cleared by hand.
    if (status === 401 && code === 'AUTH_REQUIRED' && hadToken && isAdminRequest) {
      const alreadyOnLogin = window.location.pathname.startsWith('/allay-admin/login')
      if (localStorage.getItem(ADMIN_TOKEN_KEY) && !alreadyOnLogin) {
        localStorage.removeItem(ADMIN_TOKEN_KEY)
        localStorage.removeItem(ADMIN_PROFILE_KEY)
        window.location.href = '/allay-admin/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
