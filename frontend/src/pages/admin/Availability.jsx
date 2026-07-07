import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../components/common/Button'
import Input from '../../components/forms/Input'
import Select from '../../components/forms/Select'
import Textarea from '../../components/forms/Textarea'
import {
  createBlockedPeriod,
  createCapacityOverride,
  deleteBlockedPeriod,
  deleteCapacityOverride,
  getBlockedPeriods,
  getBusinessHours,
  getCapacityOverrides,
  updateBusinessHours,
} from '../../services/adminApi'

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const blockTypes = [
  { value: 'full_day', label: 'Full day' },
  { value: 'time_range', label: 'Time range' },
  { value: 'date_range', label: 'Date range' },
  { value: 'emergency_pause', label: 'Emergency pause' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'private_event', label: 'Private event' },
]

export default function Availability() {
  const [hours, setHours] = useState([])
  const [blockedPeriods, setBlockedPeriods] = useState([])
  const [overrides, setOverrides] = useState([])
  const [blockForm, setBlockForm] = useState({ title: '', reason: '', startDatetime: '', endDatetime: '', blockType: 'time_range', isFullDay: false })
  const [overrideForm, setOverrideForm] = useState({ date: '', timeSlot: '', maxBookings: 1, reason: '' })

  const refresh = () => Promise.all([
    getBusinessHours().then((data) => setHours(data.businessHours || [])),
    getBlockedPeriods().then((data) => setBlockedPeriods(data.blockedPeriods || [])),
    getCapacityOverrides().then((data) => setOverrides(data.capacityOverrides || [])),
  ]).catch(() => toast.error('Could not load availability settings.'))

  useEffect(() => { refresh() }, [])

  const updateHour = (id, changes) => setHours((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item))
  const saveHour = (item) => {
    updateBusinessHours(item.id, item)
      .then(() => toast.success(`${dayNames[item.dayOfWeek]} hours updated.`))
      .catch(() => toast.error('Could not update business hours.'))
  }

  const submitBlock = (event) => {
    event.preventDefault()
    createBlockedPeriod(blockForm)
      .then(() => {
        toast.success('Blocked period added.')
        setBlockForm({ title: '', reason: '', startDatetime: '', endDatetime: '', blockType: 'time_range', isFullDay: false })
        refresh()
      })
      .catch(() => toast.error('Could not add blocked period.'))
  }

  const submitOverride = (event) => {
    event.preventDefault()
    createCapacityOverride({ ...overrideForm, timeSlot: overrideForm.timeSlot || null })
      .then(() => {
        toast.success('Capacity override saved.')
        setOverrideForm({ date: '', timeSlot: '', maxBookings: 1, reason: '' })
        refresh()
      })
      .catch(() => toast.error('Could not save capacity override.'))
  }

  const removeBlock = (id) => deleteBlockedPeriod(id).then(refresh).catch(() => toast.error('Could not remove blocked period.'))
  const removeOverride = (id) => deleteCapacityOverride(id).then(refresh).catch(() => toast.error('Could not remove capacity override.'))

  return <>
    <div className="admin-page-heading">
      <div><span className="eyebrow">Calendar control</span><h1>Availability</h1><p>Control opening hours, daily capacity, time-slot capacity, closures, and booking overrides.</p></div>
    </div>

    <section className="admin-panel admin-panel--wide">
      <h2>Business hours and capacity</h2>
      <div className="admin-hours-grid">
        {hours.map((item) => <article className="admin-hour-card" key={item.id}>
          <header><strong>{dayNames[item.dayOfWeek]}</strong><label><input type="checkbox" checked={item.isOpen} onChange={(event) => updateHour(item.id, { isOpen: event.target.checked })} /> Open</label></header>
          <div className="admin-hour-card__row">
            <Input id={`open-${item.id}`} label="Open" type="time" value={item.openTime?.slice(0, 5)} onChange={(event) => updateHour(item.id, { openTime: event.target.value })} />
            <Input id={`close-${item.id}`} label="Close" type="time" value={item.closeTime?.slice(0, 5)} onChange={(event) => updateHour(item.id, { closeTime: event.target.value })} />
          </div>
          <div className="admin-hour-card__row">
            <Input id={`daily-${item.id}`} label="Daily max" type="number" min="0" value={item.maxDailyBookings} onChange={(event) => updateHour(item.id, { maxDailyBookings: Number(event.target.value) })} />
            <Input id={`slot-${item.id}`} label="Slot max" type="number" min="0" value={item.maxBookingsPerSlot} onChange={(event) => updateHour(item.id, { maxBookingsPerSlot: Number(event.target.value) })} />
            <Input id={`interval-${item.id}`} label="Interval" type="number" min="5" value={item.slotIntervalMinutes} onChange={(event) => updateHour(item.id, { slotIntervalMinutes: Number(event.target.value) })} />
          </div>
          <Button size="sm" onClick={() => saveHour(item)}>Save {dayNames[item.dayOfWeek]}</Button>
        </article>)}
      </div>
    </section>

    <div className="admin-detail-grid">
      <form className="admin-panel" onSubmit={submitBlock}>
        <h2>Block a period</h2>
        <Input id="block-title" label="Title" required value={blockForm.title} onChange={(event) => setBlockForm({ ...blockForm, title: event.target.value })} />
        <Select id="block-type" label="Block type" options={blockTypes} value={blockForm.blockType} onChange={(event) => setBlockForm({ ...blockForm, blockType: event.target.value, isFullDay: event.target.value === 'full_day' })} />
        <Input id="block-start" type="datetime-local" label="Starts" required value={blockForm.startDatetime} onChange={(event) => setBlockForm({ ...blockForm, startDatetime: event.target.value })} />
        <Input id="block-end" type="datetime-local" label="Ends" required value={blockForm.endDatetime} onChange={(event) => setBlockForm({ ...blockForm, endDatetime: event.target.value })} />
        <Textarea id="block-reason" label="Reason" value={blockForm.reason} onChange={(event) => setBlockForm({ ...blockForm, reason: event.target.value })} />
        <Button type="submit">Add blocked period</Button>
      </form>

      <form className="admin-panel" onSubmit={submitOverride}>
        <h2>Capacity override</h2>
        <Input id="override-date" type="date" label="Date" required value={overrideForm.date} onChange={(event) => setOverrideForm({ ...overrideForm, date: event.target.value })} />
        <Input id="override-time" type="time" label="Time slot (optional)" value={overrideForm.timeSlot} onChange={(event) => setOverrideForm({ ...overrideForm, timeSlot: event.target.value })} helper="Leave blank to override the full day." />
        <Input id="override-max" type="number" min="0" label="Max bookings" required value={overrideForm.maxBookings} onChange={(event) => setOverrideForm({ ...overrideForm, maxBookings: Number(event.target.value) })} />
        <Textarea id="override-reason" label="Reason" value={overrideForm.reason} onChange={(event) => setOverrideForm({ ...overrideForm, reason: event.target.value })} />
        <Button type="submit">Save override</Button>
      </form>
    </div>

    <div className="admin-detail-grid">
      <section className="admin-panel">
        <h2>Blocked periods</h2>
        <div className="admin-list">
          {blockedPeriods.length ? blockedPeriods.map((item) => <article key={item.id}><div><strong>{item.title}</strong><span>{item.blockType} - {new Date(item.startDatetime).toLocaleString()} to {new Date(item.endDatetime).toLocaleString()}</span>{item.reason && <small>{item.reason}</small>}</div><Button size="sm" variant="outline" onClick={() => removeBlock(item.id)}>Remove</Button></article>) : <p>No blocked periods yet.</p>}
        </div>
      </section>

      <section className="admin-panel">
        <h2>Capacity overrides</h2>
        <div className="admin-list">
          {overrides.length ? overrides.map((item) => <article key={item.id}><div><strong>{item.date?.slice(0, 10)} {item.timeSlot?.slice(0, 5) || 'full day'}</strong><span>Max bookings: {item.maxBookings}</span>{item.reason && <small>{item.reason}</small>}</div><Button size="sm" variant="outline" onClick={() => removeOverride(item.id)}>Remove</Button></article>) : <p>No overrides yet.</p>}
        </div>
      </section>
    </div>
  </>
}
