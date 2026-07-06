import { ArrowLeft, ArrowRight, Check, Gift, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import Logo from '../../components/common/Logo'
import Button from '../../components/common/Button'
import Loader from '../../components/common/Loader'
import WaitlistServiceSelector from '../../components/common/WaitlistServiceSelector'
import Input from '../../components/forms/Input'
import Textarea from '../../components/forms/Textarea'
import { serviceCategories } from '../../data/serviceCategories'
import { useAuth } from '../../hooks/useAuth'

function WaitlistHeader({ user, onLogout }) {
  return <div className="waitlist-page__top"><Logo /><div className="waitlist-page__nav">{user && <span>Welcome, {user.fullName?.split(' ')[0]}</span>}{user && <button type="button" onClick={onLogout}>Sign out</button>}<Link to="/"><ArrowLeft size={15} /> Return home</Link></div></div>
}

function GuestInvitation() {
  return <section className="waitlist-invitation"><span className="eyebrow">Private opening access</span><h1>Be among the first<br />to enter the house.</h1><p>Join the Allay House waitlist for early appointment access and considered launch offers for the services that matter to you.</p><div className="waitlist-benefits"><article><Sparkles size={19} /><strong>First access</strong><span>Hear about private opening appointments before public launch.</span></article><article><Gift size={19} /><strong>Personal offers</strong><span>Receive launch benefits shaped around your service interests.</span></article></div><div className="waitlist-invitation__actions"><Button to="/auth/sign-up?redirect=%2Fwaitlist" size="lg">Join the waitlist <ArrowRight size={16} /></Button><Button to="/auth/sign-in?redirect=%2Fwaitlist" variant="outline" size="lg">Sign in</Button></div><small>Creating an account is only required to join the waitlist. The rest of Allay House remains open to browse.</small></section>
}

export default function Waitlist() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const [selected, setSelected] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [profile, setProfile] = useState({ fullName: '', email: '', phone: '', note: '' })

  useEffect(() => {
    if (user) setProfile({ fullName: user.fullName || '', email: user.email || '', phone: user.phone || '', note: '' })
  }, [user])

  const update = (field) => (event) => setProfile((current) => ({ ...current, [field]: event.target.value }))
  const submit = (event) => {
    event.preventDefault()
    if (!selected.length) { toast.error('Choose at least one service interest.'); return }
    const waitlistEntry = { selectedServices: selected, fullName: profile.fullName, email: profile.email, phone: profile.phone, note: profile.note }
    // Phase 2: replace this local mock with joinWaitlist(waitlistEntry).
    void waitlistEntry
    setSubmitted(true)
    toast.success('You’ve joined the Allay House waitlist.')
  }

  if (isLoading) return <main className="waitlist-page"><WaitlistHeader /><Loader label="Preparing your invitation" /></main>

  return <main className={`waitlist-page ${isAuthenticated ? 'waitlist-page--member' : 'waitlist-page--guest'}`}>
    <WaitlistHeader user={user} onLogout={logout} />
    {!isAuthenticated ? <GuestInvitation /> : submitted ? <section className="waitlist-success"><span><Check /></span><small className="eyebrow">You are on the list</small><h1>Your place is held.</h1><p>We will write to <strong>{profile.email}</strong> with private opening news for your selected Allay experiences.</p><Button to="/">Return to Allay House</Button></section> : <section className="waitlist-page__card"><span className="eyebrow">Choose your Allay experiences</span><h1>What are you<br />waiting for?</h1><p>Your account details are already here. Select the services you would like early access to.</p><form onSubmit={submit}><div className="form-row"><Input id="waitlist-name" name="fullName" label="Full name" required value={profile.fullName} onChange={update('fullName')} /><Input id="waitlist-email" name="email" type="email" label="Email" required value={profile.email} onChange={update('email')} /></div><Input id="waitlist-phone" name="phone" type="tel" label="Phone number" required value={profile.phone} onChange={update('phone')} /><div className="form-group"><label>Services of interest</label><WaitlistServiceSelector services={serviceCategories} selected={selected} onChange={setSelected} /></div><Textarea id="waitlist-note" name="note" label="Anything you would like us to know?" value={profile.note} onChange={update('note')} /><Button type="submit" size="lg">Join the private waitlist</Button></form></section>}
  </main>
}
