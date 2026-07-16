import { Link, Outlet, useLocation } from 'react-router-dom'
import { imagePaths } from '../../utils/imagePaths'
import Logo from '../common/Logo'
import Seo from '../common/Seo'

export default function AuthLayout() {
  const location = useLocation()
  const image = location.pathname.includes('sign-up') ? imagePaths.auth.signup : imagePaths.auth.signin
  return <main className="auth-page" style={{ '--auth-page-image': `url(${image})` }}>
    <Seo noindex title="Account | Allay House" path={location.pathname} />
    <header className="auth-page__header"><Logo /><Link to="/">Return to Allay House</Link></header><Outlet /></main>
}
