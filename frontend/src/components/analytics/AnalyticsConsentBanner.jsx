import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Button from '../common/Button'
import { getAnalyticsConsent, isAdminPath, setAnalyticsConsent, trackPageView } from '../../services/analytics'

export default function AnalyticsConsentBanner() {
  const { pathname } = useLocation()
  const [choice, setChoice] = useState(() => getAnalyticsConsent())

  useEffect(() => {
    const reset = () => setChoice('unset')
    window.addEventListener('allay:analytics-consent-reset', reset)
    return () => window.removeEventListener('allay:analytics-consent-reset', reset)
  }, [])

  if (isAdminPath(pathname) || choice !== 'unset') return null

  const choose = (nextChoice) => {
    setAnalyticsConsent(nextChoice)
    setChoice(nextChoice)
    if (nextChoice === 'granted') trackPageView({ pathname, title: document.title })
  }

  return <section className="analytics-consent" aria-label="Cookie preferences">
    <div>
      <span className="eyebrow">Cookie choice</span>
      <p>We use essential cookies to keep the website working and optional analytics cookies to understand how visitors use Allay House. You can accept or reject optional cookies.</p>
      <Link to="/privacy-policy">Privacy details</Link>
    </div>
    <div className="analytics-consent__actions">
      <Button type="button" size="sm" onClick={() => choose('granted')}>Accept all</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => choose('denied')}>Reject optional</Button>
    </div>
  </section>
}
