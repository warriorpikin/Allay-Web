import { Link, Outlet, useLocation } from 'react-router-dom'
import { imagePaths } from '../../utils/imagePaths'
import Logo from '../common/Logo'

export default function AuthLayout() {
  const location = useLocation()
  const image = location.pathname.includes('sign-up') ? imagePaths.auth.signup : imagePaths.auth.signin
  return <main className="auth-page" style={{ '--auth-page-image': `url(${image})` }}><header className="auth-page__header"><Logo /><Link to="/">Return to Allay House</Link></header><Outlet /></main>
}
