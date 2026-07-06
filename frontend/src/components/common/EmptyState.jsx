import { Flower2 } from 'lucide-react'

export default function EmptyState({ title = 'Nothing here yet', message = 'This space is ready for the next phase.', action }) {
  return <div className="empty-state"><Flower2 size={28} strokeWidth={1.2} /><h3>{title}</h3><p>{message}</p>{action}</div>
}

