import { Star } from 'lucide-react'

function clampRating(value) {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return 0
  return Math.min(Math.max(Math.round(numeric * 2) / 2, 0), 5)
}

export default function StarRating({ rating = 0, className = '' }) {
  const safeRating = clampRating(rating)
  return <span className={`star-rating ${className}`.trim()} aria-label={`Rated ${safeRating} out of 5`}>
    {Array.from({ length: 5 }, (_, index) => {
      const position = index + 1
      const full = safeRating >= position
      const half = !full && safeRating >= position - 0.5
      return <span className="star-rating__star" key={position} aria-hidden="true">
        <Star className="star-rating__outline" size={17} />
        {(full || half) && <span className={`star-rating__fill ${half ? 'is-half' : ''}`}><Star size={17} /></span>}
      </span>
    })}
  </span>
}
