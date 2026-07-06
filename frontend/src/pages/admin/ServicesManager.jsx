import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import { placeholderServices } from '../../data/placeholderServices'
import { formatCurrency } from '../../utils/formatCurrency'

export default function ServicesManager() {
  return <><div className="admin-page-heading"><div><span className="eyebrow">Service menu</span><h1>Services</h1><p>Pricing remains placeholder data until the Services API is connected.</p></div><Button>Add service</Button></div><section className="admin-panel"><div className="table-wrap"><table><thead><tr><th>Service</th><th>Category</th><th>Duration</th><th>Price</th><th>Status</th></tr></thead><tbody>{placeholderServices.slice(0, 6).map((service) => <tr key={service.id}><td>{service.name}</td><td>{service.category}</td><td>{service.durationMinutes} mins</td><td>{formatCurrency(service.price)}</td><td><Badge status="paid">Active</Badge></td></tr>)}</tbody></table></div></section></>
}

