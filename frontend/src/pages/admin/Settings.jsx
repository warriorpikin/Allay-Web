import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../components/common/Button'
import Loader from '../../components/common/Loader'
import Input from '../../components/forms/Input'
import Select from '../../components/forms/Select'
import Textarea from '../../components/forms/Textarea'
import { getSettings, updateSetting } from '../../services/adminApi'

export default function Settings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ businessName: '', contactEmail: '', launchMode: 'prelaunch', waitlistEnabled: true, cancellationPolicy: '' })

  useEffect(() => {
    getSettings()
      .then((data) => {
        const business = data.settings?.find((item) => item.key === 'business')?.value || {}
        const launch = data.settings?.find((item) => item.key === 'launch')?.value || {}
        setForm({
          businessName: business.name || 'Allay House',
          contactEmail: business.contactEmail || '',
          launchMode: launch.mode === 'live' ? 'live' : 'prelaunch',
          waitlistEnabled: launch.waitlist_enabled !== false,
          cancellationPolicy: business.cancellationPolicy || '',
        })
      })
      .catch(() => toast.error('Could not load current settings.'))
      .finally(() => setLoading(false))
  }, [])

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await Promise.all([
        updateSetting('business', {
          name: form.businessName,
          ...(form.contactEmail ? { contactEmail: form.contactEmail } : {}),
          cancellationPolicy: form.cancellationPolicy,
        }),
        updateSetting('launch', { mode: form.launchMode, waitlist_enabled: form.waitlistEnabled }),
      ])
      toast.success(`Settings saved. Site is now in ${form.launchMode === 'live' ? 'live' : 'pre-launch'} mode.`)
    } catch {
      toast.error('Could not save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <><div className="admin-page-heading"><div><span className="eyebrow">Business controls</span><h1>Settings</h1><p>Core brand, booking, contact, and launch configuration.</p></div></div><Loader label="Loading settings" /></>

  return <>
    <div className="admin-page-heading"><div><span className="eyebrow">Business controls</span><h1>Settings</h1><p>Core brand, booking, contact, and launch configuration.</p></div></div>
    <form className="admin-panel admin-settings" onSubmit={save}>
      <div className="form-row">
        <Input id="business-name" label="Business name" value={form.businessName} onChange={update('businessName')} />
        <Input id="business-email" type="email" label="Contact email" value={form.contactEmail} onChange={update('contactEmail')} placeholder="hello@allayhouse.com" />
      </div>
      <Select
        id="launch-mode"
        label="Launch mode"
        value={form.launchMode}
        onChange={update('launchMode')}
        options={[{ value: 'prelaunch', label: 'Pre-launch' }, { value: 'live', label: 'Live' }]}
        helper={form.launchMode === 'live' ? 'Booking is the primary public CTA. Pre-launch copy is hidden.' : 'Waitlist is the primary public CTA. Booking remains reachable.'}
      />
      <label className="admin-toggle-row">
        <input type="checkbox" checked={form.waitlistEnabled} onChange={(event) => setForm((current) => ({ ...current, waitlistEnabled: event.target.checked }))} />
        <span>
          <strong>Keep private waitlist open</strong>
          <small>When off, the public waitlist URL shows a polite closed message and signups are rejected by the API.</small>
        </span>
      </label>
      <Textarea id="cancellation-policy" label="Cancellation policy" value={form.cancellationPolicy} onChange={update('cancellationPolicy')} placeholder="Describe your cancellation policy." />
      <Button type="submit" loading={saving}>Save settings</Button>
    </form>
  </>
}
