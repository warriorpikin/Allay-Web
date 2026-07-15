import { ArrowLeft, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import Logo from '../../components/common/Logo'
import Button from '../../components/common/Button'
import WaitlistServiceSelector from '../../components/common/WaitlistServiceSelector'
import Input from '../../components/forms/Input'
import Textarea from '../../components/forms/Textarea'
import { placeholderServices } from '../../data/placeholderServices'
import { categoryAliases, normalizeToken } from '../../data/serviceDivisions'
import { useSiteMode } from '../../hooks/useSiteMode'
import { ANALYTICS_EVENTS, trackEvent } from '../../services/analytics'
import { getServices } from '../../services/servicesApi'
import { joinWaitlist } from '../../services/waitlistApi'
import { getErrorMessage } from '../../utils/getErrorMessage'
import { imagePaths } from '../../utils/imagePaths'
import { validateWaitlistForm } from '../../utils/validateWaitlistForm'

// The visitor may have arrived from the pre-launch landing page (which
// passes { from: '/landing' } via router state) or from any other entry
// point (a direct link, a service card, etc.), which should keep returning
// home. Router state is the safe source here since it can't be spoofed by
// browser history the way a blind history.back() could send someone to an
// unrelated page.
function WaitlistHeader({ returnPath, returnLabel }) {
  return <div className="waitlist-page__top"><Logo /><div className="waitlist-page__nav"><Link to={returnPath}><ArrowLeft size={15} /> {returnLabel}</Link></div></div>
}

function servicesFromQuery(services, searchParams) {
  const serviceParam = searchParams.get('service') || ''
  const serviceToken = normalizeToken(serviceParam)
  const categoryToken = normalizeToken(searchParams.get('category') || '')

  if (serviceToken) {
    const match = services.find((service) => normalizeToken(service.slug || service.id) === serviceToken || String(service.id) === serviceParam)
    return match ? [match] : []
  }

  if (!categoryToken) return []
  const acceptedCategories = new Set([categoryToken, ...(categoryAliases[categoryToken] || [])])
  return services.filter((service) => acceptedCategories.has(normalizeToken(service.category || '')))
}

function serviceKeys(service = {}) {
  return [service.id, service.slug].filter(Boolean).map(String)
}

export default function Waitlist() {
  const { isLive, waitlistEnabled, isLoading: siteModeLoading } = useSiteMode()
  const location = useLocation()
  const fromLanding = location.state?.from === '/landing'
  const returnPath = fromLanding ? '/landing' : '/'
  const returnLabel = fromLanding ? 'Back' : 'Return home'
  const [searchParams] = useSearchParams()
  const [services, setServices] = useState(placeholderServices)
  const [servicesLoading, setServicesLoading] = useState(true)
  const [selected, setSelected] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ email: '', fullName: '', phone: '', note: '' })
  const [started, setStarted] = useState(false)
  const [touched, setTouched] = useState({})
  const [submitAttempted, setSubmitAttempted] = useState(false)

  useEffect(() => {
    setServicesLoading(true)
    getServices()
      .then((data) => { if (data.services?.length) setServices(data.services) })
      .catch(() => setServices(placeholderServices))
      .finally(() => setServicesLoading(false))
  }, [])

  useEffect(() => {
    const preselected = servicesFromQuery(services, searchParams)
    if (!preselected.length) return
    setSelected((current) => {
      const known = new Set(current.flatMap(serviceKeys))
      const additions = preselected.filter((service) => !serviceKeys(service).some((key) => known.has(key)))
      return additions.length ? [...current, ...additions] : current
    })
  }, [services, searchParams])

  const markStarted = () => {
    if (started) return
    setStarted(true)
    trackEvent(ANALYTICS_EVENTS.WAITLIST_START, { source_section: 'waitlist_form' })
  }

  const update = (field) => (event) => {
    markStarted()
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const blur = (field) => () => setTouched((current) => ({ ...current, [field]: true }))

  const formErrors = validateWaitlistForm({ fullName: form.fullName, phone: form.phone, email: form.email, selectedServices: selected })
  const fieldError = (field) => (touched[field] || submitAttempted) ? formErrors[field] : undefined

  const submit = (event) => {
    event.preventDefault()
    markStarted()
    setSubmitAttempted(true)
    if (Object.keys(formErrors).length) {
      toast.error(formErrors.fullName || formErrors.phone || formErrors.email || formErrors.services)
      return
    }
    setSubmitting(true)
    joinWaitlist({
      email: form.email.trim(),
      selectedServices: selected.map((service) => service.slug || service.id),
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      note: form.note || undefined,
    })
      .then(() => {
        setSubmitted(true)
        trackEvent(ANALYTICS_EVENTS.GENERATE_LEAD, { lead_type: 'waitlist', service_category: selected[0]?.category, source_section: 'waitlist_form' })
        toast.success('You have joined the Allay House waitlist.')
      })
      .catch((error) => {
        trackEvent(ANALYTICS_EVENTS.WAITLIST_ERROR, { source_section: 'waitlist_form', error_type: error.response?.status === 409 ? 'duplicate_or_conflict' : 'request_failed', result: 'failed' })
        toast.error(getErrorMessage(error, 'We could not add you to the waitlist. Please try again.'))
      })
      .finally(() => setSubmitting(false))
  }

  const backgroundStyle = { '--waitlist-page-image': `url(${imagePaths.waitlist.hero})` }

  return <main className="waitlist-page" style={backgroundStyle}>
    <WaitlistHeader returnPath={returnPath} returnLabel={returnLabel} />
    {!siteModeLoading && !waitlistEnabled
      ? <section className="waitlist-success"><span><Check /></span><small className="eyebrow">Waitlist closed</small><h1>Our private waitlist is currently closed.</h1><p>Please watch out for future openings.</p><Button to="/">Return to Allay House</Button></section>
      : submitted
      ? <section className="waitlist-success"><span><Check /></span><small className="eyebrow">You are on the list</small><h1>Your place is held.</h1><p>We will write to <strong>{form.email}</strong> with private opening news and send your 15% launch discount code when bookings officially open.</p><Button to="/">Return to Allay House</Button></section>
      : <section className="waitlist-page__card">
          <span className="eyebrow">Private opening access</span>
          <h1>What are you<br />waiting for?</h1>
          <p>Join the Allay House waitlist for early appointment access and 15% off your first booking when Allay House launches. The discount code will be sent to your email when bookings open.</p>
          <form onSubmit={submit} noValidate>
            <Input id="waitlist-email" name="email" type="email" label="Email" required value={form.email} onChange={update('email')} onBlur={blur('email')} error={fieldError('email')} />
            <div className="form-row">
              <Input id="waitlist-name" name="fullName" label="Full name" required minLength={2} value={form.fullName} onChange={update('fullName')} onBlur={blur('fullName')} error={fieldError('fullName')} />
              <Input id="waitlist-phone" name="phone" type="tel" label="Phone number" required value={form.phone} onChange={update('phone')} onBlur={blur('phone')} error={fieldError('phone')} />
            </div>
            <div className={`form-group ${fieldError('services') ? 'form-group--error' : ''}`}>
              <label>Services of interest<span aria-hidden="true"> *</span></label>
              {servicesLoading
                ? <div className="waitlist-service-grid" aria-label="Loading services">{Array.from({ length: 5 }).map((_, index) => <div className="waitlist-service-skeleton" key={index} aria-hidden="true"><span /><div><i /><b /></div></div>)}</div>
                : <WaitlistServiceSelector services={services} selected={selected} isLive={isLive} onChange={(nextSelected) => { markStarted(); setSelected(nextSelected) }} />}
              {fieldError('services') && <small className="form-group__error">{fieldError('services')}</small>}
              {!isLive && <p className="waitlist-price-note">Pricing will be revealed at launch. Join the waitlist to receive final pricing and your exclusive 15% launch discount.</p>}
            </div>
            <Textarea id="waitlist-note" name="note" label="Anything you would like us to know? (optional)" value={form.note} onChange={update('note')} />
            <Button type="submit" size="lg" loading={submitting}>Join the private waitlist</Button>
          </form>
        </section>}
  </main>
}
