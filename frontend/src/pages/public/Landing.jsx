import { ArrowRight, ChevronRight, Instagram as InstagramIcon, MapPin, Menu, Percent, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../../components/common/BrandLogo'
import Button from '../../components/common/Button'
import ImagePlaceholder from '../../components/common/ImagePlaceholder'
import TikTokIcon from '../../components/common/TikTokIcon'
import LandingHeroCarousel from '../../components/landing/LandingHeroCarousel'
import Seo from '../../components/common/Seo'
import { getCategoryImage } from '../../data/allayImages'
import serviceCategories from '../../data/serviceCategories'
import { siteSocialLinks } from '../../data/socialLinks'
import { useSiteMode } from '../../hooks/useSiteMode'
import { imagePaths } from '../../utils/imagePaths'

const LANDING_RETURN_STATE = { from: '/landing' }

// Presentational only — the hero text reel communicates the range of
// services without requiring a matching image for each one (there are only
// four approved hero images; see LandingHeroCarousel).
const LANDING_HERO_SERVICE_NAMES = [
  'Allay Spa',
  'Allay Pilates',
  'Allay Nail Studio',
  'Allay Lash Studio',
  'Allay Salon',
  'Facials',
  'Massage',
  'Sauna',
  'Headspa',
  'Hair Styling',
  'Braiding',
  'Premium Human Hair Wigs',
]

const experienceNotes = [
  'Thoughtful care across beauty, body, movement, and self-care rituals.',
  'A calm environment designed for unhurried appointments and polished details.',
  'One refined house where different services feel connected, not scattered.',
]

export default function Landing() {
  const { isLive } = useSiteMode()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const getStartedPath = isLive ? '/book' : '/'
  const getStartedLabel = isLive ? 'Book Now' : 'Get Started'
  const waitlistCategoryPath = (slug) => `/waitlist?category=${encodeURIComponent(slug)}`

  return <div className="landing-page">
    <Seo title="Allay House | Beauty, Wellness & Movement in Lagos" description="Allay House is opening in Lagos — a refined sanctuary for beauty, wellness, and movement. Join the waitlist for early access." path="/landing" />
    <header className="landing-header">
      <BrandLogo to="/landing" />
      <button className="landing-menu" type="button" onClick={() => setOpen((value) => !value)} aria-label="Toggle landing navigation" aria-controls="landing-navigation" aria-expanded={open}>{open ? <X /> : <Menu />}</button>
      <nav id="landing-navigation" className={open ? 'landing-nav landing-nav--open' : 'landing-nav'} aria-label="Landing navigation">
        <a href="#experience" onClick={close}>Experience</a>
        <a href="#services" onClick={close}>Services</a>
        <Link to="/waitlist" state={LANDING_RETURN_STATE} onClick={close}>Waitlist</Link>
        <Button to={getStartedPath} size="sm" onClick={close}>{getStartedLabel} <ArrowRight size={15} /></Button>
      </nav>
    </header>

    <main>
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero__visual">
          <LandingHeroCarousel serviceNames={LANDING_HERO_SERVICE_NAMES} />
          <div className="landing-hero__stamp" aria-hidden="true">
            <span className="landing-hero__stamp-percent">15%</span>
            <span className="landing-hero__stamp-copy">OFF<br />AT LAUNCH</span>
          </div>
        </div>
        <div className="landing-hero__content reveal">
          <span className="eyebrow">Allay House &middot; Launching soon</span>
          <h1 id="landing-title">Your Allay House experience is almost here.</h1>
          <p>Join the waitlist to receive first access to our launch, complete service details, final pricing, and an exclusive 15% discount code delivered to your email.</p>
          <div className="landing-offer" aria-label="Waitlist launch offer">
            <strong>Waitlist exclusive: 15% off your first booking.</strong>
            <span>Your launch code will be sent by email when bookings officially open.</span>
          </div>
          <div className="landing-actions">
            <Button to="/waitlist" state={LANDING_RETURN_STATE}>Join the Waitlist &amp; Unlock 15% Off <ArrowRight size={16} /></Button>
            <Link className="text-link" to={getStartedPath}>{getStartedLabel} <ChevronRight size={16} /></Link>
          </div>
        </div>
      </section>

      <section className="landing-intro" id="experience">
        <span className="eyebrow">Care, beautifully considered</span>
        <h2>Designed for the soft return to yourself.</h2>
        <p>Every visit should feel composed, personal, and easy to move through. Allay House gathers different forms of self-care under one brand so guests can plan a single treatment, a full ritual, or an ongoing rhythm of care without losing the calm.</p>
      </section>

      <section className="landing-services" id="services" aria-labelledby="landing-services-title">
        <div className="landing-section-heading">
          <div>
            <span className="eyebrow">Service areas</span>
            <h2 id="landing-services-title">Care with range and restraint.</h2>
          </div>
          <Link className="text-link" to="/services">Explore services <ArrowRight size={15} /></Link>
        </div>
        <div className="landing-service-list">
          {serviceCategories.map((category, index) => (
            <Link to={waitlistCategoryPath(category.slug)} state={LANDING_RETURN_STATE} className="landing-service-row" key={category.id}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{category.name}</strong>
              <p>{category.description}</p>
              <span className="landing-service-row__end">
                <span className="landing-service-row__badge"><Percent size={11} />15% off at launch</span>
                <ChevronRight size={18} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="landing-editorial" aria-label="Allay House atmosphere">
        <ImagePlaceholder src={imagePaths.about.interior} fallbackSrc={imagePaths.home.wellnessSection} alt="Warm interior details at Allay House" width="900" height="1100" />
        <div>
          <span className="eyebrow">A considered rhythm</span>
          <h2>The experience is quiet, polished, and personal.</h2>
          <div className="landing-notes">
            {experienceNotes.map((note) => <p key={note}><Sparkles size={15} />{note}</p>)}
          </div>
        </div>
      </section>

      <section className="landing-category-moment" aria-label="Allay House visual service preview">
        {serviceCategories.slice(0, 4).map((category) => (
          <article key={category.id}>
            <ImagePlaceholder src={getCategoryImage(category.slug)} fallbackSrc={imagePaths.categories.allServices} alt={`${category.name} at Allay House`} width="520" height="640" />
            <span>{category.name}</span>
          </article>
        ))}
      </section>

      <section className="landing-waitlist">
        <span className="eyebrow">Private waitlist</span>
        <h2>Be first to experience Allay House.</h2>
        <p>Our final service pricing is still being carefully prepared. Join the waitlist to receive complete launch details, final pricing, priority updates, and an exclusive 15% discount code when Allay House officially launches. Joining is free and does not book an appointment.</p>
        <div className="landing-actions landing-actions--center">
          <Button to="/waitlist" state={LANDING_RETURN_STATE}>Join the Waitlist &amp; Unlock 15% Off <ArrowRight size={16} /></Button>
          <Button to={getStartedPath} variant="outline">{getStartedLabel}</Button>
        </div>
      </section>
    </main>

    <footer className="landing-footer">
      <div className="landing-footer__top">
        <BrandLogo variant="white" to="/landing" />
        <nav aria-label="Landing footer navigation">
          <Link to="/services">Services</Link>
          <Link to="/about">Our house</Link>
          <Link to="/contact">Contact</Link>
          <a href="tel:+2347012119202">+234 701 211 9202</a>
        </nav>
        <div className="landing-footer__social">
          <a href={siteSocialLinks.instagram.url} target="_blank" rel="noopener noreferrer" aria-label={siteSocialLinks.instagram.accessibleLabel}><InstagramIcon size={16} /></a>
          <a href={siteSocialLinks.tiktok.url} target="_blank" rel="noopener noreferrer" aria-label={siteSocialLinks.tiktok.accessibleLabel}><TikTokIcon size={15} /></a>
          <a href={siteSocialLinks.googleMaps.url} target="_blank" rel="noopener noreferrer" aria-label={siteSocialLinks.googleMaps.accessibleLabel}><MapPin size={16} /></a>
        </div>
      </div>
      <div className="landing-footer__bottom">
        <span className="landing-footer__address">14 Babatunde Kuboye street, Lekki Phase 1, Lagos state, Nigeria</span>
        <small>&copy; 2026 Allay House. <Link to="/privacy-policy">Privacy Policy</Link> / <Link to="/terms-of-use">Terms of Use</Link></small>
      </div>
    </footer>
  </div>
}
