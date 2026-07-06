import Button from '../../components/common/Button'
import Input from '../../components/forms/Input'
import Textarea from '../../components/forms/Textarea'

export default function Availability() {
  return <><div className="admin-page-heading"><div><span className="eyebrow">Calendar control</span><h1>Availability</h1><p>Opening hours and blocked periods will be validated by the backend.</p></div><Button>Close bookings today</Button></div><div className="admin-detail-grid"><section className="admin-panel"><h2>Normal hours</h2><p>Monday–Saturday · 9:00am–7:00pm</p><p>Sunday · Closed</p></section><form className="admin-panel"><h2>Block a period</h2><Input id="block-start" type="datetime-local" label="Starts" /><Input id="block-end" type="datetime-local" label="Ends" /><Textarea id="block-reason" label="Reason" /><Button type="button">Add blocked period</Button></form></div></>
}

