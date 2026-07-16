// Canonical public site origin for SEO purposes (canonical links, OG/Twitter
// image URLs, JSON-LD). VITE_SITE_URL should be the real production domain
// (e.g. https://www.allayhouse.com) in production builds.
export function getSiteOrigin() {
  const configured = (import.meta.env.VITE_SITE_URL || '').trim().replace(/\/+$/, '')
  if (configured) return configured
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin
  return 'https://www.allayhouse.com'
}

export function getSiteUrl(path = '') {
  const origin = getSiteOrigin()
  if (!path) return origin
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}
