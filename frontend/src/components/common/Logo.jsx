import { useState } from 'react'
import { Link } from 'react-router-dom'
import { imagePaths } from '../../utils/imagePaths'

export default function Logo({ dark = false, to = '/', className = '', src }) {
  const logoSrc = src || (dark ? imagePaths.brand.logoDark : imagePaths.brand.logoLight)
  const [imageAvailable, setImageAvailable] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  return <Link className={`logo ${dark ? 'logo--dark' : ''} ${imageLoaded ? 'has-image' : ''} ${className}`.trim()} to={to} aria-label="Allay House home">
    {imageAvailable && <img src={logoSrc} alt="" aria-hidden="true" onLoad={() => setImageLoaded(true)} onError={() => { setImageAvailable(false); setImageLoaded(false) }} />}
    <span className="logo__fallback"><strong>ALLAY</strong><small>HOUSE</small></span>
  </Link>
}
