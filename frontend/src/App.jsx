import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { BookingProvider } from './context/BookingContext'
import { SiteModeProvider } from './context/SiteModeContext'
import AnalyticsConsentBanner from './components/analytics/AnalyticsConsentBanner'
import AnalyticsRouteTracker from './components/analytics/AnalyticsRouteTracker'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  return <SiteModeProvider><AuthProvider><AdminAuthProvider><BookingProvider><AnalyticsRouteTracker /><AppRoutes /><AnalyticsConsentBanner /><Toaster position="top-center" toastOptions={{ className: 'allay-toast', duration: 4200 }} /></BookingProvider></AdminAuthProvider></AuthProvider></SiteModeProvider>
}
