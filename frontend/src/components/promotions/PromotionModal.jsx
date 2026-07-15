import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCategoryImage } from '../../data/allayImages'
import { useSlideshow } from '../../hooks/useSlideshow'
import { useSiteMode } from '../../hooks/useSiteMode'
import { resolveCtaHref } from '../../utils/promotionEngine'
import ImagePlaceholder from '../common/ImagePlaceholder'

function resolveImageSrc(image) {
  if (!image) return ''
  return image.type === 'category' ? getCategoryImage(image.categorySlug) : image.url
}

function PromotionImages({ promotion }) {
  const images = promotion.images?.length ? promotion.images : [{ type: 'category', categorySlug: 'all' }]
  const { index, goPrev, goNext, goTo, onMouseEnter, onMouseLeave, touchHandlers, reducedMotion } = useSlideshow({
    count: images.length,
    autoplayMs: promotion.autoplayImages ? promotion.slideIntervalMs : 0,
  })
  const active = images[index] || images[0]

  return <div className="promotion-modal__media" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} {...touchHandlers}>
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={index}
        className="promotion-modal__frame"
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.4 }}
      >
        <ImagePlaceholder src={resolveImageSrc(active)} alt={active.alt || promotion.heading} variant="rounded" width="640" height="640" />
      </motion.div>
    </AnimatePresence>
    {images.length > 1 && <>
      <button type="button" className="promotion-modal__nav promotion-modal__nav--prev" onClick={goPrev} aria-label="Previous image">‹</button>
      <button type="button" className="promotion-modal__nav promotion-modal__nav--next" onClick={goNext} aria-label="Next image">›</button>
      <div className="promotion-modal__pagination" role="tablist" aria-label="Promotion images">
        {images.map((_, imageIndex) => <button
          key={imageIndex}
          type="button"
          role="tab"
          aria-selected={imageIndex === index}
          aria-label={`Show image ${imageIndex + 1}`}
          className={`promotion-modal__dot ${imageIndex === index ? 'is-active' : ''}`}
          onClick={() => goTo(imageIndex)}
        />)}
      </div>
    </>}
  </div>
}

export default function PromotionModal({ promotion, onClose, onCtaClick, previewOnly = false }) {
  const dialogRef = useRef(null)
  const navigate = useNavigate()
  const { isLive } = useSiteMode()

  useEffect(() => {
    const previouslyFocused = document.activeElement
    dialogRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && promotion.isDismissible) { onClose(); return }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = dialogRef.current.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      if (!previewOnly) previouslyFocused?.focus?.()
    }
  }, [promotion.isDismissible, onClose, previewOnly])

  const runCta = (action, target, isSecondary) => {
    if (previewOnly) return
    onCtaClick?.(action, target)
    if (action === 'close' || action === 'none') { onClose(); return }
    const href = resolveCtaHref(action, target, { isLive })
    if (!href) { onClose(); return }
    if (action === 'external_url') { window.open(href, '_blank', 'noopener,noreferrer'); return }
    onClose()
    navigate(href)
    void isSecondary
  }

  const showPrimaryCta = promotion.ctaAction !== 'none' && promotion.ctaText
  const showSecondaryCta = promotion.secondaryCtaAction !== 'none' && promotion.secondaryCtaText

  return <div className="promotion-modal-backdrop" onMouseDown={promotion.isDismissible && !previewOnly ? onClose : undefined}>
    <section
      className="promotion-modal"
      role="dialog"
      aria-modal="true"
      aria-label={promotion.heading}
      ref={dialogRef}
      tabIndex={-1}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {promotion.isDismissible && <button type="button" className="promotion-modal__close" onClick={onClose} aria-label="Close promotion">
        <X size={18} />
      </button>}
      <PromotionImages promotion={promotion} />
      <div className="promotion-modal__body">
        {promotion.eyebrowText && <span className="promotion-modal__eyebrow">{promotion.eyebrowText}</span>}
        <h2>{promotion.heading}</h2>
        {promotion.message && <p>{promotion.message}</p>}
        <div className="promotion-modal__actions">
          {showPrimaryCta && <button type="button" className="button button--primary button--md" onClick={() => runCta(promotion.ctaAction, promotion.ctaTarget, false)}>{promotion.ctaText}</button>}
          {showSecondaryCta && <button type="button" className="button button--ghost button--md" onClick={() => runCta(promotion.secondaryCtaAction, promotion.secondaryCtaTarget, true)}>{promotion.secondaryCtaText}</button>}
        </div>
      </div>
    </section>
  </div>
}
