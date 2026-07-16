// Small in-memory cache for generated sitemap/robots XML. Short TTL so a
// forgotten invalidation call self-heals quickly, plus explicit invalidation
// from service/category/membership mutations so the sitemap reflects admin
// changes without waiting out the TTL.
const CACHE_TTL_MS = 5 * 60 * 1000

const cache = new Map()

export async function getCached(key, producer) {
  const hit = cache.get(key)
  if (hit && hit.expires > Date.now()) return hit.value
  const value = await producer()
  cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS })
  return value
}

export function invalidateSitemapCache() {
  cache.clear()
}
