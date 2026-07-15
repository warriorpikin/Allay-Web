import { usePrefersReducedMotion, useSlideshow } from '../../hooks/useSlideshow'
import { imagePaths } from '../../utils/imagePaths'
import ImagePlaceholder from '../common/ImagePlaceholder'
import LandingServiceReel from './LandingServiceReel'

const AUTOPLAY_INTERVAL_MS = 5500

// Only the four already-approved, already-uploaded hero images: the main
// site's Home, About, and Contact hero photography plus the All Services
// category image. Individual per-category images (spa, pilates, nails, ...)
// are deliberately not used here — service range is communicated by
// LandingServiceReel instead. See imagePaths.js for the source of truth.
const heroImages = [
  { key: 'home', src: imagePaths.home.heroMain, alt: 'Allay House' },
  { key: 'about', src: imagePaths.about.hero, alt: 'Inside Allay House' },
  { key: 'contact', src: imagePaths.contact.hero, alt: 'A warm Allay House welcome' },
  { key: 'all-services', src: imagePaths.categories.allServices, alt: 'The full range of Allay House services' },
]

export default function LandingHeroCarousel({ serviceNames }) {
  const count = heroImages.length
  const reducedMotion = usePrefersReducedMotion()
  const { index, goTo, onMouseEnter, onMouseLeave, onFocus, onBlur, touchHandlers, handleKeyDown } = useSlideshow({
    count,
    autoplayMs: AUTOPLAY_INTERVAL_MS,
    resumeAfterInteraction: true,
  })

  return <div
    className="landing-hero-carousel"
    role="group"
    aria-roledescription="carousel"
    aria-label="Allay House"
    tabIndex={0}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    onFocus={onFocus}
    onBlur={onBlur}
    onKeyDown={handleKeyDown}
    {...touchHandlers}
  >
    {heroImages.map((image, slideIndex) => (
      <div key={image.key} className={`landing-hero-carousel__slide ${slideIndex === index ? 'is-active' : ''} ${reducedMotion ? 'is-instant' : ''}`} aria-hidden={slideIndex !== index}>
        <ImagePlaceholder
          src={image.src}
          alt={image.alt}
          loading={slideIndex === 0 ? 'eager' : 'lazy'}
          fetchPriority={slideIndex === 0 ? 'high' : undefined}
          width="1600"
          height="2000"
        />
      </div>
    ))}

    <div className="landing-hero-carousel__caption">
      <div className="landing-hero-carousel__reel-wrap">
        <span className="landing-hero-carousel__reel-eyebrow">Now welcoming</span>
        <LandingServiceReel items={serviceNames} />
      </div>

      {count > 1 && <div className="landing-hero-carousel__dots" role="tablist" aria-label="Hero images">
        {heroImages.map((image, slideIndex) => (
          <button
            key={image.key}
            type="button"
            role="tab"
            aria-selected={slideIndex === index}
            aria-label={`Show image ${slideIndex + 1} of ${count}`}
            className={`landing-hero-carousel__dot ${slideIndex === index ? 'is-active' : ''}`}
            onClick={() => goTo(slideIndex)}
          />
        ))}
      </div>}
    </div>
  </div>
}
