import { useEffect, useMemo, useState } from 'react'
import { getSiteMode } from '../services/settingsApi'
import { SiteModeContext } from './site-mode-context'

export function SiteModeProvider({ children }) {
  const [mode, setMode] = useState('prelaunch')
  const [waitlistEnabled, setWaitlistEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getSiteMode()
      .then((data) => {
        setMode(data.mode === 'live' ? 'live' : 'prelaunch')
        setWaitlistEnabled(data.waitlistEnabled !== false)
      })
      .catch(() => setMode('prelaunch'))
      .finally(() => setIsLoading(false))
  }, [])

  const value = useMemo(() => ({ mode, isLive: mode === 'live', waitlistEnabled, isLoading }), [mode, waitlistEnabled, isLoading])
  return <SiteModeContext.Provider value={value}>{children}</SiteModeContext.Provider>
}
