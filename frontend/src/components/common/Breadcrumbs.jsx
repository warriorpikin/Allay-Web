import { ChevronRight } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { buildBreadcrumbJsonLd } from '../../utils/structuredData'

// items: [{ label, path }] — the last item is the current page (not a link).
export default function Breadcrumbs({ items = [] }) {
  if (items.length < 2) return null
  const jsonLd = buildBreadcrumbJsonLd(items)

  return <>
    <Helmet><script type="application/ld+json">{JSON.stringify(jsonLd)}</script></Helmet>
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => (
          <li key={item.path}>
            {index < items.length - 1
              ? <><Link to={item.path}>{item.label}</Link><ChevronRight size={12} aria-hidden="true" /></>
              : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  </>
}
