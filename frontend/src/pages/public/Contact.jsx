import toast from 'react-hot-toast'
import Button from '../../components/common/Button'
import PageHero from '../../components/common/PageHero'
import Input from '../../components/forms/Input'
import Textarea from '../../components/forms/Textarea'

export default function Contact() {
  const submit = (event) => { event.preventDefault(); toast('Contact delivery will be connected with the public API.', { icon: '✦' }); event.currentTarget.reset() }
  return <><PageHero eyebrow="Contact" title="We would love to hear from you." subtitle="Questions, collaborations, or help choosing your first Allay ritual—we are here." variant="split" imageCategory="A warm welcome" /><section className="contact-layout section"><div><span className="eyebrow">General enquiries</span><h2>hello@allayhouse.com</h2><p>+234 000 000 0000<br />Lagos, Nigeria<br />Monday–Saturday · 9am–7pm</p></div><form className="form-card" onSubmit={submit}><Input id="contact-name" name="fullName" label="Full name" required /><Input id="contact-email" name="email" type="email" label="Email" required /><Textarea id="contact-message" name="message" label="How can we help?" required /><Button type="submit">Send enquiry</Button></form></section></>
}

