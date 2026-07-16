import { useCallback, useEffect, useState } from 'react'
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
import { formatServicePrice } from '../../utils/formatServicePrice'
import { getErrorMessage } from '../../utils/getErrorMessage'
import { validateImageFile } from '../../utils/imageValidation'

const PAGE_SIZE = 25

const emptyForm = {
  categoryId: '',
  name: '',
  slug: '',
  description: '',
  shortDescription: '',
  durationMinutes: 60,
  price: 0,
  priceFrom: '',
  priceTo: '',
  priceIsFrom: false,
  priceUnitLabel: '',
  serviceType: '',
  isAddon: false,
  isCouples: false,
  sessionCount: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
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
    shortDescription: service.shortDescription || '',
    durationMinutes: service.durationMinutes || 60,
    price: service.price || 0,
    priceFrom: service.priceFrom ?? '',
    priceTo: service.priceTo ?? '',
    priceIsFrom: Boolean(service.priceIsFrom),
    priceUnitLabel: service.priceUnitLabel || '',
    serviceType: service.serviceType || '',
    isAddon: Boolean(service.isAddon),
    isCouples: Boolean(service.isCouples),
    sessionCount: service.sessionCount ?? '',
    seoTitle: service.seoTitle || '',
    seoDescription: service.seoDescription || '',
    seoKeywords: service.seoKeywords || '',
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
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 })
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  const categoryOptions = [
    { value: '', label: 'All categories' },
    ...categories.map((category) => ({ value: category.id, label: `${category.name}${category.isActive ? '' : ' (inactive)'}` })),
  ]
  const formCategoryOptions = categories.map((category) => ({ value: category.id, label: `${category.name}${category.isActive ? '' : ' (inactive)'}` }))

  const refresh = useCallback((page = 1, filters = {}) => {
    setLoading(true)
    const params = {
      page,
      limit: PAGE_SIZE,
      search: (filters.search ?? search) || undefined,
      categoryId: (filters.categoryId ?? categoryFilter) || undefined,
      isActive: (filters.isActive ?? activeFilter) || undefined,
    }
    Promise.all([getAdminServices(params), getAdminServiceCategories()])
      .then(([serviceData, categoryData]) => {
        setServices(serviceData.services || [])
        setPagination(serviceData.pagination || { page, limit: PAGE_SIZE, total: 0 })
        setCategories(categoryData.categories || [])
      })
      .catch(() => toast.error('Could not load services.'))
      .finally(() => setLoading(false))
  }, [search, categoryFilter, activeFilter])

  useEffect(() => { refresh(1) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
  }, [imagePreview])

  const submitSearch = (event) => {
    event.preventDefault()
    refresh(1, { search })
  }

  const changeCategoryFilter = (event) => {
    const value = event.target.value
    setCategoryFilter(value)
    refresh(1, { categoryId: value })
  }

  const changeActiveFilter = (event) => {
    const value = event.target.value
    setActiveFilter(value)
    refresh(1, { isActive: value })
  }

  const totalPages = Math.max(Math.ceil((pagination.total || 0) / pagination.limit), 1)

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
        priceFrom: form.priceFrom === '' ? '' : String(Number(form.priceFrom)),
        priceTo: form.priceTo === '' ? '' : String(Number(form.priceTo)),
        sessionCount: form.sessionCount === '' ? '' : String(Number(form.sessionCount)),
        simultaneousCapacity: String(Number(form.simultaneousCapacity)),
        displayOrder: String(Number(form.displayOrder)),
      }, imageFile)
      let savedService = null
      if (editingService) {
        const response = await updateAdminService(editingService.id, payload)
        savedService = response.service
        toast.success('Service updated.')
      } else {
        const response = await createAdminService(payload)
        savedService = response.service
        toast.success('Service added.')
      }
      if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
      setFormOpen(false)
      setEditingService(null)
      setForm(emptyForm)
      setImageFile(null)
      setImagePreview(savedService?.image || '')
      refresh(pagination.page)
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
      refresh(pagination.page)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not remove service.'))
    }
  }

  return <>
    <div className="admin-page-heading">
      <div>
        <span className="eyebrow">Service menu</span>
        <h1>Services</h1>
        <p>Add, edit, hide, price, and capacity-control the treatments customers can choose. {pagination.total} service{pagination.total === 1 ? '' : 's'} total.</p>
      </div>
      <Button onClick={openCreate}>Add service</Button>
    </div>

    <section className="admin-panel">
      <form className="admin-filters" onSubmit={submitSearch}>
        <Input id="service-search" label="Search" placeholder="Service name" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Select id="service-category-filter" label="Category" options={categoryOptions} value={categoryFilter} onChange={changeCategoryFilter} />
        <Select id="service-active-filter" label="Status" options={[{ value: '', label: 'All statuses' }, { value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} value={activeFilter} onChange={changeActiveFilter} />
        <Button type="submit">Search</Button>
      </form>

      {loading ? <Loader label="Loading services" /> : !services.length ? <EmptyState title="No services found" message="Try a different search or filter, or create the first service for this category." action={<Button onClick={openCreate}>Add service</Button>} /> : <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Category</th>
              <th>Duration</th>
              <th>Price</th>
              <th>Type</th>
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
              <td>{formatServicePrice(service)}</td>
              <td>
                {service.isAddon && <Badge status="pending">Add-on</Badge>}
                {service.isCouples && <Badge status="paid">Couples</Badge>}
                {service.sessionCount ? <Badge status="paid">{service.sessionCount}x</Badge> : null}
              </td>
              <td><Badge status={service.bookable === false ? 'pending' : 'paid'}>{service.bookable === false ? 'Paused' : 'Bookable'}</Badge></td>
              <td><Badge status={service.isActive ? 'paid' : 'cancelled'}>{service.isActive ? 'Active' : 'Inactive'}</Badge></td>
              <td><span className="admin-row-actions"><Button size="sm" variant="outline" onClick={() => openEdit(service)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => remove(service)}>Delete</Button></span></td>
            </tr>)}
          </tbody>
        </table>
      </div>}

      <div className="admin-pagination">
        <span>{pagination.total} service{pagination.total === 1 ? '' : 's'} / page {pagination.page} of {totalPages}</span>
        <div><Button size="sm" variant="outline" disabled={pagination.page <= 1 || loading} onClick={() => refresh(pagination.page - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={pagination.page >= totalPages || loading} onClick={() => refresh(pagination.page + 1)}>Next</Button></div>
      </div>
    </section>

    <Modal open={formOpen} onClose={closeModal} title={editingService ? 'Edit service' : 'Add service'}>
      <form className="admin-service-form" onSubmit={save}>
        <Select id="service-category" label="Category" required options={formCategoryOptions} value={form.categoryId} onChange={update('categoryId')} />
        <Input id="service-name" label="Name" required value={form.name} onChange={update('name')} />
        <Input id="service-slug" label="Slug" value={form.slug} onChange={update('slug')} helper="Leave blank on new services to generate one from the name." />
        <Textarea id="service-short-description" label="Card description (short)" rows={2} value={form.shortDescription} onChange={update('shortDescription')} helper="Shown on service cards. One or two sentences." />
        <Textarea id="service-description" label="Detailed description" rows={3} value={form.description} onChange={update('description')} helper="Shown on the full service page." />

        <div className="admin-form-grid">
          <Input id="service-duration" label="Duration (minutes)" type="number" min="5" step="5" required value={form.durationMinutes} onChange={update('durationMinutes')} />
          <Input id="service-price" label="Price (₦)" type="number" min="0" step="100" required value={form.price} onChange={update('price')} />
          <Input id="service-price-from" label="Price from (₦, optional)" type="number" min="0" step="100" value={form.priceFrom} onChange={update('priceFrom')} />
          <Input id="service-price-to" label="Price to (₦, optional range max)" type="number" min="0" step="100" value={form.priceTo} onChange={update('priceTo')} />
          <Input id="service-price-unit-label" label="Price unit label (optional)" placeholder="e.g. per person, per finger" value={form.priceUnitLabel} onChange={update('priceUnitLabel')} />
          <Input id="service-session-count" label="Session count (optional)" type="number" min="1" value={form.sessionCount} onChange={update('sessionCount')} />
          <Input id="service-type" label="Service type/tag (optional)" placeholder="e.g. package, signature" value={form.serviceType} onChange={update('serviceType')} />
          <Input id="service-capacity" label="Same-time capacity" type="number" min="1" required value={form.simultaneousCapacity} onChange={update('simultaneousCapacity')} />
          <Input id="service-order" label="Display order" type="number" min="0" value={form.displayOrder} onChange={update('displayOrder')} />
        </div>

        <div className="admin-toggle-pair">
          <label><input type="checkbox" checked={form.priceIsFrom} onChange={update('priceIsFrom')} /> Show as “From” price</label>
          <label><input type="checkbox" checked={form.isAddon} onChange={update('isAddon')} /> Add-on service</label>
          <label><input type="checkbox" checked={form.isCouples} onChange={update('isCouples')} /> Couples service</label>
        </div>

        {imagePreview && <div className="admin-image-preview"><img src={imagePreview} alt="" /><span>Current service image</span></div>}
        <input type="hidden" value={form.imageUrl} name="imageUrl" readOnly />
        <label className="admin-file-control" htmlFor="service-image-file">
          <span>{imagePreview ? 'Replace image from device' : 'Upload image from device'}</span>
          <input id="service-image-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} />
          <small>{imageFile ? imageFile.name : 'Optional JPG, PNG, or WebP under 5MB.'}</small>
        </label>

        <fieldset className="admin-form-fieldset">
          <legend>SEO (optional — sensible defaults are generated automatically if left blank)</legend>
          <Input id="service-seo-title" label="SEO title" value={form.seoTitle} onChange={update('seoTitle')} />
          <Textarea id="service-seo-description" label="SEO description" rows={2} value={form.seoDescription} onChange={update('seoDescription')} />
          <Input id="service-seo-keywords" label="SEO keywords (comma separated)" value={form.seoKeywords} onChange={update('seoKeywords')} />
        </fieldset>

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
