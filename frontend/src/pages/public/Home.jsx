import { ArrowRight, CalendarDays, Clock3, RefreshCcw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ServiceHeroCarousel from '../../components/home/ServiceHeroCarousel'
import Button from '../../components/common/Button'
import ImagePlaceholder from '../../components/common/ImagePlaceholder'
import SectionHeader from '../../components/common/SectionHeader'
import Seo from '../../components/common/Seo'
import StarRating from '../../components/common/StarRating'
import { getCategoryImage } from '../../data/allayImages'
import { buildDivisionSlides } from '../../data/serviceDivisions'
import { useSiteMode } from '../../hooks/useSiteMode'
import { getServices, getTestimonials } from '../../services/servicesApi'
import { imagePaths } from '../../utils/imagePaths'
import { buildLocalBusinessJsonLd } from '../../utils/structuredData'

// The "Explore the House" grid duplicated the same category imagery and CTAs
// now shown in the hero carousel above it. Disabled, not deleted — its
// markup and data wiring are preserved below (search SHOW_LEGACY_EXPLORE_HOUSE_SECTION)
// in case a future redesign wants to reuse it.
const SHOW_LEGACY_EXPLORE_HOUSE_SECTION = false

const fallbackTestimonials = [
  { name: 'Amara N.', rating: 5, text: 'Allay House feels calm from the first moment. The care is thoughtful, polished, and deeply restorative.' },
  { name: 'Tomi A.', rating: 5, text: 'The service felt premium without feeling intimidating. I left lighter, softer, and already planning my next visit.' },
  { name: 'Kemi O.', rating: 5, text: 'Every detail felt intentional, from the welcome to the final finish. It is exactly the kind of beauty space Lagos needs.' },
]

function TestimonialAvatar({ item }) {
  const [failed, setFailed] = useState(false)
  const initial = item.name?.slice(0, 1) || 'A'
  return <div className="testimonial-card__avatar" aria-hidden="true">
    {item.image && !failed ? <img src={item.image} alt="" onError={() => setFailed(true)} /> : initial}
  </div>
}

// Matches the hero-stack visual column's footprint exactly, with no legacy
// copy or CTAs, so nothing resembling the old hero is ever visible while
// services load. The left text column is static (never loading-gated), so it
// carries no flash risk and is rendered unconditionally in the hero markup.
function HeroSkeleton() {
  return <div className="hero-stack hero-stack--skeleton" aria-hidden="true">
    <div className="hero-stack__track">
      <div className="hero-stack__skeleton-card hero-stack__skeleton-card--side hero-stack__skeleton-card--left" />
      <div className="hero-stack__skeleton-card hero-stack__skeleton-card--active" />
      <div className="hero-stack__skeleton-card hero-stack__skeleton-card--side hero-stack__skeleton-card--right" />
    </div>
  </div>
}

function HeroEmpty() {
  return <div className="hero-stack hero-stack--message">
    <p>Allay House — considered treatments and everyday rituals under one calm roof.</p>
  </div>
}

function HeroError({ onRetry }) {
  return <div className="hero-stack hero-stack--message">
    <p>We couldn&apos;t load services just now.</p>
    <Button type="button" variant="outline" onClick={onRetry}><RefreshCcw size={15} /> Retry</Button>
  </div>
}

// Module-level (not component state) so it survives a Home unmount/remount —
// e.g. visiting About then coming back to "/". Without this, every return
// visit re-ran the full loading skeleton even though we already had good
// data a second ago, which read as the page "reloading" itself.
let cachedServices = null
let cachedTestimonials = null

export default function Home() {
  const { isLive } = useSiteMode()
  const [testimonials, setTestimonials] = useState(cachedTestimonials || fallbackTestimonials)
  const [services, setServices] = useState(cachedServices || [])
  const [servicesState, setServicesState] = useState(cachedServices ? 'loaded' : 'loading')

  useEffect(() => {
    getTestimonials()
      .then((data) => {
        const nextTestimonials = (data.testimonials || []).map((item) => ({
          id: item.id,
          name: item.customerName,
          rating: item.rating,
          text: item.testimonialText,
          image: item.profileImageUrl,
        }))
        if (nextTestimonials.length) { cachedTestimonials = nextTestimonials; setTestimonials(nextTestimonials) }
      })
      .catch(() => {})
  }, [])

  const loadServices = useCallback(() => {
    // Only show the skeleton when we have nothing to fall back on. A repeat
    // visit or a background refresh keeps showing the last-good carousel
    // while the new request is in flight.
    if (!cachedServices) setServicesState('loading')
    getServices()
      .then((data) => {
        const nextServices = data.services || []
        cachedServices = nextServices
        setServices(nextServices)
        setServicesState('loaded')
      })
      .catch(() => {
        // A failed background refresh should not blank out a hero that was
        // already showing real data — only surface the retry panel when we
        // truly have nothing to display.
        if (!cachedServices) setServicesState('error')
      })
  }, [])

  useEffect(() => { loadServices() }, [loadServices])

  const divisionSlides = useMemo(() => buildDivisionSlides(services), [services])

  return <>
    <Seo
      title="Allay House | Beauty, Wellness & Movement in Lagos"
      description="Allay House is a refined sanctuary for beauty, wellness, and movement in Lagos, Nigeria — head spa, massage, hammam, facials, nails, lashes, waxing, and reformer Pilates."
      path="/"
      jsonLd={buildLocalBusinessJsonLd()}
    />
    <section className="home-hero">
      <div className="home-hero__content reveal">
        <span className="eyebrow">Beauty / Wellness</span>
        <h1>A softer place to<br />return to yourself.</h1>
        <p>Welcome to Allay House — considered treatments and everyday rituals under one calm roof.</p>
        <div className="hero__actions">
          <Button to={isLive ? '/book' : '/waitlist'}>{isLive ? 'Book now' : 'Join the waitlist'} <ArrowRight size={17} /></Button>
        </div>
      </div>
      <div className="home-hero__visual">
        {servicesState === 'loading' && <HeroSkeleton />}
        {servicesState === 'error' && <HeroError onRetry={loadServices} />}
        {servicesState === 'loaded' && (divisionSlides.length
          ? <ServiceHeroCarousel slides={divisionSlides} isLive={isLive} />
          : <HeroEmpty />)}
      </div>
    </section>

    {SHOW_LEGACY_EXPLORE_HOUSE_SECTION && <section className="divisions section">
      <div className="section-heading">
        <SectionHeader eyebrow="Explore the house" title="Care, in every form." />
      </div>
      <div className="division-grid">
        {divisionSlides.map(({ name, note, tone, slug, icon: Icon }, index) => (
          <Link to={`/services?category=${slug}`} className={`division-card division-card--${tone}`} style={{ '--card-image': `url(${getCategoryImage(slug)})` }} key={slug}>
            <span>0{index + 1}</span>
            <Icon size={27} strokeWidth={1.2} />
            <div><h3>{name}</h3><p>{note}</p></div>
            <ArrowRight className="division-card__arrow" size={18} />
          </Link>
        ))}
      </div>
    </section>}

    <section className="manifesto section">
      <SectionHeader
        eyebrow="Welcome to Allay House"
        title={<>Everything you need to feel<br /><em>beautifully restored.</em></>}
        subtitle="From skin and body rituals to thoughtful movement and finishing touches, every Allay experience is designed to soften the pace of your day."
        centered
      />
    </section>

    <section className="ritual section">
      <div className="ritual__arch"><ImagePlaceholder src={imagePaths.home.wellnessSection} fallbackSrc={imagePaths.placeholders.hero} alt="A calm treatment setting" variant="arch" width="760" height="1000" /></div>
      <div className="ritual__copy"><SectionHeader eyebrow="Your time, held gently" title="Make a ritual of feeling well." subtitle="We believe care works best when it feels unhurried. Choose a treatment, find a time that suits you, and let us take care of the rest." /><Button to="/about" variant="outline">Discover Allay House <ArrowRight size={16} /></Button></div>
    </section>

    <section className="testimonials section">
      <SectionHeader eyebrow="Client notes" title="Soft words from the house." centered />
      <div className="testimonial-grid">
        {testimonials.map((item) => (
          <article className="testimonial-card" key={item.id || item.name}>
            <TestimonialAvatar item={item} />
            <StarRating rating={item.rating} className="testimonial-card__rating" />
            <p>{item.text}</p>
            <strong>{item.name}</strong>
          </article>
        ))}
      </div>
    </section>

    <section className="visit section">
      <div><span className="eyebrow eyebrow--light">Plan your visit</span><h2>Your pause is waiting.</h2></div>
      <div className="visit__detail"><Clock3 /><p><strong>Monday-Saturday</strong><br />9:00am-7:00pm</p></div>
      <div className="visit__detail"><CalendarDays /><p>{isLive ? <><strong>Book online</strong><br />Choose a time that suits you.</> : <><strong>Private access</strong><br />Join for considered launch offers.</>}</p></div>
      {isLive ? <Button to="/book" variant="light">Book an appointment <ArrowRight size={16} /></Button> : <Button to="/waitlist" variant="light">Join the waitlist <ArrowRight size={16} /></Button>}
    </section>
  </>
}
