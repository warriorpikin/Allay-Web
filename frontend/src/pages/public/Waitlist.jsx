import { ArrowLeft, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import Logo from '../../components/common/Logo'
import Button from '../../components/common/Button'
import WaitlistServiceSelector from '../../components/common/WaitlistServiceSelector'
import Input from '../../components/forms/Input'
import Textarea from '../../components/forms/Textarea'
import { placeholderServices } from '../../data/placeholderServices'
import { useSiteMode } from '../../hooks/useSiteMode'
import { ANALYTICS_EVENTS, trackEvent } from '../../services/analytics'
import { getServices } from '../../services/servicesApi'
import { joinWaitlist } from '../../services/waitlistApi'
import { imagePaths } from '../../utils/imagePaths'

function WaitlistHeader() {
  return <div className="waitlist-page__top"><Logo /><div className="waitlist-page__nav"><Link to="/"><ArrowLeft size={15} /> Return home</Link></div></div>
}

export default function Waitlist() {
  const { waitlistEnabled, isLoading: siteModeLoading } = useSiteMode()
  const [services, setServices] = useState(placeholderServices)
  const [selected, setSelected] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ email: '', fullName: '', phone: '', note: '' })
  const [started, setStarted] = useState(false)

  useEffect(() => {
    getServices()
      .then((data) => { if (data.services?.length) setServices(data.services) })
      .catch(() => setServices(placeholderServices))
  }, [])

  const markStarted = () => {
    if (started) return
    setStarted(true)
    trackEvent(ANALYTICS_EVENTS.WAITLIST_START, { source_section: 'waitlist_form' })
  }

  const update = (field) => (event) => {
    markStarted()
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const submit = (event) => {
    event.preventDefault()
    if (!selected.length) { toast.error('Choose at least one service interest.'); return }
    markStarted()
    setSubmitting(true)
    joinWaitlist({
      email: form.email,
      selectedServices: selected.map((service) => service.slug || service.id),
      fullName: form.fullName || undefined,
      phone: form.phone || undefined,
      note: form.note || undefined,
    })
      .then(() => {
        setSubmitted(true)
        trackEvent(ANALYTICS_EVENTS.GENERATE_LEAD, { lead_type: 'waitlist', service_category: selected[0]?.category, source_section: 'waitlist_form' })
        toast.success('You’ve joined the Allay House waitlist.')
      })
      .catch((error) => {
        trackEvent(ANALYTICS_EVENTS.WAITLIST_ERROR, { source_section: 'waitlist_form', error_type: error.response?.status === 409 ? 'duplicate_or_conflict' : 'request_failed', result: 'failed' })
        toast.error(error.response?.data?.message || 'We could not add you to the waitlist. Please try again.')
      })
      .finally(() => setSubmitting(false))
  }

  const backgroundStyle = { '--waitlist-page-image': `url(${imagePaths.waitlist.hero})` }

  return <main className="waitlist-page" style={backgroundStyle}>
    <WaitlistHeader />
    {!siteModeLoading && !waitlistEnabled
      ? <section className="waitlist-success"><span><Check /></span><small className="eyebrow">Waitlist closed</small><h1>Our private waitlist is currently closed.</h1><p>Please watch out for future openings.</p><Button to="/">Return to Allay House</Button></section>
      : submitted
      ? <section className="waitlist-success"><span><Check /></span><small className="eyebrow">You are on the list</small><h1>Your place is held.</h1><p>We will write to <strong>{form.email}</strong> with private opening news for your selected Allay experiences.</p><Button to="/">Return to Allay House</Button></section>
      : <section className="waitlist-page__card">
          <span className="eyebrow">Private opening access</span>
          <h1>What are you<br />waiting for?</h1>
          <p>Join the Allay House waitlist for early appointment access and considered launch offers. No account needed &mdash; just your email.</p>
          <form onSubmit={submit}>
            <Input id="waitlist-email" name="email" type="email" label="Email" required value={form.email} onChange={update('email')} />
            <div className="form-row">
              <Input id="waitlist-name" name="fullName" label="Full name (optional)" value={form.fullName} onChange={update('fullName')} />
              <Input id="waitlist-phone" name="phone" type="tel" label="Phone number (optional)" value={form.phone} onChange={update('phone')} />
            </div>
            <div className="form-group">
              <label>Services of interest</label>
              <WaitlistServiceSelector services={services} selected={selected} onChange={(nextSelected) => { markStarted(); setSelected(nextSelected) }} />
            </div>
            <Textarea id="waitlist-note" name="note" label="Anything you would like us to know? (optional)" value={form.note} onChange={update('note')} />
            <Button type="submit" size="lg" loading={submitting}>Join the private waitlist</Button>
          </form>
        </section>}
  </main>
}
