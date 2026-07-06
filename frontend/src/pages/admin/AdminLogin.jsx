import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Brand from '../../components/common/Brand'
import Button from '../../components/common/Button'
import Input from '../../components/forms/Input'
import { useAdminAuth } from '../../hooks/useAdminAuth'

export default function AdminLogin() {
  const { login, isAuthenticated } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  if (isAuthenticated) return <Navigate to="/allay-admin" replace />

  const submit = async (event) => {
    event.preventDefault(); setLoading(true)
    try { await login(form); navigate(location.state?.from?.pathname || '/allay-admin', { replace: true }) }
    catch (error) { toast.error(error.response?.data?.message || 'Unable to sign in. Check the API connection.') }
    finally { setLoading(false) }
  }

  return <main className="admin-login"><div className="admin-login__art"><Brand light /><div><span className="eyebrow eyebrow--light">Allay House operations</span><h1>Care begins<br />behind the scenes.</h1></div></div><form className="admin-login__form" onSubmit={submit}><span className="eyebrow">Private access</span><h2>Welcome back.</h2><p>Sign in to the Allay House control room.</p><Input id="admin-email" type="email" label="Email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@allayhouse.com" /><Input id="admin-password" type="password" label="Password" required minLength="8" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="••••••••" /><Button type="submit" loading={loading}>Enter control room <ArrowRight size={16} /></Button></form></main>
}
