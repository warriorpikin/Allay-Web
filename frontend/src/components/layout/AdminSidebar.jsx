import { CalendarCheck, Clock, CreditCard, LayoutDashboard, Mail, Settings, Sparkles, Star, UserRound, Users, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { adminNavigationLinks } from '../../data/navigationLinks'
import Brand from '../common/Brand'

const iconsByPath = {
  '/allay-admin': LayoutDashboard,
  '/allay-admin/bookings': CalendarCheck,
  '/allay-admin/customers': UserRound,
  '/allay-admin/availability': Clock,
  '/allay-admin/services': Sparkles,
  '/allay-admin/testimonials': Star,
  '/allay-admin/waitlist': Users,
  '/allay-admin/payments': CreditCard,
  '/allay-admin/email-logs': Mail,
  '/allay-admin/settings': Settings,
}

export default function AdminSidebar({ open, collapsed, onClose }) {
  return <aside className={`admin-sidebar ${open ? 'is-open' : ''} ${collapsed ? 'is-collapsed' : ''}`}>
    <div className="admin-sidebar__head"><Brand light /><button type="button" onClick={onClose} aria-label="Close menu"><X /></button></div>
    <nav aria-label="Admin navigation">{adminNavigationLinks.map((link) => {
      const Icon = iconsByPath[link.to] || LayoutDashboard
      return <NavLink key={link.to} to={link.to} end={link.end} onClick={onClose}><Icon size={18} /><span>{link.label}</span></NavLink>
    })}</nav>
  </aside>
}
