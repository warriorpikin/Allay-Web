import { Instagram, MapPin } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../components/common/Button'
import PageHero from '../../components/common/PageHero'
import TikTokIcon from '../../components/common/TikTokIcon'
import Input from '../../components/forms/Input'
import Textarea from '../../components/forms/Textarea'
import { siteSocialLinks } from '../../data/socialLinks'
import { ANALYTICS_EVENTS, trackEvent } from '../../services/analytics'
import { sendContactMessage } from '../../services/contactApi'
import { imagePaths } from '../../utils/imagePaths'

const contactMethods = [
  { key: 'instagram', icon: Instagram, ...siteSocialLinks.instagram },
  { key: 'tiktok', icon: TikTokIcon, ...siteSocialLinks.tiktok },
  { key: 'googleMaps', icon: MapPin, ...siteSocialLinks.googleMaps },
]

export default function Contact() {
  const [submitting, setSubmitting] = useState(false)

  const submit = (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    setSubmitting(true)
    sendContactMessage({
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      message: formData.get('message'),
    })
      .then(() => {
        toast.success('Your message has been sent to the Allay House team.')
        form.reset()
      })
      .catch(() => toast.error('We could not send your message. Please try again.'))
      .finally(() => setSubmitting(false))
  }

  return <><PageHero eyebrow="Contact" title="We would love to hear from you." subtitle="Questions, collaborations, or help choosing your first Allay ritual, we are here." variant="split" image={imagePaths.contact.hero} imageAlt="A warm Allay House welcome" imageCategory="A warm welcome" /><section className="contact-layout section"><div><span className="eyebrow">General enquiries</span><h2><a href="mailto:hello@allayhouse.com" onClick={() => trackEvent(ANALYTICS_EVENTS.CONTACT_CLICK, { link_type: 'email', source_section: 'contact_page' })}>hello@allayhouse.com</a></h2><p>Lagos, Nigeria<br />Monday-Saturday / 9am-7pm</p>
      <div className="contact-methods">
        {contactMethods.map(({ key, icon: Icon, label, url, accessibleLabel, description }) => (
          <a key={key} className="contact-method" href={url} target="_blank" rel="noopener noreferrer" aria-label={accessibleLabel} onClick={() => trackEvent(ANALYTICS_EVENTS.CONTACT_CLICK, { link_type: key, source_section: 'contact_page' })}>
            <span className="contact-method__icon" aria-hidden="true"><Icon size={18} /></span>
            <span><strong>{label}</strong><small>{description}</small></span>
          </a>
        ))}
      </div>
    </div><form className="form-card" onSubmit={submit}><Input id="contact-name" name="fullName" label="Full name" required /><Input id="contact-email" name="email" type="email" label="Email" required /><Textarea id="contact-message" name="message" label="How can we help?" required /><Button type="submit" loading={submitting}>Send enquiry</Button></form></section></>
}
