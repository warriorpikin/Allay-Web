import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../../components/common/Button'
import Input from '../../components/forms/Input'
import { useAuth } from '../../hooks/useAuth'
import { getRedirectPath } from '../../utils/getRedirectPath'

export default function SignUp() {
  const { signup, isAuthenticated, isLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const redirect = getRedirectPath(searchParams.get('redirect'))
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [submitting, setSubmitting] = useState(false)

  if (!isLoading && isAuthenticated) return <Navigate to={redirect} replace />
  const submit = async (event) => {
    event.preventDefault()
    if (form.password !== form.confirmPassword) { toast.error('Your passwords do not match.'); return }
    setSubmitting(true)
    try { await signup(form); toast.success('Your Allay House account is ready.'); navigate(redirect, { replace: true }) }
    catch { toast.error('We could not create your account. Please try again.') }
    finally { setSubmitting(false) }
  }

  return <section className="auth-card auth-card--wide"><span className="eyebrow">Create your account</span><h1>Your invitation begins here.</h1><p>Set up a simple Allay account to join the private waitlist.</p><form onSubmit={submit}><Input id="customer-signup-name" label="Full name" required autoComplete="name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /><div className="form-row"><Input id="customer-signup-email" type="email" label="Email" required autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /><Input id="customer-signup-phone" type="tel" label="Phone" required autoComplete="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div><div className="form-row"><Input id="customer-signup-password" type="password" label="Password" required minLength="8" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><Input id="customer-signup-confirm" type="password" label="Confirm password" required minLength="8" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} /></div><Button type="submit" size="lg" loading={submitting}>Create account <ArrowRight size={16} /></Button></form><small>Already have an account? <Link to={`/auth/sign-in?redirect=${encodeURIComponent(redirect)}`}>Sign in</Link></small></section>
}

