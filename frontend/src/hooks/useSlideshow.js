import { useEffect, useRef, useState } from 'react'

const SWIPE_THRESHOLD_PX = 45

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  return reduced
}

// Shared index/autoplay/swipe/keyboard state for any prev-next-and-dots
// slideshow (the homepage hero stack and the promotion image carousel).
//
// Two autoplay policies, chosen per caller:
// - resumeAfterInteraction: false (default, used by the promotion modal) —
//   autoplay permanently stops after the first manual interaction.
// - resumeAfterInteraction: true (used by the homepage hero) — autoplay
//   keeps running indefinitely, just restarts its countdown after each
//   manual navigation so it never fights the visitor mid-browse.
// Either way, autoplay also pauses on hover, on keyboard focus inside the
// carousel, while a touch is in progress, when the tab is hidden, or when
// reduced motion is requested.
export function useSlideshow({ count, autoplayMs = 0, enabled = true, resumeAfterInteraction = false }) {
  const [index, setIndex] = useState(0)
  const [interacted, setInteracted] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [suspended, setSuspended] = useState(false)
  const [tabHidden, setTabHidden] = useState(() => typeof document !== 'undefined' && document.hidden)
  const [autoplayTick, setAutoplayTick] = useState(0)
  const reducedMotion = usePrefersReducedMotion()
  const touchStartX = useRef(null)

  useEffect(() => { if (count > 0 && index > count - 1) setIndex(0) }, [count, index])

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const autoplayBlocked = resumeAfterInteraction ? false : interacted
  const autoplayActive = enabled && autoplayMs > 0 && !hovered && !focused && !suspended && !tabHidden && !reducedMotion && !autoplayBlocked && count > 1

  useEffect(() => {
    if (!autoplayActive) return undefined
    const timer = setInterval(() => setIndex((current) => (current + 1) % count), autoplayMs)
    return () => clearInterval(timer)
  }, [autoplayActive, autoplayMs, count, autoplayTick])

  const goTo = (next) => {
    setInteracted(true)
    if (resumeAfterInteraction) setAutoplayTick((tick) => tick + 1)
    setIndex(count > 0 ? ((next % count) + count) % count : 0)
  }
  const goPrev = () => goTo(index - 1)
  const goNext = () => goTo(index + 1)

  const touchHandlers = {
    onTouchStart: (event) => { touchStartX.current = event.touches[0].clientX; setSuspended(true) },
    onTouchEnd: (event) => {
      setSuspended(false)
      if (touchStartX.current == null) return
      const delta = event.changedTouches[0].clientX - touchStartX.current
      touchStartX.current = null
      if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return
      if (delta > 0) goPrev()
      else goNext()
    },
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); goPrev() }
    else if (event.key === 'ArrowRight') { event.preventDefault(); goNext() }
  }

  return {
    index,
    goTo,
    goPrev,
    goNext,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setFocused(true),
    onBlur: (event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) },
    touchHandlers,
    handleKeyDown,
    reducedMotion,
  }
}
