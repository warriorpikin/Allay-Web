// Namespaced browser storage for the promotion trigger/frequency engine.
// localStorage = anonymous long-term frequency info (survives tabs/reloads).
// sessionStorage = this-tab-session-only info. Never touches unrelated keys.
const LOCAL_KEY = 'allay:promo:v1'
const SESSION_KEY = 'allay:promo:session:v1'

function readJson(storage, key, fallback) {
  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(storage, key, value) {
  try { storage.setItem(key, JSON.stringify(value)) } catch { /* storage unavailable (private mode, quota, etc) */ }
}

function readLocal() {
  const data = readJson(localStorage, LOCAL_KEY, { visits: {}, promos: {} })
  if (!data.visits) data.visits = {}
  if (!data.promos) data.promos = {}
  return data
}

function readSession() {
  const data = readJson(sessionStorage, SESSION_KEY, { shownIds: [], sessionImpressions: {} })
  if (!data.shownIds) data.shownIds = []
  if (!data.sessionImpressions) data.sessionImpressions = {}
  return data
}

// Reads the previous visit timestamp BEFORE overwriting it, per the
// "return after inactivity" requirement — eligibility must be judged
// against the visit before this one, not the one being recorded now.
export function recordVisitAndGetContext() {
  const data = readLocal()
  const now = new Date().toISOString()
  const previousVisitAt = data.visits.lastVisitAt || null
  const isFirstVisit = !data.visits.firstVisitAt
  data.visits.firstVisitAt = data.visits.firstVisitAt || now
  data.visits.lastVisitAt = now
  writeLocal(data)
  return { isFirstVisit, previousVisitAt }
}

function writeLocal(data) { writeJson(localStorage, LOCAL_KEY, data) }
function writeSessionData(data) { writeJson(sessionStorage, SESSION_KEY, data) }

export function getPromoRecord(promoId, campaignVersion) {
  const data = readLocal()
  const record = data.promos[promoId]
  if (!record || record.campaignVersion !== campaignVersion) {
    return { impressions: 0, lastShownAt: null, lastDismissedAt: null, dismissedForGood: false, campaignVersion }
  }
  return record
}

export function getSessionImpressions(promoId) {
  return readSession().sessionImpressions[promoId] || 0
}

export function hasShownThisSession(promoId) {
  return readSession().shownIds.includes(promoId)
}

export function recordImpression(promoId, campaignVersion) {
  const data = readLocal()
  const base = getPromoRecord(promoId, campaignVersion)
  data.promos[promoId] = { ...base, impressions: base.impressions + 1, lastShownAt: new Date().toISOString(), campaignVersion }
  writeLocal(data)

  const session = readSession()
  if (!session.shownIds.includes(promoId)) session.shownIds = [...session.shownIds, promoId]
  session.sessionImpressions[promoId] = (session.sessionImpressions[promoId] || 0) + 1
  writeSessionData(session)
}

export function recordDismissal(promoId, campaignVersion, stopAfterDismissal) {
  const data = readLocal()
  const base = getPromoRecord(promoId, campaignVersion)
  data.promos[promoId] = { ...base, lastDismissedAt: new Date().toISOString(), dismissedForGood: base.dismissedForGood || stopAfterDismissal }
  writeLocal(data)
}
