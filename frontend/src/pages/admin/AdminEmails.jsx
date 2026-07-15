import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import Loader from '../../components/common/Loader'
import Modal from '../../components/common/Modal'
import Checkbox from '../../components/forms/Checkbox'
import Input from '../../components/forms/Input'
import Select from '../../components/forms/Select'
import Textarea from '../../components/forms/Textarea'
import {
  getEmailCampaigns,
  getEmailRecipients,
  previewCampaignEmail,
  previewWaitlistCouponEmail,
  sendCampaignEmail,
  sendTestCampaignEmail,
  sendWaitlistCouponTest,
  uploadCampaignImage,
} from '../../services/adminApi'
import { getErrorMessage } from '../../utils/getErrorMessage'
import { validateImageFile } from '../../utils/imageValidation'

const emailTypeOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'coupon', label: 'Coupon' },
]

const audienceOptions = [
  { value: 'all_users', label: 'All registered users' },
  { value: 'all_waitlist', label: 'All waitlist members' },
  { value: 'selected_users', label: 'Selected registered users' },
  { value: 'selected_waitlist', label: 'Selected waitlist members' },
  { value: 'manual', label: 'Manually entered addresses' },
]

const replyModeOptions = [
  { value: 'default', label: 'Use default reply address' },
  { value: 'custom', label: 'Use a custom reply address' },
  { value: 'none', label: 'No replies' },
]

const statusToBadge = { completed: 'paid', sending: 'pending', failed: 'cancelled', draft: 'unpaid' }

const emptyForm = {
  emailType: 'standard',
  subject: '',
  preheader: '',
  heading: '',
  bodyText: '',
  imageUrl: '',
  imageAlt: '',
  ctaLabel: '',
  ctaUrl: '',
  audienceType: 'all_waitlist',
  manualEmails: '',
  replyMode: 'default',
  replyTo: '',
  supportEnabled: true,
}

