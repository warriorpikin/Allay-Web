import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import Loader from '../../components/common/Loader'
import Input from '../../components/forms/Input'
import { getAdminUsers } from '../../services/adminApi'
import { formatDate } from '../../utils/formatDate'

const pageSize = 20

export default function Users() {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, total: 0 })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const refresh = useCallback((page = 1, nextSearch = '') => {
    setLoading(true)
    getAdminUsers({ page, limit: pageSize, search: nextSearch || undefined })
      .then((data) => {
        setUsers(data.users || [])
        setPagination(data.pagination || { page, limit: pageSize, total: 0 })
      })
      .catch(() => toast.error('Could not load registered users.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { refresh(1, '') }, [refresh])

  const submitSearch = (event) => {
    event.preventDefault()
    refresh(1, search)
  }

  const totalPages = Math.max(Math.ceil((pagination.total || 0) / pagination.limit), 1)

  return <>
    <div className="admin-page-heading">
      <div><span className="eyebrow">Registered accounts</span><h1>Users</h1><p>Every person who created an Allay House account, whether they have booked yet or not.</p></div>
    </div>

    <section className="admin-panel">
      <form className="admin-filters" onSubmit={submitSearch}>
        <Input id="user-search" label="Search" placeholder="Name, email, or phone" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Button type="submit">Search</Button>
      </form>

      {loading ? <Loader label="Loading users" /> : !users.length ? <EmptyState title="No registered users" message="New account registrations will appear here immediately." /> : <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Registered</th><th>Status</th><th>Has booked</th><th>Bookings</th><th>Most recent booking</th></tr></thead>
          <tbody>
            {users.map((user) => <tr key={user.id}>
              <td>{user.fullName}</td>
              <td>{user.email}</td>
              <td>{user.phone || '-'}</td>
              <td>{formatDate(user.createdAt)}</td>
              <td><Badge status={user.status === 'active' ? 'paid' : 'pending'}>{user.status}</Badge></td>
              <td>{user.hasBooked ? 'Yes' : 'No'}</td>
              <td>{user.bookingCount}</td>
              <td>{user.latestBookingAt ? formatDate(user.latestBookingAt) : '-'}</td>
            </tr>)}
          </tbody>
        </table>
      </div>}

      <div className="admin-pagination">
        <span>{pagination.total} user{pagination.total === 1 ? '' : 's'} / page {pagination.page} of {totalPages}</span>
        <div><Button size="sm" variant="outline" disabled={pagination.page <= 1 || loading} onClick={() => refresh(pagination.page - 1, search)}>Previous</Button><Button size="sm" variant="outline" disabled={pagination.page >= totalPages || loading} onClick={() => refresh(pagination.page + 1, search)}>Next</Button></div>
      </div>
    </section>
  </>
}
