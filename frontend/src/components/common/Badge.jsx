export default function Badge({ children, status = 'unpaid' }) {
  return <span className={`status-badge status-badge--${status}`}>{children}</span>
}

