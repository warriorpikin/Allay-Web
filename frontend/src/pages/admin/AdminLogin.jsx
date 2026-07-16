import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Brand from '../../components/common/Brand'
import Button from '../../components/common/Button'
import Seo from '../../components/common/Seo'
import Input from '../../components/forms/Input'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { API_BASE_URL } from '../../services/api'
import { imagePaths } from '../../utils/imagePaths'

export default function AdminLogin() {
  const { login, isAuthenticated } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  if (isAuthenticated) return <Navigate to="/allay-admin" replace />

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      await login(form)
      navigate(location.state?.from?.pathname || '/allay-admin', { replace: true })
    } catch (error) {
      const status = error.response?.status
      console.warn('Admin login request failed', { status, code: error.code, apiBaseUrl: API_BASE_URL })
      if (!error.response) toast.error('Cannot connect to server. Check backend URL.')
      else if (status === 401) toast.error('Invalid admin email or password.')
      else if (status === 404) toast.error('Admin login route was not found. Check API configuration.')
      else toast.error(error.response?.data?.message || 'Unable to sign in. Check the API connection.')
    } finally {
      setLoading(false)
    }
  }

  return <main className="admin-login"><Seo noindex title="Admin sign in | Allay House" path="/allay-admin/login" /><div className="admin-login__art" style={{ '--admin-login-image': `url(${imagePaths.auth.adminLoginBg})` }}><Brand light /><div><span className="eyebrow eyebrow--light">Allay House operations</span><h1>Care begins<br />behind the scenes.</h1></div></div><form className="admin-login__form" onSubmit={submit}><span className="eyebrow">Private access</span><h2>Welcome back.</h2><p>Sign in to the Allay House control room.</p><Input id="admin-email" type="email" label="Email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@allayhouse.com" /><Input id="admin-password" type="password" label="Password" required minLength="8" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Password" /><Button type="submit" loading={loading}>Enter control room <ArrowRight size={16} /></Button></form></main>
}
