import { ArrowRight, Instagram, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import Logo from '../common/Logo'
import TikTokIcon from '../common/TikTokIcon'
import { siteSocialLinks } from '../../data/socialLinks'

export default function Footer() {
  return <footer className="footer">
    <div className="footer__brand"><Logo dark /><p>A refined sanctuary for beauty<br />and wellness.</p></div>
    <div><span className="eyebrow eyebrow--light">Explore</span><Link to="/services">Services</Link><Link to="/about">Our house</Link><Link to="/contact">Contact</Link></div>
    <div><span className="eyebrow eyebrow--light">The house</span><p>Allay Spa<br />Allay Pilates<br />Nail, Lash & Salon</p></div>
    <div><span className="eyebrow eyebrow--light">Visit</span><p>14 Babatunde Kuboye street<br />Lekki Phase 1, Lagos state, Nigeria</p></div>

    <div><span className="eyebrow eyebrow--light">Contact</span><a href="tel:+2347012119202" aria-label="Phone"> +234 701 211 9202 </a></div>

    <div className="footer__social">
      <span className="eyebrow eyebrow--light">Stay close</span>
      <a href={siteSocialLinks.instagram.url} target="_blank" rel="noopener noreferrer" aria-label={siteSocialLinks.instagram.accessibleLabel}><Instagram size={15} /> Instagram <ArrowRight size={15} /></a>
      <a href={siteSocialLinks.tiktok.url} target="_blank" rel="noopener noreferrer" aria-label={siteSocialLinks.tiktok.accessibleLabel}><TikTokIcon size={15} /> TikTok <ArrowRight size={15} /></a>
      <a href={siteSocialLinks.googleMaps.url} target="_blank" rel="noopener noreferrer" aria-label={siteSocialLinks.googleMaps.accessibleLabel}><MapPin size={15} /> Google Maps <ArrowRight size={15} /></a>
    </div>
    <small className="footer__legal">&copy; 2026 Allay House. <Link to="/privacy-policy">Privacy Policy</Link> / <Link to="/terms-of-use">Terms of Use</Link></small>
  </footer>
}
