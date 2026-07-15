import { getCategoryImage } from '../../data/allayImages'
import { useSlideshow } from '../../hooks/useSlideshow'
import ImagePlaceholder from '../common/ImagePlaceholder'

const AUTOPLAY_INTERVAL_MS = 5000

export default function LandingHeroCarousel({ categories }) {
  const count = categories.length
  const { index, goTo, onMouseEnter, onMouseLeave, onFocus, onBlur, touchHandlers, handleKeyDown, reducedMotion } = useSlideshow({
    count,
    autoplayMs: AUTOPLAY_INTERVAL_MS,
    resumeAfterInteraction: true,
  })

  if (!count) return null
  const active = categories[index]

  return <div
    className="landing-hero-carousel"
    role="group"
    aria-roledescription="carousel"
    aria-label="Allay House service categories"
    tabIndex={0}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    onFocus={onFocus}
    onBlur={onBlur}
    onKeyDown={handleKeyDown}
    {...touchHandlers}
  >
    {categories.map((category, slideIndex) => (
      <div key={category.slug} className={`landing-hero-carousel__slide ${slideIndex === index ? 'is-active' : ''} ${reducedMotion ? 'is-instant' : ''}`} aria-hidden={slideIndex !== index}>
        <ImagePlaceholder
          src={getCategoryImage(category.slug)}
          alt={`${category.name} at Allay House`}
          loading={slideIndex === 0 ? 'eager' : 'lazy'}
          fetchPriority={slideIndex === 0 ? 'high' : undefined}
          width="1200"
          height="1500"
        />
      </div>
    ))}

    <div className="landing-hero-carousel__caption">
      <div className="landing-hero-carousel__label" key={active.slug}>
        <span>{active.name}</span>
      </div>

      {count > 1 && <div className="landing-hero-carousel__dots" role="tablist" aria-label="Service categories">
        {categories.map((category, slideIndex) => (
          <button
            key={category.slug}
            type="button"
            role="tab"
            aria-selected={slideIndex === index}
            aria-label={`Show ${category.name}`}
            className={`landing-hero-carousel__dot ${slideIndex === index ? 'is-active' : ''}`}
            onClick={() => goTo(slideIndex)}
          />
        ))}
      </div>}
    </div>
  </div>
}
