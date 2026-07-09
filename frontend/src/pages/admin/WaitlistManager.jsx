import toast from 'react-hot-toast'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import Loader from '../../components/common/Loader'
import { useFetch } from '../../hooks/useFetch'
import { getWaitlist, sendWaitlistCoupons } from '../../services/adminApi'

function toCsv(entries) {
  const header = ['Email', 'Full name', 'Phone', 'Services', 'Status', 'Joined']
  const rows = entries.map((entry) => [
    entry.email,
    entry.fullName || '',
    entry.phone || '',
    entry.services.map((service) => service.name).join('; '),
    entry.status,
    new Date(entry.createdAt).toISOString(),
  ])
  return [header, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n')
}

function downloadCsv(entries) {
  const blob = new Blob([toCsv(entries)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `allay-house-waitlist-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export default function WaitlistManager() {
  const { data, loading } = useFetch(getWaitlist)
  const entries = data?.waitlist || []

  const exportCsv = () => {
    if (!entries.length) { toast.error('No waitlist entries to export yet.'); return }
    downloadCsv(entries)
  }

  const sendCoupons = () => {
    if (!entries.length) { toast.error('No waitlist entries to email yet.'); return }
    const loadingToast = toast.loading('Sending coupon emails...')
    sendWaitlistCoupons()
      .then((result) => toast.success(`Coupon run complete: ${result.sent} sent, ${result.skippedOrFailed} skipped/failed.`, { id: loadingToast }))
      .catch(() => toast.error('Could not send coupon emails.', { id: loadingToast }))
  }

  return <>
    <div className="admin-page-heading">
      <div><span className="eyebrow">Pre-launch audience</span><h1>Waitlist</h1><p>Manage signups, service interests, exports, and admin-triggered coupon emails ahead of launch.</p></div>
      <div className="admin-heading-actions">
        <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
        <Button onClick={sendCoupons}>Send coupon emails</Button>
      </div>
    </div>
    <section className="admin-panel">
      {loading ? <Loader label="Loading waitlist" /> : !entries.length ? <EmptyState title="No waitlist signups yet" message="Signups from the public waitlist form will appear here." /> : <div className="table-wrap"><table><thead><tr><th>Email</th><th>Name</th><th>Phone</th><th>Services</th><th>Status</th><th>Joined</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id}><td>{entry.email}</td><td>{entry.fullName || '-'}</td><td>{entry.phone || '-'}</td><td>{entry.services.map((service) => service.name).join(', ') || '-'}</td><td>{entry.status}</td><td>{new Date(entry.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</td></tr>)}</tbody></table></div>}
    </section>
  </>
}
