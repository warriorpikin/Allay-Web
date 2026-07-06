import { Link } from 'react-router-dom'
import Badge from '../../components/common/Badge'
import Input from '../../components/forms/Input'

export default function Bookings() {
  return <><div className="admin-page-heading"><div><span className="eyebrow">Appointments</span><h1>Bookings</h1><p>Search, filter, and manage customer appointments.</p></div></div><section className="admin-panel"><div className="admin-filters"><Input id="booking-search" placeholder="Search customer or reference" aria-label="Search bookings" /><select aria-label="Booking status"><option>All statuses</option><option>Pending</option><option>Confirmed</option></select></div><div className="table-wrap"><table><thead><tr><th>Reference</th><th>Customer</th><th>Service</th><th>Status</th><th>Payment</th><th /></tr></thead><tbody><tr><td>ALY-PREVIEW</td><td>Sample customer</td><td>Signature Massage</td><td><Badge status="pending">Pending</Badge></td><td><Badge status="unpaid">Unpaid</Badge></td><td><Link to="/allay-admin/bookings/preview">View</Link></td></tr></tbody></table></div></section></>
}

