export default function Loader({ label = 'Loading' }) {
  return <div className="loader" role="status"><span /><p>{label}…</p></div>
}

