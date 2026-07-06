import { LogOut, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function AdminTopbar({ collapsed, onToggleCollapse, onOpenMenu }) {
  const { admin, logout } = useAuth()
  return <header className="admin-topbar">
    <div><button className="admin-topbar__mobile" type="button" onClick={onOpenMenu} aria-label="Open menu"><Menu /></button><button className="admin-topbar__collapse" type="button" onClick={onToggleCollapse} aria-label="Toggle sidebar">{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</button></div>
    <div className="admin-topbar__account"><span><strong>{admin?.name || 'Allay Admin'}</strong><small>{admin?.role || 'Operations'}</small></span><button type="button" onClick={logout} aria-label="Sign out"><LogOut size={18} /></button></div>
  </header>
}

