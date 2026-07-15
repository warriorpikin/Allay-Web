import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import Loader from '../../components/common/Loader'
import Modal from '../../components/common/Modal'
import Input from '../../components/forms/Input'
import Select from '../../components/forms/Select'
import Textarea from '../../components/forms/Textarea'
import {
  createAdminService,
  deleteAdminService,
  getAdminServiceCategories,
  getAdminServices,
  updateAdminService,
} from '../../services/adminApi'
import { formatCurrency } from '../../utils/formatCurrency'
import { getErrorMessage } from '../../utils/getErrorMessage'
import { validateImageFile } from '../../utils/imageValidation'

const emptyForm = {
  categoryId: '',
  name: '',
  slug: '',
  description: '',
  durationMinutes: 60,
  price: 0,
  imageUrl: '',
  isActive: true,
  bookable: true,
  isDiscountEligible: true,
  simultaneousCapacity: 7,
  displayOrder: 0,
}

function serviceToForm(service) {
  return {
    categoryId: service.categoryId || '',
    name: service.name || '',
    slug: service.slug || '',
    description: service.description || '',
    durationMinutes: service.durationMinutes || 60,
    price: service.price || 0,
    imageUrl: service.imageUrl || service.localImagePath || '',
    isActive: Boolean(service.isActive),
    bookable: service.bookable !== false,
    isDiscountEligible: Boolean(service.isDiscountEligible),
    simultaneousCapacity: service.simultaneousCapacity || 7,
    displayOrder: service.displayOrder || 0,
  }
}

function buildServiceFormData(form, imageFile) {
  const data = new FormData()
  for (const [key, value] of Object.entries(form)) data.append(key, value)
  if (imageFile) data.append('image', imageFile)
  return data
}

