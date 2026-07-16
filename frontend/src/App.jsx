import { Helmet } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { BookingProvider } from './context/BookingContext'
import { SiteModeProvider } from './context/SiteModeContext'
import AnalyticsConsentBanner from './components/analytics/AnalyticsConsentBanner'
import AnalyticsRouteTracker from './components/analytics/AnalyticsRouteTracker'
import PromotionManager from './components/promotions/PromotionManager'
import AppRoutes from './routes/AppRoutes'
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from './utils/structuredData'

const siteVerification = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION

export default function App() {
  return <SiteModeProvider><AuthProvider><AdminAuthProvider><BookingProvider>
    <Helmet>
      {siteVerification && <meta name="google-site-verification" content={siteVerification} />}
      <script type="application/ld+json">{JSON.stringify(buildOrganizationJsonLd())}</script>
      <script type="application/ld+json">{JSON.stringify(buildWebSiteJsonLd())}</script>
    </Helmet>
    <AnalyticsRouteTracker /><AppRoutes /><PromotionManager /><AnalyticsConsentBanner /><Toaster position="top-center" toastOptions={{ className: 'allay-toast', duration: 4200 }} />
  </BookingProvider></AdminAuthProvider></AuthProvider></SiteModeProvider>
}
