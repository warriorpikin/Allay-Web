import { LoaderCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Button({ children, variant = 'primary', size = 'md', loading = false, to, className = '', type = 'button', ...props }) {
  const classes = `button button--${variant} button--${size} ${className}`.trim()
  const content = <>{loading && <LoaderCircle className="spin" size={16} />}<span>{loading ? 'Please wait' : children}</span></>
  if (to) return <Link className={classes} to={to} {...props}>{content}</Link>
  return <button className={classes} type={type} disabled={loading || props.disabled} {...props}>{content}</button>
}

