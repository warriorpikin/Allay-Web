import { useContext } from 'react'
import { SiteModeContext } from '../context/site-mode-context'

export function useSiteMode() {
  const context = useContext(SiteModeContext)
  if (!context) throw new Error('useSiteMode must be used within SiteModeProvider')
  return context
}
