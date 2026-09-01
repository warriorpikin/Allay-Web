import { API_BASE_URL } from '../services/api'

const apiOrigin = (() => {
  try {
    return new URL(API_BASE_URL).origin
  } catch {
    return ''
  }
})()

function optimizeCloudinaryImage(url) {
  const marker = '/image/upload/'
  if (!url.includes('res.cloudinary.com') || !url.includes(marker)) return url
  const [prefix, suffix] = url.split(marker)
  if (!suffix || suffix.startsWith('s--') || suffix.includes('f_auto,')) return url
  return `${prefix}${marker}f_auto,q_auto:good,c_limit,w_1400/${suffix}`
}

export function resolveImageUrl(value, fallback = '') {
  const raw = String(value || '').trim()
  if (!raw) return fallback
  if (raw.includes('/images/allay/placeholders/')) return fallback
  if (/^https?:/i.test(raw)) return optimizeCloudinaryImage(raw)
  if (/^(blob:|data:)/i.test(raw)) return raw
  if (raw.startsWith('/images/')) return raw
  if (raw.startsWith('/uploads/')) return `${apiOrigin}${raw}`
  if (raw.startsWith('uploads/')) return `${apiOrigin}/${raw}`
  if (/^[a-z]:\\/i.test(raw)) return fallback
  return raw
}
