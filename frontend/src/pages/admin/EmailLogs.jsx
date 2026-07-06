import EmptyState from '../../components/common/EmptyState'

export default function EmailLogs() {
  return <><div className="admin-page-heading"><div><span className="eyebrow">Delivery record</span><h1>Email logs</h1><p>Confirmation, notification, launch, and failed-email events.</p></div></div><section className="admin-panel"><EmptyState title="No email events" message="Delivery logs will appear when Resend automation is connected." /></section></>
}

