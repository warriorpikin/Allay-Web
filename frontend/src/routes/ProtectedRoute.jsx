import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'

export default function ProtectedRoute() {
  const { isAuthenticated } = useAdminAuth()
  const location = useLocation()
  return isAuthenticated ? <Outlet /> : <Navigate to="/allay-admin/login" replace state={{ from: location }} />
}
