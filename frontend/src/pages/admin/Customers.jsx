import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import Loader from '../../components/common/Loader'
import Modal from '../../components/common/Modal'
import Input from '../../components/forms/Input'
import { getAdminCustomer, getAdminCustomers } from '../../services/adminApi'
import { formatDate } from '../../utils/formatDate'

const pageSize = 20

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, total: 0 })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const refresh = useCallback((page = 1, nextSearch = '') => {
    setLoading(true)
    getAdminCustomers({ page, limit: pageSize, search: nextSearch || undefined })
      .then((data) => {
        setCustomers(data.customers || [])
        setPagination(data.pagination || { page, limit: pageSize, total: 0 })
      })
      .catch(() => toast.error('Could not load customers.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { refresh(1, '') }, [refresh])

  const submitSearch = (event) => {
    event.preventDefault()
    refresh(1, search)
  }

  const openDetails = (customer) => {
    setDetailsLoading(true)
    getAdminCustomer(customer.id)
      .then((data) => setSelected(data))
      .catch(() => toast.error('Could not load customer details.'))
      .finally(() => setDetailsLoading(false))
  }

  const totalPages = Math.max(Math.ceil((pagination.total || 0) / pagination.limit), 1)

  return <>
    <div className="admin-page-heading">
      <div><span className="eyebrow">Booked clients</span><h1>Customers</h1><p>People with booking history, including upcoming, completed, cancelled, paid, and pending appointments.</p></div>
    </div>

    <section className="admin-panel">
      <form className="admin-filters" onSubmit={submitSearch}>
        <Input id="customer-search" label="Search" placeholder="Name, email, or phone" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Button type="submit">Search</Button>
      </form>

      {loading ? <Loader label="Loading customers" /> : !customers.length ? <EmptyState title="No customers yet" message="People appear here after they make a booking." /> : <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Last login</th><th>Bookings</th><th>Status</th><th /></tr></thead>
          <tbody>
            {customers.map((customer) => <tr key={customer.id}>
              <td>{customer.fullName}</td>
              <td>{customer.email}</td>
              <td>{customer.phone || '-'}</td>
              <td>{formatDate(customer.createdAt)}</td>
              <td>{customer.lastLoginAt ? formatDate(customer.lastLoginAt) : 'Never'}</td>
              <td>{customer.bookingCount}</td>
              <td><Badge status={customer.status === 'active' ? 'paid' : 'pending'}>{customer.status}</Badge></td>
              <td><Button size="sm" variant="outline" onClick={() => openDetails(customer)} loading={detailsLoading}>View</Button></td>
            </tr>)}
          </tbody>
        </table>
      </div>}

      <div className="admin-pagination">
        <span>{pagination.total} customer{pagination.total === 1 ? '' : 's'} / page {pagination.page} of {totalPages}</span>
        <div><Button size="sm" variant="outline" disabled={pagination.page <= 1 || loading} onClick={() => refresh(pagination.page - 1, search)}>Previous</Button><Button size="sm" variant="outline" disabled={pagination.page >= totalPages || loading} onClick={() => refresh(pagination.page + 1, search)}>Next</Button></div>
      </div>
    </section>

    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.customer?.fullName || 'Customer details'}>
      {selected && <div className="admin-customer-detail">
        <dl>
          <div><dt>Email</dt><dd>{selected.customer.email}</dd></div>
          <div><dt>Phone</dt><dd>{selected.customer.phone || '-'}</dd></div>
          <div><dt>Joined</dt><dd>{formatDate(selected.customer.createdAt)}</dd></div>
          <div><dt>Last login</dt><dd>{selected.customer.lastLoginAt ? formatDate(selected.customer.lastLoginAt) : 'Never'}</dd></div>
          <div><dt>Waitlist</dt><dd>{selected.customer.waitlistStatus || '-'}</dd></div>
          <div><dt>Bookings</dt><dd>{selected.customer.bookingCount}</dd></div>
        </dl>
        <h3>Recent bookings</h3>
        {selected.recentBookings?.length ? <div className="admin-list">{selected.recentBookings.map((booking) => <article key={booking.id}><div><strong>{booking.bookingReference}</strong><small>{formatDate(booking.appointmentDate)} / {booking.status}</small></div></article>)}</div> : <p>No bookings yet.</p>}
      </div>}
    </Modal>
  </>
}