function newIdempotencyKey() {
  return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function AdminEmails() {
  const [form, setForm] = useState(emptyForm)
  const [selectedRecipients, setSelectedRecipients] = useState([])
  const [recipientSearch, setRecipientSearch] = useState('')
  const [recipientResults, setRecipientResults] = useState([])
  const [searchingRecipients, setSearchingRecipients] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [preview, setPreview] = useState(null)
  const [previewWidth, setPreviewWidth] = useState('desktop')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [testAddresses, setTestAddresses] = useState('')
  const [testSending, setTestSending] = useState(false)
  const [sending, setSending] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey)
  const [campaigns, setCampaigns] = useState([])
  const [campaignsLoading, setCampaignsLoading] = useState(true)

  const [wcWaitlistId, setWcWaitlistId] = useState('')
  const [wcPreview, setWcPreview] = useState(null)
  const [wcPreviewLoading, setWcPreviewLoading] = useState(false)
  const [wcSending, setWcSending] = useState(false)

  const refreshCampaigns = () => {
    setCampaignsLoading(true)
    getEmailCampaigns()
      .then((data) => setCampaigns(data.campaigns || []))
      .catch(() => toast.error('Could not load campaign history.'))
      .finally(() => setCampaignsLoading(false))
  }

  useEffect(() => { refreshCampaigns() }, [])

  useEffect(() => {
    if (form.audienceType !== 'selected_users' && form.audienceType !== 'selected_waitlist') { setRecipientResults([]); return undefined }
    if (!recipientSearch.trim()) { setRecipientResults([]); return undefined }
    const type = form.audienceType === 'selected_waitlist' ? 'waitlist' : 'users'
    setSearchingRecipients(true)
    const handle = setTimeout(() => {
      getEmailRecipients({ type, search: recipientSearch.trim() })
        .then((data) => setRecipientResults(data.recipients || []))
        .catch(() => {})
        .finally(() => setSearchingRecipients(false))
    }, 300)
    return () => clearTimeout(handle)
  }, [recipientSearch, form.audienceType])

  const update = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((current) => ({ ...current, [field]: value }))
  }

  const addRecipient = (recipient) => {
    setSelectedRecipients((current) => (current.some((item) => item.id === recipient.id) ? current : [...current, recipient]))
    setRecipientSearch('')
    setRecipientResults([])
  }

  const removeRecipient = (id) => setSelectedRecipients((current) => current.filter((item) => item.id !== id))

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const validationError = validateImageFile(file)
    if (validationError) { toast.error(validationError); return }
    setUploadingImage(true)
    try {
      const uploaded = await uploadCampaignImage(file)
      setForm((current) => ({ ...current, imageUrl: uploaded.url }))
      toast.success('Image uploaded.')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Image upload failed. Please try again.'))
    } finally {
      setUploadingImage(false)
    }
  }

  const buildPayload = () => ({
    ...form,
    selectedUserIds: form.audienceType === 'selected_users' ? selectedRecipients.map((item) => item.id) : [],
    selectedWaitlistIds: form.audienceType === 'selected_waitlist' ? selectedRecipients.map((item) => item.id) : [],
  })

  const runPreview = () => {
    setPreviewLoading(true)
    previewCampaignEmail(buildPayload())
      .then((data) => setPreview(data.preview))
      .catch((error) => toast.error(getErrorMessage(error, 'Could not render preview.')))
      .finally(() => setPreviewLoading(false))
  }

  const runTestSend = () => {
    if (!testAddresses.trim()) { toast.error('Enter at least one test email address.'); return }
    setTestSending(true)
    sendTestCampaignEmail({ ...buildPayload(), testAddresses })
      .then((data) => {
        const succeeded = data.results.filter((item) => item.sent).map((item) => item.email)
        const failed = data.results.filter((item) => !item.sent).map((item) => item.email)
        if (succeeded.length) toast.success(`Test sent to: ${succeeded.join(', ')}`)
        if (failed.length) toast.error(`Failed for: ${failed.join(', ')}`)
      })
      .catch((error) => toast.error(getErrorMessage(error, 'Could not send test email.')))
      .finally(() => setTestSending(false))
  }

  const recipientCountLabel = () => {
    if (form.audienceType === 'selected_users' || form.audienceType === 'selected_waitlist') return `${selectedRecipients.length} selected`
    if (form.audienceType === 'manual') return `${form.manualEmails.split(/[,\n]/).map((value) => value.trim()).filter(Boolean).length} entered`
    return form.audienceType === 'all_users' ? 'All registered users' : 'All waitlist members'
  }

  const confirmAndSend = () => {
    if (!form.subject.trim() || !form.bodyText.trim()) { toast.error('Enter a subject and body before sending.'); return }
    if ((form.audienceType === 'selected_users' || form.audienceType === 'selected_waitlist') && !selectedRecipients.length) { toast.error('Select at least one recipient.'); return }
    if (form.audienceType === 'manual' && !form.manualEmails.trim()) { toast.error('Enter at least one email address.'); return }
    if (form.replyMode === 'custom' && !form.replyTo.trim()) { toast.error('Enter a custom reply-to address.'); return }
    if (Boolean(form.ctaLabel) !== Boolean(form.ctaUrl)) { toast.error('Provide both a button label and URL, or leave both blank.'); return }
    setConfirmOpen(true)
  }

  const sendNow = () => {
    setSending(true)
    sendCampaignEmail({ ...buildPayload(), idempotencyKey })
      .then((data) => {
        if (data.duplicate) toast('This campaign was already sent.')
        else toast.success(`Campaign sent: ${data.sent} sent, ${data.failed} failed of ${data.totalRecipients}.`)
        setConfirmOpen(false)
        setIdempotencyKey(newIdempotencyKey())
        refreshCampaigns()
      })
      .catch((error) => toast.error(getErrorMessage(error, 'Could not send campaign.')))
      .finally(() => setSending(false))
  }

  const runWaitlistCouponPreview = () => {
    setWcPreviewLoading(true)
    previewWaitlistCouponEmail({ waitlistEntryId: wcWaitlistId || undefined })
      .then((data) => setWcPreview(data.preview))
      .catch((error) => toast.error(getErrorMessage(error, 'Could not render preview.')))
      .finally(() => setWcPreviewLoading(false))
  }

  const runWaitlistCouponTest = () => {
    setWcSending(true)
    sendWaitlistCouponTest({ waitlistEntryId: wcWaitlistId || undefined })
      .then((data) => {
        const succeeded = data.results.filter((item) => item.sent).map((item) => item.email)
        const failed = data.results.filter((item) => !item.sent).map((item) => item.email)
        if (succeeded.length) toast.success(`Sent to: ${succeeded.join(', ')}`)
        if (failed.length) toast.error(`Failed for: ${failed.join(', ')}`)
      })
      .catch((error) => toast.error(getErrorMessage(error, 'Could not send waitlist coupon test.')))
      .finally(() => setWcSending(false))
  }

  return <>
    <div className="admin-page-heading">
      <div><span className="eyebrow">Outgoing mail</span><h1>Emails</h1><p>Compose and send announcements, promotions, and coupon emails to registered users or waitlist members.</p></div>
    </div>

    <section className="admin-panel">
      <header><h2>Compose</h2></header>
      <div className="admin-form-grid">
        <Select id="email-type" label="Email type" options={emailTypeOptions} value={form.emailType} onChange={update('emailType')} />
        <Select id="email-audience" label="Audience" options={audienceOptions} value={form.audienceType} onChange={update('audienceType')} />
      </div>

      {(form.audienceType === 'selected_users' || form.audienceType === 'selected_waitlist') && <div className="admin-email-recipient-picker">
        <Input id="recipient-search" label={`Search ${form.audienceType === 'selected_waitlist' ? 'waitlist members' : 'registered users'}`} value={recipientSearch} onChange={(event) => setRecipientSearch(event.target.value)} placeholder="Search by name or email" />
        {recipientSearch && <div className="admin-email-recipient-results">
          {searchingRecipients
            ? <Loader label="Searching" />
            : recipientResults.length
              ? recipientResults.map((recipient) => <button type="button" key={recipient.id} onClick={() => addRecipient(recipient)}><strong>{recipient.name || 'Unnamed'}</strong><small>{recipient.email}</small></button>)
              : <p style={{ padding: '10px 14px', fontSize: 12 }}>No matches.</p>}
        </div>}
        <div className="admin-email-chip-list">
          {selectedRecipients.map((recipient) => <span className="admin-email-chip" key={recipient.id}>{recipient.name || recipient.email}<button type="button" onClick={() => removeRecipient(recipient.id)} aria-label="Remove recipient">&times;</button></span>)}
        </div>
      </div>}

      {form.audienceType === 'manual' && <Textarea id="manual-emails" label="Recipient addresses" helper="Comma or newline separated. Duplicates and invalid addresses are removed automatically." rows={3} value={form.manualEmails} onChange={update('manualEmails')} />}

      <Input id="email-subject" label="Subject" required maxLength={150} value={form.subject} onChange={update('subject')} />
      <small className="admin-email-char-count">{form.subject.length}/150</small>
      <Input id="email-preheader" label="Preheader (optional)" maxLength={150} value={form.preheader} onChange={update('preheader')} helper="Hidden inbox preview text." />
      <Input id="email-heading" label="Heading (optional)" value={form.heading} onChange={update('heading')} />
      <Textarea id="email-body" label="Body" required rows={8} value={form.bodyText} onChange={update('bodyText')} helper="Plain text. Blank lines start a new paragraph." />

      <div className="form-group">
        <label>Image (optional)</label>
        {form.imageUrl && <div style={{ maxWidth: 220, marginBottom: 10 }}><img src={form.imageUrl} alt={form.imageAlt || ''} style={{ width: '100%', borderRadius: 10 }} /></div>}
        <label className="admin-file-control" htmlFor="email-image-file">
          <span>{form.imageUrl ? 'Replace image' : 'Upload an image'}</span>
          <input id="email-image-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageUpload} disabled={uploadingImage} />
          <small>{uploadingImage ? 'Uploading…' : 'JPG, PNG, or WebP under 5MB.'}</small>
        </label>
        {form.imageUrl && <>
          <Input id="email-image-alt" label="Image alt text" value={form.imageAlt} onChange={update('imageAlt')} />
          <Button type="button" variant="ghost" size="sm" onClick={() => setForm((current) => ({ ...current, imageUrl: '', imageAlt: '' }))}>Remove image</Button>
        </>}
      </div>

      <div className="admin-form-grid">
        <Input id="email-cta-label" label="Button label (optional)" value={form.ctaLabel} onChange={update('ctaLabel')} />
        <Input id="email-cta-url" label="Button URL (optional)" value={form.ctaUrl} onChange={update('ctaUrl')} placeholder="https://" />
      </div>

      <div className="admin-form-grid">
        <Select id="email-reply-mode" label="Replies" options={replyModeOptions} value={form.replyMode} onChange={update('replyMode')} />
        {form.replyMode === 'custom' && <Input id="email-reply-to" label="Custom reply-to address" type="email" value={form.replyTo} onChange={update('replyTo')} />}
      </div>
      {form.replyMode === 'none' && <p style={{ fontSize: 11, color: 'var(--color-text-soft)' }}>Recipients will see a note that this message cannot be replied to.</p>}
      <Checkbox id="email-support-enabled" label="Show a support contact link in the footer" checked={form.supportEnabled} onChange={update('supportEnabled')} />

      <div className="admin-modal-actions">
        <Button type="button" variant="outline" onClick={runPreview} loading={previewLoading}>Preview</Button>
        <Button type="button" variant="secondary" onClick={confirmAndSend}>Review &amp; send</Button>
      </div>

      <div className="admin-form-grid" style={{ marginTop: 20 }}>
        <Input id="email-test-addresses" label="Send test to" placeholder="you@example.com, teammate@example.com" value={testAddresses} onChange={(event) => setTestAddresses(event.target.value)} />
        <div style={{ display: 'flex', alignItems: 'flex-end' }}><Button type="button" variant="outline" onClick={runTestSend} loading={testSending}>Send test</Button></div>
      </div>

      {preview && <div style={{ marginTop: 20 }}>
        <div className="admin-email-preview-toggle">
          <button type="button" className={previewWidth === 'desktop' ? 'is-active' : ''} onClick={() => setPreviewWidth('desktop')}>Desktop</button>
          <button type="button" className={previewWidth === 'mobile' ? 'is-active' : ''} onClick={() => setPreviewWidth('mobile')}>Mobile (320px)</button>
        </div>
        <div className="admin-email-preview-frame-wrap">
          <iframe title="Email preview" sandbox="" srcDoc={preview.html} className={`admin-email-preview-frame ${previewWidth === 'mobile' ? 'is-mobile' : ''}`} />
        </div>
      </div>}
    </section>

    <section className="admin-panel">
      <header><h2>Waitlist coupon test</h2></header>
      <p>Preview or send the production waitlist coupon template using sample data, or a real waitlist member&apos;s name and selected services, without creating a real coupon or changing waitlist status.</p>
      <Input id="wc-waitlist-id" label="Waitlist entry ID (optional)" helper="Leave blank to use safe sample data." value={wcWaitlistId} onChange={(event) => setWcWaitlistId(event.target.value)} />
      <div className="admin-modal-actions">
        <Button type="button" variant="outline" onClick={runWaitlistCouponPreview} loading={wcPreviewLoading}>Preview</Button>
        <Button type="button" onClick={runWaitlistCouponTest} loading={wcSending}>Send to test recipients</Button>
      </div>
      {wcPreview && <div className="admin-email-preview-frame-wrap" style={{ marginTop: 16 }}>
        <iframe title="Waitlist coupon preview" sandbox="" srcDoc={wcPreview.html} className="admin-email-preview-frame" />
      </div>}
    </section>

    <section className="admin-panel">
      <header><h2>Campaign history</h2></header>
      {campaignsLoading
        ? <Loader label="Loading campaigns" />
        : !campaigns.length
          ? <EmptyState title="No campaigns sent yet" message="Sent campaigns will appear here." />
          : <div className="table-wrap"><table><thead><tr><th>Subject</th><th>Type</th><th>Audience</th><th>Status</th><th>Sent / Failed</th><th>Date</th></tr></thead><tbody>{campaigns.map((campaign) => <tr key={campaign.id}>
              <td>{campaign.subject}</td>
              <td>{campaign.email_type}</td>
              <td>{campaign.audience_type}</td>
              <td><Badge status={statusToBadge[campaign.status] || 'unpaid'}>{campaign.status}</Badge></td>
              <td>{campaign.sent_count} / {campaign.failed_count}</td>
              <td>{new Date(campaign.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
            </tr>)}</tbody></table></div>}
    </section>

    <Modal open={confirmOpen} onClose={() => !sending && setConfirmOpen(false)} title="Confirm campaign send">
      <ul className="admin-email-summary-list">
        <li><span>Subject</span><strong>{form.subject}</strong></li>
        <li><span>Email type</span><strong>{emailTypeOptions.find((option) => option.value === form.emailType)?.label}</strong></li>
        <li><span>Audience</span><strong>{recipientCountLabel()}</strong></li>
        <li><span>Replies</span><strong>{replyModeOptions.find((option) => option.value === form.replyMode)?.label}</strong></li>
      </ul>
      <div className="admin-modal-actions">
        <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)} disabled={sending}>Cancel</Button>
        <Button type="button" onClick={sendNow} loading={sending}>Confirm and send</Button>
      </div>
    </Modal>
  </>
}
