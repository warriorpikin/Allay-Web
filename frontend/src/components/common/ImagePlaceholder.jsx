import { Image as ImageIcon, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ImagePlaceholder({ src, fallbackSrc, alt = '', category, label, variant = 'rounded', className = '', loading = 'lazy', width, height }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)
  useEffect(() => { setCurrentSrc(src); setLoaded(false); setFailed(false) }, [src])
  const showPlaceholder = !currentSrc || failed || !loaded
  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
      setLoaded(false)
      return
    }
    setFailed(true)
  }

  return <div className={`image-placeholder image-placeholder--${variant} ${loaded ? 'has-image' : ''} ${className}`.trim()}>
    {currentSrc && !failed && <img className="image-placeholder__image" src={currentSrc} alt={alt} loading={loading} decoding="async" width={width} height={height} onLoad={() => setLoaded(true)} onError={handleError} />}
    {showPlaceholder && <div className="image-placeholder__art" aria-hidden="true"><span className="image-placeholder__orb image-placeholder__orb--sage" /><span className="image-placeholder__orb image-placeholder__orb--mauve" /><span className="image-placeholder__arch" /><Sparkles className="image-placeholder__spark" size={18} /></div>}
    {(category || label) && <div className="image-placeholder__caption">{category && <span>{category}</span>}{label && <small><ImageIcon size={12} />{label}</small>}</div>}
  </div>
}
