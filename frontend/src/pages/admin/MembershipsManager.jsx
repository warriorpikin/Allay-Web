import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import Loader from '../../components/common/Loader'
import Modal from '../../components/common/Modal'
import Input from '../../components/forms/Input'
import Textarea from '../../components/forms/Textarea'
import {
  createAdminMembership,
  deleteAdminMembership,
  getAdminMemberships,
  updateAdminMembership,
} from '../../services/adminApi'
import { formatCurrency } from '../../utils/formatCurrency'
import { getErrorMessage } from '../../utils/getErrorMessage'
import { validateImageFile } from '../../utils/imageValidation'

const emptyForm = {
  name: '',
  slug: '',
  tagline: '',
  monthlyPrice: 0,
  description: '',
  benefits: '',
  displayOrder: 0,
  isActive: true,
  isFeatured: false,
  seoTitle: '',
  seoDescription: '',
  terms: '',
  imageUrl: '',
}

function membershipToForm(membership) {
  return {
    name: membership.name || '',
    slug: membership.slug || '',
    tagline: membership.tagline || '',
    monthlyPrice: membership.monthlyPrice || 0,
    description: membership.description || '',
    benefits: (membership.benefits || []).join('\n'),
    displayOrder: membership.displayOrder || 0,
    isActive: Boolean(membership.isActive),
    isFeatured: Boolean(membership.isFeatured),
    seoTitle: membership.seoTitle || '',
    seoDescription: membership.seoDescription || '',
    terms: membership.terms || '',
    imageUrl: membership.imageUrl || '',
  }
}

function buildMembershipFormData(form, imageFile) {
  const data = new FormData()
  for (const [key, value] of Object.entries(form)) data.append(key, value)
  if (imageFile) data.append('image', imageFile)
  return data
}