export default function ServicesManager() {
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: `${category.name}${category.isActive ? '' : ' (inactive)'}` })),
    [categories],
  )

  const refresh = () => {
    setLoading(true)
    Promise.all([getAdminServices(), getAdminServiceCategories()])
      .then(([serviceData, categoryData]) => {
        setServices(serviceData.services || [])
        setCategories(categoryData.categories || [])
      })
      .catch(() => toast.error('Could not load services.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [])

  useEffect(() => () => {
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
  }, [imagePreview])

  const openCreate = () => {
    setEditingService(null)
    setForm(emptyForm)
    setImageFile(null)
    setImagePreview('')
    setFormOpen(true)
  }

  const openEdit = (service) => {
    setEditingService(service)
    setForm(serviceToForm(service))
    setImageFile(null)
    setImagePreview(service.image || '')
    setFormOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setFormOpen(false)
    setEditingService(null)
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
      const payload = buildServiceFormData({
        ...form,
        durationMinutes: String(Number(form.durationMinutes)),
        price: String(Number(form.price)),
        simultaneousCapacity: String(Number(form.simultaneousCapacity)),
        displayOrder: String(Number(form.displayOrder)),
      }, imageFile)
      let savedService = null
      if (editingService) {
        const response = await updateAdminService(editingService.id, payload)
        savedService = response.service
        if (savedService) setServices((current) => current.map((service) => (service.id === savedService.id ? savedService : service)))
        toast.success('Service updated.')
      } else {
        const response = await createAdminService(payload)
        savedService = response.service
        if (savedService) setServices((current) => [savedService, ...current])
        toast.success('Service added.')
      }
      if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
      setFormOpen(false)
      setEditingService(null)
      setForm(emptyForm)
      setImageFile(null)
      setImagePreview(savedService?.image || '')
      refresh()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save service.'))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (service) => {
    if (!window.confirm(`Remove ${service.name}? Services with booking history will be set inactive instead.`)) return
    try {
      await deleteAdminService(service.id)
      toast.success('Service removed or set inactive.')
      refresh()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not remove service.'))
    }
  }

  return <>
    <div className="admin-page-heading">
      <div>
        <span className="eyebrow">Service menu</span>
        <h1>Services</h1>
        <p>Add, edit, hide, price, and capacity-control the treatments customers can choose.</p>
      </div>
      <Button onClick={openCreate}>Add service</Button>
    </div>

    <section className="admin-panel">
      {loading ? <Loader label="Loading services" /> : !services.length ? <EmptyState title="No services yet" message="Create the first Allay House service for the public menu." action={<Button onClick={openCreate}>Add service</Button>} /> : <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Category</th>
              <th>Duration</th>
              <th>Price</th>
              <th>Capacity</th>
              <th>Bookable</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {services.map((service) => <tr key={service.id}>
              <td><span className="admin-service-name">{service.name}<small>{service.slug}</small></span></td>
              <td>{service.category}</td>
              <td>{service.durationMinutes} mins</td>
              <td>{formatCurrency(service.price)}</td>
              <td>{service.simultaneousCapacity || 7}</td>
              <td><Badge status={service.bookable === false ? 'pending' : 'paid'}>{service.bookable === false ? 'Paused' : 'Bookable'}</Badge></td>
              <td><Badge status={service.isActive ? 'paid' : 'cancelled'}>{service.isActive ? 'Active' : 'Inactive'}</Badge></td>
              <td><span className="admin-row-actions"><Button size="sm" variant="outline" onClick={() => openEdit(service)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => remove(service)}>Delete</Button></span></td>
            </tr>)}
          </tbody>
        </table>
      </div>}
    </section>

    <Modal open={formOpen} onClose={closeModal} title={editingService ? 'Edit service' : 'Add service'}>
      <form className="admin-service-form" onSubmit={save}>
        <Select id="service-category" label="Category" required options={categoryOptions} value={form.categoryId} onChange={update('categoryId')} />
        <Input id="service-name" label="Name" required value={form.name} onChange={update('name')} />
        <Input id="service-slug" label="Slug" value={form.slug} onChange={update('slug')} helper="Leave blank on new services to generate one from the name." />
        <Textarea id="service-description" label="Description" rows={3} value={form.description} onChange={update('description')} />
        <div className="admin-form-grid">
          <Input id="service-duration" label="Duration" type="number" min="5" step="5" required value={form.durationMinutes} onChange={update('durationMinutes')} />
          <Input id="service-price" label="Price" type="number" min="0" step="100" required value={form.price} onChange={update('price')} />
          <Input id="service-capacity" label="Same-time capacity" type="number" min="1" required value={form.simultaneousCapacity} onChange={update('simultaneousCapacity')} />
          <Input id="service-order" label="Display order" type="number" min="0" value={form.displayOrder} onChange={update('displayOrder')} />
        </div>
        {imagePreview && <div className="admin-image-preview"><img src={imagePreview} alt="" /><span>Current service image</span></div>}
        <input type="hidden" value={form.imageUrl} name="imageUrl" readOnly />
        <label className="admin-file-control" htmlFor="service-image-file">
          <span>{imagePreview ? 'Replace image from device' : 'Upload image from device'}</span>
          <input id="service-image-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} />
          <small>{imageFile ? imageFile.name : 'Optional JPG, PNG, or WebP under 5MB.'}</small>
        </label>
        <div className="admin-toggle-pair">
          <label><input type="checkbox" checked={form.isActive} onChange={update('isActive')} /> Active on public menu</label>
          <label><input type="checkbox" checked={form.bookable} onChange={update('bookable')} /> Bookable by customers</label>
          <label><input type="checkbox" checked={form.isDiscountEligible} onChange={update('isDiscountEligible')} /> Coupon eligible</label>
        </div>
        <div className="admin-modal-actions">
          <Button type="button" variant="secondary" onClick={closeModal} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving}>{editingService ? 'Save service' : 'Create service'}</Button>
        </div>
      </form>
    </Modal>
  </>
}
