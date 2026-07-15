import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { getCategoryImage } from '../../data/allayImages'
import { useSlideshow } from '../../hooks/useSlideshow'
import ImagePlaceholder from '../common/ImagePlaceholder'

const AUTOPLAY_INTERVAL_MS = 6000
const DRAG_CLICK_GUARD_PX = 10

// Shortest signed distance from `index` to `activeIndex` on a circular track,
// e.g. for 5 slides, index 0 relative to active 4 is +1 (wraps forward), not -4.
function relativeOffset(index, activeIndex, count) {
  let diff = index - activeIndex
  if (diff > count / 2) diff -= count
  else if (diff < -count / 2) diff += count
  return diff
}

// A physical card-deck stack: the active card sits dead centre, each tier out
// shifts further, shrinks, drops slightly, and rotates a little more — values
// picked so that even the +/-2 tier stays inside the right-hand carousel
// column at 1024px+ (verified against measured DOM bounds, not just by eye).
function stackPosition(diff) {
  if (diff === 0) return { x: '0%', y: '0%', scale: 1, rotate: 0, zIndex: 5, opacity: 1 }
  if (diff === -1) return { x: '-15%', y: '5%', scale: 0.92, rotate: -2.5, zIndex: 4, opacity: 1 }
  if (diff === 1) return { x: '15%', y: '5%', scale: 0.92, rotate: 2.5, zIndex: 4, opacity: 1 }
  if (diff === -2) return { x: '-23%', y: '9%', scale: 0.85, rotate: -4.5, zIndex: 2, opacity: 0.9 }
  if (diff === 2) return { x: '23%', y: '9%', scale: 0.85, rotate: 4.5, zIndex: 2, opacity: 0.9 }
  return { x: diff < 0 ? '-40%' : '40%', y: '12%', scale: 0.7, rotate: 0, zIndex: 1, opacity: 0 }
}

function slideHref(slide, isLive) {
  const primaryService = slide.services?.[0]
  return isLive ? `/book?service=${primaryService?.slug || ''}` : `/waitlist?category=${slide.slug}`
}

export default function ServiceHeroCarousel({ slides, isLive }) {
  const count = slides.length
  const { index, goPrev, goNext, goTo, onMouseEnter, onMouseLeave, onFocus, onBlur, touchHandlers, handleKeyDown, reducedMotion } = useSlideshow({
    count,
    autoplayMs: AUTOPLAY_INTERVAL_MS,
    resumeAfterInteraction: true,
  })
  const dragDistanceRef = useRef(0)
  const touchStartXRef = useRef(null)

  if (!count) return null

  const handleCardClick = (event) => {
    if (dragDistanceRef.current > DRAG_CLICK_GUARD_PX) event.preventDefault()
  }

  const stageTouchHandlers = {
    onTouchStart: (event) => {
      dragDistanceRef.current = 0
      touchStartXRef.current = event.touches[0].clientX
      touchHandlers.onTouchStart(event)
    },
    onTouchMove: (event) => {
      if (touchStartXRef.current != null) dragDistanceRef.current = Math.abs(event.touches[0].clientX - touchStartXRef.current)
    },
    onTouchEnd: touchHandlers.onTouchEnd,
  }

  return <div
    className="hero-stack"
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    onFocus={onFocus}
    onBlur={onBlur}
    onKeyDown={handleKeyDown}
    role="group"
    aria-roledescription="carousel"
    aria-label="Allay House services"
    tabIndex={0}
  >
    <div className="hero-stack__track" {...stageTouchHandlers}>
      {slides.map((slide, slideIndex) => {
        const diff = relativeOffset(slideIndex, index, count)
        const isActive = diff === 0
        const isNeighbour = !isActive && Math.abs(diff) <= 2
        const position = stackPosition(diff)
        const Icon = slide.icon
        const image = <ImagePlaceholder
          src={getCategoryImage(slide.slug)}
          alt={`${slide.name} at Allay House`}
          variant="rounded"
          width="640"
          height="800"
          loading={isActive ? 'eager' : 'lazy'}
          fetchPriority={isActive ? 'high' : undefined}
        />

        return <motion.div
          key={slide.slug}
          className={`hero-stack__card ${isActive ? 'is-active' : ''}`}
          style={{ zIndex: position.zIndex, pointerEvents: isActive || isNeighbour ? 'auto' : 'none' }}
          animate={{ x: position.x, y: position.y, scale: position.scale, rotate: position.rotate, opacity: position.opacity }}
          transition={{ duration: reducedMotion ? 0 : 0.6, ease: [0.22, 0.68, 0, 1] }}
        >
          {isActive ? (
            <Link to={slideHref(slide, isLive)} className="hero-stack__link" onClick={handleCardClick} aria-label={`${slide.name}: ${slide.note || 'view treatments'}. ${isLive ? 'Book now' : 'Join the waitlist'}.`}>
              {image}
              <div className="hero-stack__overlay">
                {Icon && <span className="hero-stack__badge" aria-hidden="true"><Icon size={16} /></span>}
                <div className="hero-stack__overlay-text">
                  <h2>{slide.name}</h2>
                  {slide.note && <p>{slide.note}</p>}
                </div>
              </div>
            </Link>
          ) : isNeighbour ? (
            <button type="button" className="hero-stack__link hero-stack__link--neighbour" onClick={() => goTo(slideIndex)} aria-label={`Show ${slide.name}`}>
              {image}
            </button>
          ) : (
            <div className="hero-stack__link" aria-hidden="true">{image}</div>
          )}
        </motion.div>
      })}
      {count > 1 && <>
        <button type="button" className="hero-stack__nav hero-stack__nav--prev" onClick={goPrev} aria-label="Previous service"><ChevronLeft size={20} /></button>
        <button type="button" className="hero-stack__nav hero-stack__nav--next" onClick={goNext} aria-label="Next service"><ChevronRight size={20} /></button>
      </>}
    </div>
    {count > 1 && <div className="hero-stack__pagination" role="tablist" aria-label="Services">
      {slides.map((slide, slideIndex) => <button
        key={slide.slug}
        type="button"
        role="tab"
        aria-selected={slideIndex === index}
        aria-label={`Show ${slide.name}`}
        className={`hero-stack__dot ${slideIndex === index ? 'is-active' : ''}`}
        onClick={() => goTo(slideIndex)}
      />)}
    </div>}
  </div>
}
