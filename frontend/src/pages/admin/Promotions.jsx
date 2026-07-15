import { Copy, Eye, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import Loader from '../../components/common/Loader'
import Modal from '../../components/common/Modal'
import PromotionModal from '../../components/promotions/PromotionModal'
import Checkbox from '../../components/forms/Checkbox'
import Input from '../../components/forms/Input'
import Select from '../../components/forms/Select'
import Textarea from '../../components/forms/Textarea'
import { getCategoryImage } from '../../data/allayImages'
import {
  createAdminPromotion,
  deleteAdminPromotion,
  duplicateAdminPromotion,
  getAdminPromotions,
  getAdminServiceCategories,
  setAdminPromotionStatus,
  updateAdminPromotion,
  uploadPromotionImage,
} from '../../services/adminApi'
import { getErrorMessage } from '../../utils/getErrorMessage'
import { validateImageFile } from '../../utils/imageValidation'

const ctaActionOptions = [
  { value: 'none', label: 'No button' },
  { value: 'internal_page', label: 'Open internal page' },
  { value: 'waitlist', label: 'Open waitlist' },
  { value: 'booking', label: 'Open booking' },
  { value: 'service', label: 'Open a selected service' },
  { value: 'external_url', label: 'Open external URL' },
  { value: 'close', label: 'Close promotion' },
]

const routeOptions = [
  { value: 'all', label: 'Entire public website' },
  { value: 'home', label: 'Homepage only' },
  { value: 'waitlist', label: 'Waitlist page' },
  { value: 'services', label: 'Service pages' },
  { value: 'booking', label: 'Booking page' },
]

const audienceOptions = [
  { value: 'all', label: 'Everyone' },
  { value: 'new', label: 'New visitors' },
  { value: 'returning', label: 'Returning visitors' },
  { value: 'guest', label: 'Guests (not signed in)' },
  { value: 'signed_in', label: 'Signed-in customers' },
]

const reloadFrequencyOptions = [
  { value: 'once_per_session', label: 'Once per session' },
  { value: 'cooldown', label: 'After cooldown period' },
  { value: 'every_reload', label: 'Every reload' },
]

const delayUnitOptions = [
  { value: 'seconds', label: 'Seconds' },
  { value: 'minutes', label: 'Minutes' },
]

const emptyForm = {
  internalName: '',
  heading: '',
  eyebrowText: '',
  message: '',
  ctaText: '',
  ctaAction: 'none',
  ctaTarget: '',
  secondaryCtaText: '',
  secondaryCtaAction: 'none',
  secondaryCtaTarget: '',
  images: [],
  priority: 0,
  startAt: '',
  endAt: '',
  isDismissible: true,
  autoplayImages: true,
  slideIntervalMs: 6000,
  triggerFirstVisit: true,
  triggerReturnVisit: false,
  returnAfterDays: 7,
  triggerAfterDelay: false,
  delayValue: 15,
  delayUnit: 'minutes',
  triggerOnReload: false,
  reloadFrequency: 'once_per_session',
  triggerAfterSignup: false,
  triggerAfterLogin: false,
  targetRoutes: ['all'],
  targetAudience: 'all',
  cooldownHours: 24,
  maxPerSession: 1,
  maxLifetimeImpressions: '',
  stopAfterDismissal: true,
  campaignVersion: 1,
}

function toDatetimeLocal(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const offsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function toIsoOrNull(localValue) {
  if (!localValue) return null
  const date = new Date(localValue)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function secondsToValueUnit(totalSeconds) {
  if (totalSeconds && totalSeconds % 60 === 0) return { value: totalSeconds / 60, unit: 'minutes' }
  return { value: totalSeconds || 0, unit: 'seconds' }
}

function promotionToForm(promotion) {
  const delay = secondsToValueUnit(promotion.delaySeconds ?? 900)
  return {
    internalName: promotion.internalName || '',
    heading: promotion.heading || '',
    eyebrowText: promotion.eyebrowText || '',
    message: promotion.message || '',
    ctaText: promotion.ctaText || '',
    ctaAction: promotion.ctaAction || 'none',
    ctaTarget: promotion.ctaTarget || '',
    secondaryCtaText: promotion.secondaryCtaText || '',
    secondaryCtaAction: promotion.secondaryCtaAction || 'none',
    secondaryCtaTarget: promotion.secondaryCtaTarget || '',
    images: promotion.images || [],
    priority: promotion.priority ?? 0,
    startAt: toDatetimeLocal(promotion.startAt),
    endAt: toDatetimeLocal(promotion.endAt),
    isDismissible: promotion.isDismissible !== false,
    autoplayImages: promotion.autoplayImages !== false,
    slideIntervalMs: promotion.slideIntervalMs ?? 6000,
    triggerFirstVisit: Boolean(promotion.triggerFirstVisit),
    triggerReturnVisit: Boolean(promotion.triggerReturnVisit),
    returnAfterDays: promotion.returnAfterDays ?? 7,
    triggerAfterDelay: Boolean(promotion.triggerAfterDelay),
    delayValue: delay.value,
    delayUnit: delay.unit,
    triggerOnReload: Boolean(promotion.triggerOnReload),
    reloadFrequency: promotion.reloadFrequency || 'once_per_session',
    triggerAfterSignup: Boolean(promotion.triggerAfterSignup),
    triggerAfterLogin: Boolean(promotion.triggerAfterLogin),
    targetRoutes: promotion.targetRoutes?.length ? promotion.targetRoutes : ['all'],
    targetAudience: promotion.targetAudience || 'all',
    cooldownHours: Math.round((promotion.cooldownSeconds ?? 86400) / 3600),
    maxPerSession: promotion.maxPerSession ?? 1,
    maxLifetimeImpressions: promotion.maxLifetimeImpressions ?? '',
    stopAfterDismissal: promotion.stopAfterDismissal !== false,
    campaignVersion: promotion.campaignVersion ?? 1,
  }
}

function formToPayload(form) {
  const customTypes = form.images.map((image) => image.type)
  const imageSourceType = !customTypes.length ? 'custom'
    : customTypes.every((type) => type === 'custom') ? 'custom'
      : customTypes.every((type) => type === 'category') ? 'category' : 'mixed'
  return {
    internalName: form.internalName,
    heading: form.heading,
    eyebrowText: form.eyebrowText,
    message: form.message,
    ctaText: form.ctaText,
    ctaAction: form.ctaAction,
    ctaTarget: form.ctaTarget,
    secondaryCtaText: form.secondaryCtaText,
    secondaryCtaAction: form.secondaryCtaAction,
    secondaryCtaTarget: form.secondaryCtaTarget,
    imageSourceType,
    images: form.images,
    priority: Number(form.priority) || 0,
    startAt: toIsoOrNull(form.startAt),
    endAt: toIsoOrNull(form.endAt),
    isDismissible: form.isDismissible,
    autoplayImages: form.autoplayImages,
    slideIntervalMs: Number(form.slideIntervalMs) || 6000,
    triggerFirstVisit: form.triggerFirstVisit,
    triggerReturnVisit: form.triggerReturnVisit,
    returnAfterDays: Number(form.returnAfterDays) || 7,
    triggerAfterDelay: form.triggerAfterDelay,
    delaySeconds: (Number(form.delayValue) || 0) * (form.delayUnit === 'minutes' ? 60 : 1),
    triggerOnReload: form.triggerOnReload,
    reloadFrequency: form.reloadFrequency,
    triggerAfterSignup: form.triggerAfterSignup,
    triggerAfterLogin: form.triggerAfterLogin,
    targetRoutes: form.targetRoutes.length ? form.targetRoutes : ['all'],
    targetAudience: form.targetAudience,
    cooldownSeconds: (Number(form.cooldownHours) || 0) * 3600,
    maxPerSession: Number(form.maxPerSession) || 0,
    maxLifetimeImpressions: form.maxLifetimeImpressions === '' ? null : Number(form.maxLifetimeImpressions),
    stopAfterDismissal: form.stopAfterDismissal,
    campaignVersion: Number(form.campaignVersion) || 1,
  }
}

function toggleRoute(current, value) {
  if (value === 'all') return ['all']
  const withoutAll = current.filter((route) => route !== 'all')
  if (withoutAll.includes(value)) {
    const next = withoutAll.filter((route) => route !== value)
    return next.length ? next : ['all']
  }
  return [...withoutAll, value]
}

export default function Promotions() {
  const [promotions, setPromotions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [previewing, setPreviewing] = useState(false)
  const [categoryToAdd, setCategoryToAdd] = useState('')

  const refresh = () => {
    setLoading(true)
    getAdminPromotions()
      .then((data) => setPromotions(data.promotions || []))
      .catch(() => toast.error('Could not load promotions.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
    getAdminServiceCategories().then((data) => setCategories(data.categories || [])).catch(() => {})
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (promotion) => {
    setEditing(promotion)
    setForm(promotionToForm(promotion))
    setFormOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setFormOpen(false)
    setEditing(null)
    setForm(emptyForm)
  }

  const update = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleRouteToggle = (value) => {
    setForm((current) => ({ ...current, targetRoutes: toggleRoute(current.targetRoutes, value) }))
  }

  const addCategoryImage = () => {
    if (!categoryToAdd) return
    if (form.images.some((image) => image.type === 'category' && image.categorySlug === categoryToAdd)) return
    setForm((current) => ({ ...current, images: [...current.images, { type: 'category', categorySlug: categoryToAdd }] }))
    setCategoryToAdd('')
  }

  const removeImage = (index) => {
    setForm((current) => ({ ...current, images: current.images.filter((_, imageIndex) => imageIndex !== index) }))
  }

  const handleCustomImageUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const validationError = validateImageFile(file)
    if (validationError) { toast.error(validationError); return }
    setUploadingImage(true)
    try {
      const uploaded = await uploadPromotionImage(file)
      setForm((current) => ({ ...current, images: [...current.images, { type: 'custom', url: uploaded.url, publicId: uploaded.publicId }] }))
    } catch (error) {
      toast.error(getErrorMessage(error, 'Image upload failed. Please try again.'))
    } finally {
      setUploadingImage(false)
    }
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const payload = formToPayload(form)
      if (editing) {
        await updateAdminPromotion(editing.id, payload)
        toast.success('Promotion updated.')
      } else {
        await createAdminPromotion(payload)
        toast.success('Promotion created as a draft.')
      }
      closeModal()
      refresh()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save promotion.'))
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (promotion, status) => {
    try {
      await setAdminPromotionStatus(promotion.id, status)
      toast.success(`Promotion ${status === 'active' ? 'activated' : status === 'paused' ? 'paused' : 'set to draft'}.`)
      refresh()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not change promotion status.'))
    }
  }

  const duplicate = async (promotion) => {
    try {
      await duplicateAdminPromotion(promotion.id)
      toast.success('Promotion duplicated as a draft.')
      refresh()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not duplicate promotion.'))
    }
  }

  const remove = async (promotion) => {
    if (!window.confirm(`Delete "${promotion.internalName}"? This cannot be undone.`)) return
    try {
      await deleteAdminPromotion(promotion.id)
      toast.success('Promotion deleted.')
      refresh()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete promotion.'))
    }
  }

  const previewPromotion = { ...form, isDismissible: true }

  return <>
    <div className="admin-page-heading">
      <div>
        <span className="eyebrow">Marketing</span>
        <h1>Website Promotions</h1>
        <p>Create and schedule modal campaigns — waitlist offers, discounts, announcements — shown to visitors on the public site.</p>
      </div>
      <Button onClick={openCreate}>New promotion</Button>
    </div>

    <section className="admin-panel">
      {loading ? <Loader label="Loading promotions" /> : !promotions.length ? <EmptyState title="No promotions yet" message="Create your first campaign for the public website." action={<Button onClick={openCreate}>New promotion</Button>} /> : <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Schedule</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {promotions.map((promotion) => <tr key={promotion.id}>
              <td><span className="admin-service-name">{promotion.internalName}<small>{promotion.heading}</small></span></td>
              <td><Badge status={
                promotion.effectiveStatus === 'active' ? 'paid'
                  : promotion.effectiveStatus === 'scheduled' ? 'pending'
                    : promotion.effectiveStatus === 'paused' ? 'paused'
                      : promotion.effectiveStatus === 'expired' ? 'cancelled' : 'draft'
              }>{promotion.effectiveStatus}</Badge></td>
              <td>{promotion.priority}</td>
              <td>{promotion.startAt ? new Date(promotion.startAt).toLocaleDateString() : 'Anytime'} – {promotion.endAt ? new Date(promotion.endAt).toLocaleDateString() : 'No end'}</td>
              <td><span className="admin-row-actions">
                {promotion.status === 'active'
                  ? <Button size="sm" variant="outline" onClick={() => changeStatus(promotion, 'paused')}>Pause</Button>
                  : <Button size="sm" variant="outline" onClick={() => changeStatus(promotion, 'active')}>Activate</Button>}
                <Button size="sm" variant="outline" onClick={() => openEdit(promotion)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => duplicate(promotion)}><Copy size={14} /></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(promotion)}>Delete</Button>
              </span></td>
            </tr>)}
          </tbody>
        </table>
      </div>}
    </section>

    <Modal open={formOpen} onClose={closeModal} title={editing ? 'Edit promotion' : 'New promotion'}>
      <form className="admin-service-form" onSubmit={save}>
        <Input id="promo-internal-name" label="Internal campaign name" required value={form.internalName} onChange={update('internalName')} helper="Admin-only label, not shown publicly." />

        <div className="admin-form-grid">
          <Input id="promo-heading" label="Public heading" required value={form.heading} onChange={update('heading')} />
          <Input id="promo-eyebrow" label="Eyebrow / label (optional)" value={form.eyebrowText} onChange={update('eyebrowText')} />
        </div>
        <Textarea id="promo-message" label="Supporting message" rows={3} value={form.message} onChange={update('message')} />

        <div className="admin-form-grid">
          <Input id="promo-cta-text" label="CTA button text" value={form.ctaText} onChange={update('ctaText')} placeholder="Join the waitlist" />
          <Select id="promo-cta-action" label="CTA action" options={ctaActionOptions} value={form.ctaAction} onChange={update('ctaAction')} />
        </div>
        <Input id="promo-cta-target" label="CTA destination" value={form.ctaTarget} onChange={update('ctaTarget')} helper="Path (/waitlist), service slug, or full https:// URL depending on the action above." />

        <div className="admin-form-grid">
          <Input id="promo-cta2-text" label="Secondary CTA text (optional)" value={form.secondaryCtaText} onChange={update('secondaryCtaText')} />
          <Select id="promo-cta2-action" label="Secondary CTA action" options={ctaActionOptions} value={form.secondaryCtaAction} onChange={update('secondaryCtaAction')} />
        </div>
        {form.secondaryCtaAction !== 'none' && <Input id="promo-cta2-target" label="Secondary CTA destination" value={form.secondaryCtaTarget} onChange={update('secondaryCtaTarget')} />}

        <div className="form-group">
          <label>Images</label>
          <div className="promo-image-grid">
            {form.images.map((image, index) => <div className="promo-image-grid__item" key={`${image.type}-${image.categorySlug || image.url}-${index}`}>
              <img src={image.type === 'category' ? getCategoryImage(image.categorySlug) : image.url} alt="" />
              <button type="button" onClick={() => removeImage(index)} aria-label="Remove image"><X size={14} /></button>
              <small>{image.type === 'category' ? image.categorySlug : 'uploaded'}</small>
            </div>)}
          </div>
          <div className="admin-form-grid">
            <div className="form-group">
              <select value={categoryToAdd} onChange={(event) => setCategoryToAdd(event.target.value)}>
                <option value="">Add a category image…</option>
                {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
              </select>
              <Button type="button" size="sm" variant="outline" onClick={addCategoryImage} disabled={!categoryToAdd}>Add category image</Button>
            </div>
            <label className="admin-file-control" htmlFor="promo-image-file">
              <span>Upload a custom image</span>
              <input id="promo-image-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleCustomImageUpload} disabled={uploadingImage} />
              <small>{uploadingImage ? 'Uploading…' : 'JPG, PNG, or WebP under 5MB.'}</small>
            </label>
          </div>
        </div>

        <div className="admin-form-grid">
          <Input id="promo-priority" label="Priority (higher wins ties)" type="number" min="0" value={form.priority} onChange={update('priority')} />
          <Input id="promo-campaign-version" label="Campaign version" type="number" min="1" value={form.campaignVersion} onChange={update('campaignVersion')} helper="Bump this to re-show visitors who already dismissed it." />
        </div>
        <div className="admin-form-grid">
          <Input id="promo-start" label="Start date/time (optional)" type="datetime-local" value={form.startAt} onChange={update('startAt')} />
          <Input id="promo-end" label="End date/time (optional)" type="datetime-local" value={form.endAt} onChange={update('endAt')} />
        </div>

        <div className="admin-toggle-pair">
          <Checkbox id="promo-dismissible" label="Visitors can dismiss it" checked={form.isDismissible} onChange={update('isDismissible')} />
          <Checkbox id="promo-autoplay" label="Autoplay images" checked={form.autoplayImages} onChange={update('autoplayImages')} />
        </div>
        <Input id="promo-slide-interval" label="Slide interval (ms)" type="number" min="2000" step="500" value={form.slideIntervalMs} onChange={update('slideIntervalMs')} />

        <div className="form-group"><label>Trigger rules</label></div>
        <div className="admin-toggle-pair">
          <Checkbox id="promo-trigger-first" label="First website visit" checked={form.triggerFirstVisit} onChange={update('triggerFirstVisit')} />
          <Checkbox id="promo-trigger-return" label="Return after inactivity" checked={form.triggerReturnVisit} onChange={update('triggerReturnVisit')} />
        </div>
        {form.triggerReturnVisit && <Input id="promo-return-days" label="Return after (days)" type="number" min="1" value={form.returnAfterDays} onChange={update('returnAfterDays')} />}

        <div className="admin-toggle-pair">
          <Checkbox id="promo-trigger-delay" label="Delayed appearance" checked={form.triggerAfterDelay} onChange={update('triggerAfterDelay')} />
          <Checkbox id="promo-trigger-reload" label="On page reload" checked={form.triggerOnReload} onChange={update('triggerOnReload')} />
        </div>
        {form.triggerAfterDelay && <div className="admin-form-grid">
          <Input id="promo-delay-value" label="Delay value" type="number" min="0" value={form.delayValue} onChange={update('delayValue')} />
          <Select id="promo-delay-unit" label="Delay unit" options={delayUnitOptions} value={form.delayUnit} onChange={update('delayUnit')} />
        </div>}
        {form.triggerOnReload && <Select id="promo-reload-frequency" label="Reload frequency" options={reloadFrequencyOptions} value={form.reloadFrequency} onChange={update('reloadFrequency')} />}

        <div className="admin-toggle-pair">
          <Checkbox id="promo-trigger-signup" label="After successful signup" checked={form.triggerAfterSignup} onChange={update('triggerAfterSignup')} />
          <Checkbox id="promo-trigger-login" label="After successful login" checked={form.triggerAfterLogin} onChange={update('triggerAfterLogin')} />
        </div>

        <div className="form-group">
          <label>Page targeting</label>
          <div className="admin-toggle-pair">
            {routeOptions.map((route) => <Checkbox key={route.value} id={`promo-route-${route.value}`} label={route.label} checked={form.targetRoutes.includes(route.value)} onChange={() => handleRouteToggle(route.value)} />)}
          </div>
        </div>
        <Select id="promo-audience" label="Audience" options={audienceOptions} value={form.targetAudience} onChange={update('targetAudience')} />

        <div className="form-group"><label>Frequency control</label></div>
        <div className="admin-form-grid">
          <Input id="promo-cooldown" label="Cooldown (hours)" type="number" min="0" value={form.cooldownHours} onChange={update('cooldownHours')} />
          <Input id="promo-max-session" label="Max impressions per session" type="number" min="0" value={form.maxPerSession} onChange={update('maxPerSession')} />
        </div>
        <Input id="promo-max-lifetime" label="Max lifetime impressions (optional)" type="number" min="0" value={form.maxLifetimeImpressions} onChange={update('maxLifetimeImpressions')} helper="Leave blank for unlimited." />
        <Checkbox id="promo-stop-after-dismiss" label="Do not show again after dismissal" checked={form.stopAfterDismissal} onChange={update('stopAfterDismissal')} />

        <div className="admin-modal-actions">
          <Button type="button" variant="ghost" onClick={() => setPreviewing(true)} disabled={!form.heading}><Eye size={15} /> Preview</Button>
          <Button type="button" variant="secondary" onClick={closeModal} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving}>{editing ? 'Save promotion' : 'Create draft'}</Button>
        </div>
      </form>
    </Modal>

    {previewing && <PromotionModal promotion={previewPromotion} onClose={() => setPreviewing(false)} previewOnly />}
  </>
}
