import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useSiteMode } from '../../hooks/useSiteMode'
import { getActivePromotions } from '../../services/promotionApi'
import { logFetchError } from '../../utils/getErrorMessage'
import { isInterruptionUnsafe, pickPromotion } from '../../utils/promotionEngine'
import { recordDismissal, recordImpression, recordVisitAndGetContext } from '../../utils/promotionStorage'
import PromotionModal from './PromotionModal'

function isReloadNavigation() {
  try {
    const [entry] = performance.getEntriesByType('navigation')
    return entry?.type === 'reload'
  } catch {
    return false
  }
}

export default function PromotionManager() {
  const location = useLocation()
  const { isLoading: siteModeLoading } = useSiteMode()
  const { isAuthenticated } = useAuth()
  const [promotions, setPromotions] = useState(null)
  const [active, setActive] = useState(null)
  const [delayElapsedIds, setDelayElapsedIds] = useState(() => new Set())
  const authEventRef = useRef(null)
  const visitContextRef = useRef(null)
  const reloadRef = useRef(null)

  const isAdminRoute = location.pathname.startsWith('/allay-admin')

  useEffect(() => {
    if (isAdminRoute) return
    getActivePromotions().then(setPromotions).catch((error) => {
      logFetchError('Active promotion fetch failed', error)
      setPromotions([])
    })
  }, [isAdminRoute])

  useEffect(() => {
    if (isAdminRoute || !promotions?.length) return undefined
    if (!visitContextRef.current) visitContextRef.current = recordVisitAndGetContext()
    if (reloadRef.current === null) reloadRef.current = isReloadNavigation()

    const timers = promotions
      .filter((promotion) => promotion.triggerAfterDelay)
      .map((promotion) => setTimeout(() => {
        setDelayElapsedIds((current) => new Set(current).add(promotion.id))
      }, promotion.delaySeconds * 1000))
    return () => timers.forEach(clearTimeout)
  }, [promotions, isAdminRoute])

  useEffect(() => {
    const onAuthSuccess = (event) => { authEventRef.current = event.detail?.type || 'login'; evaluate() }
    window.addEventListener('allay:auth-success', onAuthSuccess)
    return () => window.removeEventListener('allay:auth-success', onAuthSuccess)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function evaluate() {
    if (isAdminRoute || siteModeLoading || active || !promotions?.length || !visitContextRef.current) return
    const context = {
      pathname: location.pathname,
      isFirstVisit: visitContextRef.current.isFirstVisit,
      previousVisitAt: visitContextRef.current.previousVisitAt,
      isReloadNavigation: reloadRef.current,
      isSignedIn: isAuthenticated,
      justSignedUp: authEventRef.current === 'signup',
      justLoggedIn: authEventRef.current === 'login',
      delayElapsedIds,
    }
    const chosen = pickPromotion(promotions, context)
    authEventRef.current = null
    if (!chosen || isInterruptionUnsafe()) return
    recordImpression(chosen.id, chosen.campaignVersion)
    setActive(chosen)
  }

  useEffect(evaluate, [promotions, location.pathname, delayElapsedIds, siteModeLoading, isAdminRoute]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isAdminRoute || !active) return null

  const handleClose = () => {
    recordDismissal(active.id, active.campaignVersion, active.stopAfterDismissal)
    setActive(null)
  }

  return <PromotionModal promotion={active} onClose={handleClose} />
}
