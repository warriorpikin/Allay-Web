import toast from 'react-hot-toast'
import Button from '../../components/common/Button'
import Input from '../../components/forms/Input'
import Select from '../../components/forms/Select'
import Textarea from '../../components/forms/Textarea'

export default function Settings() {
  const save = (event) => { event.preventDefault(); toast('Settings save will connect to the Admin API.', { icon: '✦' }) }
  return <><div className="admin-page-heading"><div><span className="eyebrow">Business controls</span><h1>Settings</h1><p>Core brand, booking, contact, and launch configuration.</p></div></div><form className="admin-panel admin-settings" onSubmit={save}><div className="form-row"><Input id="business-name" label="Business name" defaultValue="Allay House" /><Input id="business-email" type="email" label="Contact email" defaultValue="hello@allayhouse.com" /></div><Select id="launch-mode" label="Launch mode" defaultValue="prelaunch" options={[{ value: 'prelaunch', label: 'Pre-launch' }, { value: 'live', label: 'Live' }]} /><Textarea id="cancellation-policy" label="Cancellation policy" placeholder="Policy copy will be confirmed before launch." /><Button type="submit">Save settings</Button></form></>
}

