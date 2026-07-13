import { useCallback, useEffect, useMemo, useState } from 'react'
import { getSiteMode } from '../services/settingsApi'
import { SiteModeContext } from './site-mode-context'

const SITE_MODE_SYNC_KEY = 'allay:site-mode-state'
const SITE_MODE_CHANNEL = 'allay:site-mode'

function normalizeSiteMode(data = {}) {
  return {
    mode: data.mode === 'live' ? 'live' : 'prelaunch',
    waitlistEnabled: data.waitlistEnabled !== false,
  }
}

export function SiteModeProvider({ children }) {
  const [mode, setMode] = useState('prelaunch')
  const [waitlistEnabled, setWaitlistEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  const applySiteMode = useCallback((data = {}, options = {}) => {
    const next = normalizeSiteMode(data)
    setMode(next.mode)
    setWaitlistEnabled(next.waitlistEnabled)
    if (options.broadcast === false) return
    try {
      localStorage.setItem(SITE_MODE_SYNC_KEY, JSON.stringify({ ...next, updatedAt: Date.now() }))
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel(SITE_MODE_CHANNEL)
        channel.postMessage(next)
        channel.close()
      }
    } catch {
      return undefined
    }
  }, [])

  useEffect(() => {
    getSiteMode()
      .then((data) => applySiteMode(data, { broadcast: false }))
      .catch(() => setMode('prelaunch'))
      .finally(() => setIsLoading(false))
  }, [applySiteMode])

  useEffect(() => {
    const syncSiteMode = (event) => {
      if (event.key !== SITE_MODE_SYNC_KEY || !event.newValue) return
      try {
        applySiteMode(JSON.parse(event.newValue), { broadcast: false })
      } catch {
        return undefined
      }
    }
    window.addEventListener('storage', syncSiteMode)
    let channel
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(SITE_MODE_CHANNEL)
      channel.addEventListener('message', (event) => applySiteMode(event.data, { broadcast: false }))
    }
    return () => {
      window.removeEventListener('storage', syncSiteMode)
      channel?.close()
    }
  }, [applySiteMode])

  const value = useMemo(() => ({ mode, isLive: mode === 'live', waitlistEnabled, isLoading, applySiteMode }), [mode, waitlistEnabled, isLoading, applySiteMode])
  return <SiteModeContext.Provider value={value}>{children}</SiteModeContext.Provider>
}
