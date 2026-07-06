import { Link } from 'react-router-dom'

export default function Brand({ light = false }) {
  return <Link className={`brand ${light ? 'brand--light' : ''}`} to="/" aria-label="Allay House home"><span>ALLAY</span><small>HOUSE</small></Link>
}

