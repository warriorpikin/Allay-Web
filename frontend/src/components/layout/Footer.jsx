import { ArrowRight, Instagram } from 'lucide-react'
import { Link } from 'react-router-dom'
import Brand from '../common/Brand'

export default function Footer() {
  return <footer className="footer">
    <div className="footer__brand"><Brand light /><p>A refined sanctuary for beauty,<br />wellness, and movement.</p></div>
    <div><span className="eyebrow eyebrow--light">Explore</span><Link to="/services">Services</Link><Link to="/about">Our house</Link><Link to="/contact">Contact</Link></div>
    <div><span className="eyebrow eyebrow--light">The house</span><p>Allay Spa<br />Allay Pilates<br />Nail, Lash & Salon</p></div>
    <div><span className="eyebrow eyebrow--light">Visit</span><p>Address coming soon<br />Lagos, Nigeria<br />+234 000 000 0000</p></div>
    <div><span className="eyebrow eyebrow--light">Stay close</span><Link to="/waitlist">Private waitlist <ArrowRight size={15} /></Link><a href="https://instagram.com" aria-label="Instagram"><Instagram size={15} /> Instagram</a></div>
    <small className="footer__legal">© 2026 Allay House. Considered care for the whole self.</small>
  </footer>
}

