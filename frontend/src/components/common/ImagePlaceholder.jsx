import { Image as ImageIcon, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export default function ImagePlaceholder({ src, fallbackSrc, alt = '', category, label, variant = 'rounded', className = '', loading = 'lazy', fetchPriority, sizes, width, height }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)
  const imgRef = useRef(null)
  useEffect(() => { setCurrentSrc(src); setLoaded(false); setFailed(false) }, [src])
  // A cached image can finish loading synchronously during mount, before the
  // onLoad handler below is attached — that "load" event is missed, and the
  // component gets stuck showing placeholder art over an image that's
  // actually already loaded. Checking `complete` after mount catches that case.
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setLoaded(true)
  }, [currentSrc])
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
    {currentSrc && !failed && <img className="image-placeholder__image" src={currentSrc} alt={alt} loading={loading} ref={(node) => { imgRef.current = node; if (node && fetchPriority) node.setAttribute('fetchpriority', fetchPriority) }} sizes={sizes} decoding="async" width={width} height={height} onLoad={() => setLoaded(true)} onError={handleError} />}
    {showPlaceholder && <div className="image-placeholder__art" aria-hidden="true"><span className="image-placeholder__orb image-placeholder__orb--sage" /><span className="image-placeholder__orb image-placeholder__orb--mauve" /><span className="image-placeholder__arch" /><Sparkles className="image-placeholder__spark" size={18} /></div>}
    {(category || label) && <div className="image-placeholder__caption">{category && <span>{category}</span>}{label && <small><ImageIcon size={12} />{label}</small>}</div>}
  </div>
}
