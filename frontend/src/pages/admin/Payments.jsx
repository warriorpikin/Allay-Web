import EmptyState from '../../components/common/EmptyState'

export default function Payments() {
  return <><div className="admin-page-heading"><div><span className="eyebrow">Transactions</span><h1>Payments</h1><p>Gateway-flexible payment records and verification statuses.</p></div></div><section className="admin-panel"><EmptyState title="No payment records" message="Payments remain inactive until a gateway is configured in the payment phase." /></section></>
}

