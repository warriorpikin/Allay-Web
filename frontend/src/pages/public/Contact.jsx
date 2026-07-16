import { Instagram, MapPin } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import Button from '../../components/common/Button'
import PageHero from '../../components/common/PageHero'
import Seo from '../../components/common/Seo'
import TikTokIcon from '../../components/common/TikTokIcon'
import Input from '../../components/forms/Input'
import Textarea from '../../components/forms/Textarea'
import { siteSocialLinks } from '../../data/socialLinks'
import { ANALYTICS_EVENTS, trackEvent } from '../../services/analytics'
import { imagePaths } from '../../utils/imagePaths'

const contactMethods = [
  { key: 'instagram', icon: Instagram, ...siteSocialLinks.instagram },
  { key: 'tiktok', icon: TikTokIcon, ...siteSocialLinks.tiktok },
  { key: 'googleMaps', icon: MapPin, ...siteSocialLinks.googleMaps },
]

// Configurable so the address can be corrected later without editing code —
// see frontend/.env.example.
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'help@allayhouse.con'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function buildInquiryBody({ name, email, message }) {
  return [
    'Hello Allay House,',
    '',
    'I would like to make an inquiry.',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    '',
    'Inquiry:',
    message,
    '',
    'Kind regards,',
    name,
  ].join('\n')
}

async function copyToClipboard(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return true
  }
  return false
}

export default function Contact() {
  const [searchParams] = useSearchParams()
  const membershipName = searchParams.get('membership')
  const [form, setForm] = useState({
    name: '',
    email: '',
    message: membershipName ? `I'd like to enquire about the ${membershipName} membership.` : '',
  })
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)
  const [lastInquiry, setLastInquiry] = useState(null)

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const validate = () => {
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Please enter your name.'
    if (!form.email.trim()) nextErrors.email = 'Please enter your email address.'
    else if (!EMAIL_PATTERN.test(form.email.trim())) nextErrors.email = 'Please enter a valid email address.'
    if (!form.message.trim()) nextErrors.message = 'Please enter your inquiry.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submit = (event) => {
    event.preventDefault()
    if (!validate()) return

    const name = form.name.trim()
    const email = form.email.trim()
    const message = form.message.trim()
    const subject = `Allay House Website Inquiry from ${name}`
    const body = buildInquiryBody({ name, email, message })
    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    trackEvent(ANALYTICS_EVENTS.CONTACT_CLICK, { link_type: 'contact_form_mailto', source_section: 'contact_page' })

    // A mailto: link gives the browser no reliable signal about whether a
    // mail app actually opened, so the form is not cleared here — the
    // fallback panel below (with copy actions) stays available either way
    // rather than assuming success.
    window.location.href = mailtoUrl
    setLastInquiry({ subject, body })
    setSent(true)
  }

  const copyEmail = () => {
    copyToClipboard(CONTACT_EMAIL)
      .then((copied) => toast[copied ? 'success' : 'error'](copied ? 'Email address copied.' : `Could not copy automatically. Address: ${CONTACT_EMAIL}`))
      .catch(() => toast.error(`Could not copy automatically. Address: ${CONTACT_EMAIL}`))
  }

  const copyInquiry = () => {
    if (!lastInquiry) return
    copyToClipboard(lastInquiry.body)
      .then((copied) => toast[copied ? 'success' : 'error'](copied ? 'Inquiry copied.' : 'Could not copy automatically. Please select and copy the text manually.'))
      .catch(() => toast.error('Could not copy automatically. Please select and copy the text manually.'))
  }

  return <>
    <Seo title="Contact Allay House | Beauty, Wellness & Movement in Lagos" description="Get in touch with Allay House in Lagos, Nigeria — questions, collaborations, or help choosing your first treatment." path="/contact" image={imagePaths.contact.hero} />
    <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Contact', path: '/contact' }]} />
    <PageHero eyebrow="Contact" title="We would love to hear from you." subtitle="Questions, collaborations, or help choosing your first Allay ritual, we are here." variant="split" image={imagePaths.contact.hero} imageAlt="A warm Allay House welcome" imageCategory="A warm welcome" />
    <section className="contact-layout section">
      <div>
        <span className="eyebrow">General enquiries</span>
        <h2><a href="mailto:hello@allayhouse.com" onClick={() => trackEvent(ANALYTICS_EVENTS.CONTACT_CLICK, { link_type: 'email', source_section: 'contact_page' })}>hello@allayhouse.com</a></h2>
        <p>Lagos, Nigeria<br />Monday-Saturday / 9am-7pm</p>
        <div className="contact-methods">
          {contactMethods.map(({ key, icon: Icon, label, url, accessibleLabel, description }) => (
            <a key={key} className="contact-method" href={url} target="_blank" rel="noopener noreferrer" aria-label={accessibleLabel} onClick={() => trackEvent(ANALYTICS_EVENTS.CONTACT_CLICK, { link_type: key, source_section: 'contact_page' })}>
              <span className="contact-method__icon" aria-hidden="true"><Icon size={18} /></span>
              <span><strong>{label}</strong><small>{description}</small></span>
            </a>
          ))}
        </div>
      </div>
      <div>
        <form className="form-card" onSubmit={submit} noValidate>
          <Input id="contact-name" name="name" label="Full name" required value={form.name} onChange={update('name')} error={errors.name} />
          <Input id="contact-email" name="email" type="email" label="Email" required value={form.email} onChange={update('email')} error={errors.email} />
          <Textarea id="contact-message" name="message" label="How can we help?" required value={form.message} onChange={update('message')} error={errors.message} />
          <Button type="submit">Send Inquiry</Button>
          <p className="form-card__note">This opens your email app with your inquiry ready to review and send to Allay House — the website does not send it for you.</p>
        </form>

        {sent && <div className="contact-fallback" role="status">
          <p>Your email app should now be opening with your inquiry ready to send. If nothing opened, copy the details below and paste them into your email application.</p>
          <div className="contact-fallback__actions">
            <Button type="button" variant="outline" onClick={copyEmail}>Copy email address</Button>
            <Button type="button" variant="outline" onClick={copyInquiry}>Copy inquiry</Button>
          </div>
          <p className="contact-fallback__address">{CONTACT_EMAIL}</p>
        </div>}
      </div>
    </section>
  </>
}
