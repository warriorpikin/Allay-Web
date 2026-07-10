import { API_BASE_URL } from '../services/api'

const apiOrigin = (() => {
  try {
    return new URL(API_BASE_URL).origin
  } catch {
    return ''
  }
})()

export function resolveImageUrl(value, fallback = '') {
  const raw = String(value || '').trim()
  if (!raw) return fallback
  if (/^(https?:|blob:|data:)/i.test(raw)) return raw
  if (raw.startsWith('/images/')) return raw
  if (raw.startsWith('/uploads/')) return `${apiOrigin}${raw}`
  if (raw.startsWith('uploads/')) return `${apiOrigin}/${raw}`
  if (/^[a-z]:\\/i.test(raw)) return fallback
  return raw
}
