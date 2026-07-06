import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../../components/common/Button'
import Input from '../../components/forms/Input'
import { useAuth } from '../../hooks/useAuth'
import { getRedirectPath } from '../../utils/getRedirectPath'

export default function SignIn() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const redirect = getRedirectPath(searchParams.get('redirect'))
  const [form, setForm] = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)

  if (!isLoading && isAuthenticated) return <Navigate to={redirect} replace />
  const submit = async (event) => {
    event.preventDefault(); setSubmitting(true)
    try { await login(form); toast.success('Welcome back to Allay House.'); navigate(redirect, { replace: true }) }
    catch { toast.error('We could not sign you in. Please try again.') }
    finally { setSubmitting(false) }
  }

  return <section className="auth-card"><span className="eyebrow">Your Allay account</span><h1>Welcome back.</h1><p>Sign in to continue to your private Allay House access.</p><form onSubmit={submit}><Input id="customer-signin-email" type="email" label="Email" required autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /><Input id="customer-signin-password" type="password" label="Password" required minLength="8" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><Button type="submit" size="lg" loading={submitting}>Sign in <ArrowRight size={16} /></Button></form><small>New to Allay House? <Link to={`/auth/sign-up?redirect=${encodeURIComponent(redirect)}`}>Create an account</Link></small></section>
}

