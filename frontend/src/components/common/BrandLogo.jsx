import { useState } from 'react'
import { Link } from 'react-router-dom'
import { imagePaths } from '../../utils/imagePaths'

export default function BrandLogo({ variant = 'brown', to = '/', className = '', asLink = true }) {
  const [missing, setMissing] = useState(false)
  const src = variant === 'white' ? imagePaths.brand.logoWhite : imagePaths.brand.logoBrown
  const classes = `brand-logo brand-logo--${variant} ${missing ? 'is-missing' : ''} ${className}`.trim()
  const content = missing
    ? <span className="brand-logo__missing" aria-hidden="true" />
    : <img src={src} alt="Allay House" onError={() => setMissing(true)} />

  if (!asLink) return <span className={classes}>{content}</span>
  return <Link className={classes} to={to} aria-label="Allay House home">{content}</Link>
}