export default function MembershipsManager() {
  const [memberships, setMemberships] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingMembership, setEditingMembership] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  const refresh = () => {
    setLoading(true)
    getAdminMemberships()
      .then((data) => setMemberships(data.memberships || []))
      .catch(() => toast.error('Could not load memberships.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [])

  useEffect(() => () => {
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
  }, [imagePreview])

  const openCreate = () => {
    setEditingMembership(null)
    setForm(emptyForm)
    setImageFile(null)
    setImagePreview('')
    setFormOpen(true)
  }

  const openEdit = (membership) => {
    setEditingMembership(membership)
    setForm(membershipToForm(membership))
    setImageFile(null)
    setImagePreview(membership.image || '')
    setFormOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setFormOpen(false)
    setEditingMembership(null)
    setForm(emptyForm)
    setImageFile(null)
    setImagePreview('')
  }

  const update = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleImageChange = (event) => {
    const nextFile = event.target.files?.[0] || null
    if (!nextFile) {
      setImageFile(null)
      return
    }
    const validationError = validateImageFile(nextFile)
    if (validationError) {
      event.target.value = ''
      toast.error(validationError)
      return
    }
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
    setImageFile(nextFile)
    setImagePreview(URL.createObjectURL(nextFile))
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const payload = buildMembershipFormData({
        ...form,
        monthlyPrice: String(Number(form.monthlyPrice)),
        displayOrder: String(Number(form.displayOrder)),
      }, imageFile)
      if (editingMembership) {
        await updateAdminMembership(editingMembership.id, payload)
        toast.success('Membership updated.')
      } else {
        await createAdminMembership(payload)
        toast.success('Membership added.')
      }
      if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
      closeModal()
      refresh()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save membership.'))
    } finally {
      setSaving(false)
    }
  }

  const deactivate = async (membership) => {
    if (!window.confirm(`Set ${membership.name} to inactive? It will be hidden from the public memberships page.`)) return
    try {
      await deleteAdminMembership(membership.id)
      toast.success('Membership set inactive.')
      refresh()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update membership.'))
    }
  }

  return <>
    <div className="admin-page-heading">
      <div>
        <span className="eyebrow">Membership plans</span>
        <h1>Memberships</h1>
        <p>Create and manage the monthly Allay House membership plans and their benefits.</p>
      </div>
      <Button onClick={openCreate}>Add membership</Button>
    </div>

    <section className="admin-panel">
      {loading ? <Loader label="Loading memberships" /> : !memberships.length ? <EmptyState title="No memberships yet" message="Create the first Allay House membership plan." action={<Button onClick={openCreate}>Add membership</Button>} /> : <div className="table-wrap">
        <table>
          <thead><tr><th>Plan</th><th>Monthly price</th><th>Benefits</th><th>Order</th><th>Featured</th><th>Status</th><th /></tr></thead>
          <tbody>
            {memberships.map((membership) => <tr key={membership.id}>
              <td><span className="admin-service-name">{membership.name}<small>{membership.slug}</small></span></td>
              <td>{formatCurrency(membership.monthlyPrice)}</td>
              <td>{membership.benefits?.length || 0}</td>
              <td>{membership.displayOrder}</td>
              <td><Badge status={membership.isFeatured ? 'paid' : 'unpaid'}>{membership.isFeatured ? 'Featured' : '-'}</Badge></td>
              <td><Badge status={membership.isActive ? 'paid' : 'cancelled'}>{membership.isActive ? 'Active' : 'Inactive'}</Badge></td>
              <td><span className="admin-row-actions"><Button size="sm" variant="outline" onClick={() => openEdit(membership)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => deactivate(membership)}>Deactivate</Button></span></td>
            </tr>)}
          </tbody>
        </table>
      </div>}
    </section>

    <Modal open={formOpen} onClose={closeModal} title={editingMembership ? 'Edit membership' : 'Add membership'}>
      <form className="admin-service-form" onSubmit={save}>
        <Input id="membership-name" label="Name" required value={form.name} onChange={update('name')} />
        <Input id="membership-slug" label="Slug" value={form.slug} onChange={update('slug')} helper="Leave blank on new plans to generate one from the name." />
        <Input id="membership-tagline" label="Tagline" value={form.tagline} onChange={update('tagline')} />
        <Textarea id="membership-description" label="Description" rows={3} value={form.description} onChange={update('description')} />
        <Textarea id="membership-benefits" label="Benefits (one per line)" rows={8} value={form.benefits} onChange={update('benefits')} />
        <Textarea id="membership-terms" label="Terms" rows={3} value={form.terms} onChange={update('terms')} />

        <div className="admin-form-grid">
          <Input id="membership-price" label="Monthly price (₦)" type="number" min="0" step="1000" required value={form.monthlyPrice} onChange={update('monthlyPrice')} />
          <Input id="membership-order" label="Display order" type="number" min="0" value={form.displayOrder} onChange={update('displayOrder')} />
        </div>

        {imagePreview && <div className="admin-image-preview"><img src={imagePreview} alt="" /><span>Current membership image</span></div>}
        <input type="hidden" value={form.imageUrl} name="imageUrl" readOnly />
        <label className="admin-file-control" htmlFor="membership-image-file">
          <span>{imagePreview ? 'Replace image from device' : 'Upload image from device'}</span>
          <input id="membership-image-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} />
          <small>{imageFile ? imageFile.name : 'Optional JPG, PNG, or WebP under 5MB.'}</small>
        </label>

        <fieldset className="admin-form-fieldset">
          <legend>SEO (optional)</legend>
          <Input id="membership-seo-title" label="SEO title" value={form.seoTitle} onChange={update('seoTitle')} />
          <Textarea id="membership-seo-description" label="SEO description" rows={2} value={form.seoDescription} onChange={update('seoDescription')} />
        </fieldset>

        <div className="admin-toggle-pair">
          <label><input type="checkbox" checked={form.isActive} onChange={update('isActive')} /> Active on public site</label>
          <label><input type="checkbox" checked={form.isFeatured} onChange={update('isFeatured')} /> Featured / most popular</label>
        </div>
        <div className="admin-modal-actions">
          <Button type="button" variant="secondary" onClick={closeModal} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving}>{editingMembership ? 'Save membership' : 'Create membership'}</Button>
        </div>
      </form>
    </Modal>
  </>
}
