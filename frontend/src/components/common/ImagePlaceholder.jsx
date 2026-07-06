import { Image as ImageIcon, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ImagePlaceholder({ src, alt = '', category, label, variant = 'rounded', className = '' }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  useEffect(() => { setLoaded(false); setFailed(false) }, [src])
  const showPlaceholder = !src || failed || !loaded

  return <div className={`image-placeholder image-placeholder--${variant} ${loaded ? 'has-image' : ''} ${className}`.trim()}>
    {src && !failed && <img className="image-placeholder__image" src={src} alt={alt} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />}
    {showPlaceholder && <div className="image-placeholder__art" aria-hidden="true"><span className="image-placeholder__orb image-placeholder__orb--sage" /><span className="image-placeholder__orb image-placeholder__orb--mauve" /><span className="image-placeholder__arch" /><Sparkles className="image-placeholder__spark" size={18} /></div>}
    {(category || label) && <div className="image-placeholder__caption">{category && <span>{category}</span>}{label && <small><ImageIcon size={12} />{label}</small>}</div>}
  </div>
}

