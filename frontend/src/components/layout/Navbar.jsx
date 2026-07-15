import { ArrowRight, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import Logo from '../common/Logo'
import Button from '../common/Button'
import { publicNavigationLinks } from '../../data/navigationLinks'
import { useAuth } from '../../hooks/useAuth'
import { useSiteMode } from '../../hooks/useSiteMode'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { isLive } = useSiteMode()
  const { isAuthenticated } = useAuth()
  const close = () => setOpen(false)
  return <header className="site-header">
    <Logo />
    <button className="menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={open}>{open ? <X /> : <Menu />}</button>
    <nav className={open ? 'nav nav--open' : 'nav'} aria-label="Main navigation">
      {publicNavigationLinks.map((link) => <NavLink key={link.to} onClick={close} to={link.to} end={link.to === '/'}>{link.label}</NavLink>)}
      <NavLink onClick={close} to={isAuthenticated ? '/book' : '/auth/sign-in'}>{isAuthenticated ? 'Account' : 'Login'}</NavLink>
      <Button to={isLive ? '/book' : '/waitlist'} size="sm" onClick={close}>{isLive ? 'Book appointment' : 'Join the waitlist'} <ArrowRight size={16} /></Button>
    </nav>
  </header>
}
