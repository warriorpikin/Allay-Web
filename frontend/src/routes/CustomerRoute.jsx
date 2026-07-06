import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Loader from '../components/common/Loader'
import { useAuth } from '../hooks/useAuth'

export default function CustomerRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading) return <Loader label="Opening your Allay account" />
  if (!isAuthenticated) return <Navigate to={`/auth/sign-up?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return <Outlet />
}

