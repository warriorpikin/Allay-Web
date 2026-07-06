import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Logo({ dark = false, to = '/', className = '', src = '/assets/logos/allay-logo.svg' }) {
  const [imageAvailable, setImageAvailable] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  return <Link className={`logo ${dark ? 'logo--dark' : ''} ${imageLoaded ? 'has-image' : ''} ${className}`.trim()} to={to} aria-label="Allay House home">
    {imageAvailable && <img src={src} alt="" aria-hidden="true" onLoad={() => setImageLoaded(true)} onError={() => { setImageAvailable(false); setImageLoaded(false) }} />}
    <span className="logo__fallback"><strong>ALLAY</strong><small>HOUSE</small></span>
  </Link>
}
