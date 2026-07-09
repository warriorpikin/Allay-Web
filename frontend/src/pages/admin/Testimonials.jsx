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
  createAdminTestimonial,
  deleteAdminTestimonial,
  getAdminTestimonials,
  updateAdminTestimonial,
} from '../../services/adminApi'

const emptyForm = {
  customerName: '',
  profileImageUrl: '',
  testimonialText: '',
  rating: 5,
  isActive: true,
  displayOrder: 0,
}

function toForm(testimonial) {
  return {
    customerName: testimonial.customerName || '',
    profileImageUrl: testimonial.profileImageUrl || '',
    testimonialText: testimonial.testimonialText || '',
    rating: testimonial.rating || 5,
    isActive: Boolean(testimonial.isActive),
    displayOrder: testimonial.displayOrder || 0,
  }
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const refresh = () => {
    setLoading(true)
    getAdminTestimonials()
      .then((data) => setTestimonials(data.testimonials || []))
      .catch(() => toast.error('Could not load testimonials.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (testimonial) => {
    setEditing(testimonial)
    setForm(toForm(testimonial))
    setFormOpen(true)
  }

  const close = () => {
    if (saving) return
    setFormOpen(false)
    setEditing(null)
    setForm(emptyForm)
  }

  const update = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((current) => ({ ...current, [field]: value }))
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    const payload = { ...form, rating: Number(form.rating), displayOrder: Number(form.displayOrder) }
    try {
      if (editing) {
        await updateAdminTestimonial(editing.id, payload)
        toast.success('Testimonial updated.')
      } else {
        await createAdminTestimonial(payload)
        toast.success('Testimonial added.')
      }
      setFormOpen(false)
      setEditing(null)
      setForm(emptyForm)
      refresh()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save testimonial.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (testimonial) => {
    if (!window.confirm(`Delete testimonial from ${testimonial.customerName}?`)) return
    try {
      await deleteAdminTestimonial(testimonial.id)
      toast.success('Testimonial deleted.')
      refresh()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete testimonial.')
    }
  }

  return <>
    <div className="admin-page-heading">
      <div><span className="eyebrow">Homepage proof</span><h1>Testimonials</h1><p>Manage the client notes that appear on the public homepage.</p></div>
      <Button onClick={openCreate}>Add testimonial</Button>
    </div>

    <section className="admin-panel">
      {loading ? <Loader label="Loading testimonials" /> : !testimonials.length ? <EmptyState title="No testimonials yet" message="Add client notes for the homepage testimonial section." action={<Button onClick={openCreate}>Add testimonial</Button>} /> : <div className="table-wrap">
        <table>
          <thead><tr><th>Client</th><th>Quote</th><th>Rating</th><th>Status</th><th /></tr></thead>
          <tbody>
            {testimonials.map((testimonial) => <tr key={testimonial.id}>
              <td>{testimonial.customerName}</td>
              <td><span className="admin-table-copy">{testimonial.testimonialText}</span></td>
              <td>{testimonial.rating}/5</td>
              <td><Badge status={testimonial.isActive ? 'paid' : 'cancelled'}>{testimonial.isActive ? 'Active' : 'Inactive'}</Badge></td>
              <td><span className="admin-row-actions"><Button size="sm" variant="outline" onClick={() => openEdit(testimonial)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => remove(testimonial)}>Delete</Button></span></td>
            </tr>)}
          </tbody>
        </table>
      </div>}
    </section>

    <Modal open={formOpen} onClose={close} title={editing ? 'Edit testimonial' : 'Add testimonial'}>
      <form className="admin-service-form" onSubmit={save}>
        <Input id="testimonial-name" label="Client name" required value={form.customerName} onChange={update('customerName')} />
        <Input id="testimonial-image" label="Profile image URL" value={form.profileImageUrl} onChange={update('profileImageUrl')} placeholder="/images/allay/client.jpg" />
        <Textarea id="testimonial-text" label="Testimonial" required rows={4} value={form.testimonialText} onChange={update('testimonialText')} />
        <div className="admin-form-grid">
          <Input id="testimonial-rating" label="Rating" type="number" min="1" max="5" required value={form.rating} onChange={update('rating')} />
          <Input id="testimonial-order" label="Display order" type="number" min="0" value={form.displayOrder} onChange={update('displayOrder')} />
        </div>
        <div className="admin-toggle-pair">
          <label><input type="checkbox" checked={form.isActive} onChange={update('isActive')} /> Active on homepage</label>
        </div>
        <div className="admin-modal-actions">
          <Button type="button" variant="secondary" onClick={close} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving}>{editing ? 'Save testimonial' : 'Create testimonial'}</Button>
        </div>
      </form>
    </Modal>
  </>
}
