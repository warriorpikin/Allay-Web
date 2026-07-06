import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'

export default function WaitlistManager() {
  return <><div className="admin-page-heading"><div><span className="eyebrow">Pre-launch audience</span><h1>Waitlist</h1><p>Manage signups, service interests, discounts, and launch emails.</p></div><div className="admin-heading-actions"><Button variant="outline">Export CSV</Button><Button>Generate discounts</Button></div></div><section className="admin-panel"><EmptyState title="No waitlist data connected" message="Signups will appear after the Phase 2 Waitlist API is connected." /></section></>
}

