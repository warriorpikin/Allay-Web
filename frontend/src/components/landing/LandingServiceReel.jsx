import { useEffect, useMemo, useState } from 'react'
import { usePrefersReducedMotion } from '../../hooks/useSlideshow'

const ROTATE_INTERVAL_MS = 2600
const ROTATE_TRANSITION_MS = 650
const ITEM_HEIGHT_EM = 1.3

// A continuously looping vertical text reel, independent of the hero image
// timer. Renders items + a duplicate of the first item so the loop can wrap
// from last back to first without a visible backwards jump: once the
// duplicate slide finishes animating in, we snap (no transition) back to the
// real first slide.
export default function LandingServiceReel({ items }) {
  const reducedMotion = usePrefersReducedMotion()
  const extended = useMemo(() => [...items, items[0]], [items])
  const [index, setIndex] = useState(0)
  const [instant, setInstant] = useState(false)

  useEffect(() => {
    if (reducedMotion) return undefined
    const timer = setInterval(() => setIndex((current) => current + 1), ROTATE_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [reducedMotion])

  useEffect(() => {
    if (reducedMotion || index !== extended.length - 1) return undefined
    const timeout = setTimeout(() => { setInstant(true); setIndex(0) }, ROTATE_TRANSITION_MS)
    return () => clearTimeout(timeout)
  }, [index, extended.length, reducedMotion])

  useEffect(() => {
    if (!instant) return undefined
    const raf = requestAnimationFrame(() => setInstant(false))
    return () => cancelAnimationFrame(raf)
  }, [instant])

  const trackItems = reducedMotion ? [items[0]] : extended
  const trackIndex = reducedMotion ? 0 : index

  return <div className="landing-hero-reel">
    <div className="landing-hero-reel__viewport">
      <div
        className="landing-hero-reel__track"
        aria-hidden="true"
        style={{ transform: `translateY(-${trackIndex * ITEM_HEIGHT_EM}em)`, transition: instant ? 'none' : undefined }}
      >
        {trackItems.map((label, i) => <span className="landing-hero-reel__item" key={`${label}-${i}`}>{label}</span>)}
      </div>
    </div>
    <span className="sr-only">{items.join(', ')}</span>
  </div>
}
