import { Link, Outlet } from 'react-router-dom'
import Logo from '../common/Logo'

export default function AuthLayout() {
  return <main className="auth-page"><header className="auth-page__header"><Logo /><Link to="/">Return to Allay House</Link></header><Outlet /></main>
}
