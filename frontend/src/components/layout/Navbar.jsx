import { ArrowRight, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import Brand from '../common/Brand'
import Button from '../common/Button'
import { publicNavigationLinks } from '../../data/navigationLinks'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return <header className="site-header">
    <Brand />
    <button className="menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={open}>{open ? <X /> : <Menu />}</button>
    <nav className={open ? 'nav nav--open' : 'nav'} aria-label="Main navigation">
      {publicNavigationLinks.map((link) => <NavLink key={link.to} onClick={close} to={link.to} end={link.to === '/'}>{link.label}</NavLink>)}
      <Button to="/book" size="sm" onClick={close}>Book appointment <ArrowRight size={16} /></Button>
    </nav>
  </header>
}

