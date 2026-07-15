import { getPromoRecord, getSessionImpressions, hasShownThisSession } from './promotionStorage'

const ROUTE_MATCHERS = {
  home: (pathname) => pathname === '/',
  waitlist: (pathname) => pathname === '/waitlist',
  services: (pathname) => pathname.startsWith('/services'),
  booking: (pathname) => pathname === '/book',
}

function matchesRoute(promotion, pathname) {
  const routes = promotion.targetRoutes?.length ? promotion.targetRoutes : ['all']
  if (routes.includes('all')) return true
  return routes.some((route) => (ROUTE_MATCHERS[route] ? ROUTE_MATCHERS[route](pathname) : pathname === route))
}

function matchesAudience(promotion, { isSignedIn }) {
  if (promotion.targetAudience === 'guest') return !isSignedIn
  if (promotion.targetAudience === 'signed_in') return isSignedIn
  // 'new' / 'returning' are expressed through the first-visit / return-visit
  // triggers themselves, so audience just passes through here for those.
  return true
}

function isWithinCooldown(record, cooldownSeconds) {
  if (!record.lastShownAt || !cooldownSeconds) return false
  return Date.now() - new Date(record.lastShownAt).getTime() < cooldownSeconds * 1000
}

// Evaluates whether `promotion` is eligible to display right now, given the
// visitor's current browsing context and stored frequency history. Does NOT
// decide which of several eligible promotions wins — see pickPromotion.
export function evaluatePromotionEligibility(promotion, context) {
  if (!matchesRoute(promotion, context.pathname)) return false
  if (!matchesAudience(promotion, context)) return false

  const record = getPromoRecord(promotion.id, promotion.campaignVersion)

  if (promotion.stopAfterDismissal && record.dismissedForGood) return false
  if (promotion.maxLifetimeImpressions != null && record.impressions >= promotion.maxLifetimeImpressions) return false
  if (promotion.maxPerSession > 0 && getSessionImpressions(promotion.id) >= promotion.maxPerSession) return false
  if (isWithinCooldown(record, promotion.cooldownSeconds)) return false

  const matchedTriggers = []
  if (promotion.triggerFirstVisit && context.isFirstVisit) matchedTriggers.push('first_visit')
  if (promotion.triggerReturnVisit && context.previousVisitAt) {
    const daysSince = (Date.now() - new Date(context.previousVisitAt).getTime()) / 86_400_000
    if (daysSince >= promotion.returnAfterDays) matchedTriggers.push('return_visit')
  }
  if (promotion.triggerAfterDelay && context.delayElapsedIds?.has(promotion.id)) matchedTriggers.push('delay')
  if (promotion.triggerOnReload && context.isReloadNavigation) {
    if (promotion.reloadFrequency === 'every_reload') matchedTriggers.push('reload')
    else if (promotion.reloadFrequency === 'once_per_session') { if (!hasShownThisSession(promotion.id)) matchedTriggers.push('reload') }
    else if (promotion.reloadFrequency === 'cooldown') { if (!isWithinCooldown(record, promotion.cooldownSeconds)) matchedTriggers.push('reload') }
  }
  if (promotion.triggerAfterSignup && context.justSignedUp) matchedTriggers.push('signup')
  if (promotion.triggerAfterLogin && context.justLoggedIn) matchedTriggers.push('login')

  const hasAnyTriggerEnabled = promotion.triggerFirstVisit || promotion.triggerReturnVisit || promotion.triggerAfterDelay
    || promotion.triggerOnReload || promotion.triggerAfterSignup || promotion.triggerAfterLogin
  // A promotion with no trigger boxes ticked at all is treated as always-on
  // (still gated by route/audience/frequency above) so a simple "just show
  // this" campaign doesn't require ticking a trigger it doesn't need.
  if (!hasAnyTriggerEnabled) return true

  return matchedTriggers.length > 0
}

// Among all eligible candidates, priority wins; ties break by most recent
// start date. Never returns more than one, so only one modal ever shows.
export function pickPromotion(promotions, context) {
  const eligible = promotions.filter((promotion) => evaluatePromotionEligibility(promotion, context))
  if (!eligible.length) return null
  return eligible.slice().sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    return new Date(b.startAt || 0) - new Date(a.startAt || 0)
  })[0]
}

// True if any other important UI is currently open/active, so the promotion
// should not interrupt it: an admin/CRUD modal, the mobile nav overlay, or a
// focused form field (typing, e.g. mid-booking or mid-signup).
export function isInterruptionUnsafe() {
  if (document.querySelector('.modal-backdrop')) return true
  if (document.querySelector('.nav--open')) return true
  const active = document.activeElement
  if (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return true
  return false
}

export function resolveCtaHref(action, target, { isLive }) {
  switch (action) {
    case 'waitlist': return target || '/waitlist'
    case 'booking': return target || '/book'
    case 'service': return target ? (isLive ? `/book?service=${target}` : `/waitlist?service=${target}`) : (isLive ? '/book' : '/waitlist')
    case 'internal_page': return target || '/'
    case 'external_url': return target || null
    case 'close':
    case 'none':
    default: return null
  }
}
