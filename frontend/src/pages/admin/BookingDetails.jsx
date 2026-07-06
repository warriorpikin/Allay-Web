import { useParams } from 'react-router-dom'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'

export default function BookingDetails() {
  const { id } = useParams()
  return <><div className="admin-page-heading"><div><span className="eyebrow">Booking {id}</span><h1>Booking details</h1><p>Customer, service, schedule, and payment information.</p></div><Badge status="pending">Pending</Badge></div><div className="admin-detail-grid"><section className="admin-panel"><h2>Appointment</h2><dl><div><dt>Service</dt><dd>Allay Signature Massage</dd></div><div><dt>Date & time</dt><dd>Awaiting live booking data</dd></div><div><dt>Payment</dt><dd><Badge status="unpaid">Unpaid</Badge></dd></div></dl></section><section className="admin-panel"><h2>Customer</h2><dl><div><dt>Name</dt><dd>Sample customer</dd></div><div><dt>Contact</dt><dd>customer@example.com</dd></div></dl><Button variant="secondary">Update booking</Button></section></div></>
}

