import { ArrowRight, ChevronRight, Menu, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../../components/common/BrandLogo'
import Button from '../../components/common/Button'
import ImagePlaceholder from '../../components/common/ImagePlaceholder'
import { getCategoryImage } from '../../data/allayImages'
import serviceCategories from '../../data/serviceCategories'
import { imagePaths } from '../../utils/imagePaths'

const experienceNotes = [
  'Thoughtful care across beauty, body, movement, and self-care rituals.',
  'A calm environment designed for unhurried appointments and polished details.',
  'One refined house where different services feel connected, not scattered.',
]

export default function Landing() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return <div className="landing-page">
    <header className="landing-header">
      <BrandLogo to="/landing" />
      <button className="landing-menu" type="button" onClick={() => setOpen((value) => !value)} aria-label="Toggle landing navigation" aria-expanded={open}>{open ? <X /> : <Menu />}</button>
      <nav className={open ? 'landing-nav landing-nav--open' : 'landing-nav'} aria-label="Landing navigation">
        <a href="#experience" onClick={close}>Experience</a>
        <a href="#services" onClick={close}>Services</a>
        <Link to="/waitlist" onClick={close}>Waitlist</Link>
        <Button to="/services" size="sm" onClick={close}>Get Started <ArrowRight size={15} /></Button>
      </nav>
    </header>

    <main>
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero__image">
          <ImagePlaceholder src={imagePaths.home.heroMain} fallbackSrc={imagePaths.home.wellnessSection} alt="Serene Allay House treatment room" loading="eager" fetchPriority="high" width="1400" height="980" />
        </div>
        <div className="landing-hero__content reveal">
          <span className="eyebrow">Allay House</span>
          <h1 id="landing-title">Wellness, beauty and restoration under one house.</h1>
          <p>Allay House brings spa rituals, movement, skin, hair, nails, lashes, and body care into one warm, refined experience for people who want their care to feel considered from start to finish.</p>
          <div className="landing-actions">
            <Button to="/waitlist">Join Waitlist <ArrowRight size={16} /></Button>
            <Link className="text-link" to="/services">Get Started <ChevronRight size={16} /></Link>
          </div>
        </div>
      </section>

      <section className="landing-intro" id="experience">
        <span className="eyebrow">The house of Allay</span>
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
            <Link to={`/services?category=${category.slug}`} className="landing-service-row" key={category.id}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{category.name}</strong>
              <p>{category.description}</p>
              <ChevronRight size={18} />
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
        <h2>Stay close to the house.</h2>
        <p>Join the existing Allay House waitlist for launch access, service updates, and considered offers. This does not book an appointment; it simply keeps you first in line.</p>
        <div className="landing-actions landing-actions--center">
          <Button to="/waitlist">Join Waitlist <ArrowRight size={16} /></Button>
          <Button to="/services" variant="outline">Get Started</Button>
        </div>
      </section>
    </main>

    <footer className="landing-footer">
      <BrandLogo variant="white" to="/landing" />
      <nav aria-label="Landing footer navigation">
        <Link to="/services">Services</Link>
        <Link to="/about">Our house</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/privacy-policy">Privacy</Link>
      </nav>
      <small>&copy; 2026 Allay House.</small>
    </footer>
  </div>
}
