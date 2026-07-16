import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Seo from '../common/Seo'
import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  return <div className={`admin-layout ${collapsed ? 'admin-layout--collapsed' : ''}`}>
    <Seo noindex title="Admin | Allay House" />
    <AdminSidebar open={menuOpen} collapsed={collapsed} onClose={() => setMenuOpen(false)} />
    {menuOpen && <button type="button" className="admin-scrim" onClick={() => setMenuOpen(false)} aria-label="Close menu" />}
    <div className="admin-workspace"><AdminTopbar collapsed={collapsed} onToggleCollapse={() => setCollapsed((value) => !value)} onOpenMenu={() => setMenuOpen(true)} /><main className="admin-content"><Outlet /></main></div>
  </div>
}

