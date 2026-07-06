import { CalendarClock, CalendarDays, CreditCard, Gauge, ListChecks, Mail, Settings, Sparkles, UsersRound, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { adminNavigationLinks } from '../../data/navigationLinks'
import Brand from '../common/Brand'

const icons = [Gauge, CalendarDays, CalendarClock, Sparkles, UsersRound, CreditCard, Mail, Settings]

export default function AdminSidebar({ open, collapsed, onClose }) {
  return <aside className={`admin-sidebar ${open ? 'is-open' : ''} ${collapsed ? 'is-collapsed' : ''}`}>
    <div className="admin-sidebar__head"><Brand light /><button type="button" onClick={onClose} aria-label="Close menu"><X /></button></div>
    <nav aria-label="Admin navigation">{adminNavigationLinks.map((link, index) => {
      const Icon = icons[index] || ListChecks
      return <NavLink key={link.to} to={link.to} end={link.end} onClick={onClose}><Icon size={18} /><span>{link.label}</span></NavLink>
    })}</nav>
  </aside>
}

