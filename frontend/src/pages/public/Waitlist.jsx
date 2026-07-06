import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import Brand from '../../components/common/Brand'
import Button from '../../components/common/Button'
import WaitlistServiceSelector from '../../components/common/WaitlistServiceSelector'
import Input from '../../components/forms/Input'
import Textarea from '../../components/forms/Textarea'
import { serviceCategories } from '../../data/serviceCategories'

export default function Waitlist() {
  const [selected, setSelected] = useState([])
  const submit = (event) => {
    event.preventDefault()
    if (!selected.length) { toast.error('Choose at least one service interest.'); return }
    // Phase 2: send form values and selected IDs through joinWaitlist().
    toast.success('Your waitlist form is ready for the Phase 2 API connection.')
  }
  return <main className="waitlist-page"><div className="waitlist-page__top"><Brand /><Link to="/"><ArrowLeft size={15} /> Return home</Link></div><section className="waitlist-page__card"><span className="eyebrow">Private opening access</span><h1>Be among the first<br />to enter the house.</h1><p>Select the Allay experiences you would like to hear about when private opening access begins.</p><form onSubmit={submit}><div className="form-row"><Input id="waitlist-name" name="fullName" label="Full name" required /><Input id="waitlist-email" name="email" type="email" label="Email" required /></div><Input id="waitlist-phone" name="phone" type="tel" label="Phone number" required /><div className="form-group"><label>Services of interest</label><WaitlistServiceSelector services={serviceCategories} selected={selected} onChange={setSelected} /></div><Textarea id="waitlist-note" name="note" label="Anything you would like us to know?" /><Button type="submit" size="lg">Join the private waitlist</Button></form></section></main>
}

