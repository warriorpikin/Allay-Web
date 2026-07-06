import Button from '../../components/common/Button'

export default function NotFound() {
  return <section className="not-found section"><span className="eyebrow">404 · A quiet wrong turn</span><h1>This room is not part of the house.</h1><p>The page may have moved, or it may not be open yet.</p><Button to="/">Return home</Button></section>
}

