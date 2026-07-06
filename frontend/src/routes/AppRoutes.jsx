import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from '../components/layout/AdminLayout'
import PublicLayout from '../components/layout/PublicLayout'
import AuthLayout from '../components/layout/AuthLayout'
import AdminLogin from '../pages/admin/AdminLogin'
import Availability from '../pages/admin/Availability'
import BookingDetails from '../pages/admin/BookingDetails'
import Bookings from '../pages/admin/Bookings'
import Dashboard from '../pages/admin/Dashboard'
import EmailLogs from '../pages/admin/EmailLogs'
import Payments from '../pages/admin/Payments'
import ServicesManager from '../pages/admin/ServicesManager'
import Settings from '../pages/admin/Settings'
import WaitlistManager from '../pages/admin/WaitlistManager'
import SignIn from '../pages/auth/SignIn'
import SignUp from '../pages/auth/SignUp'
import About from '../pages/public/About'
import Booking from '../pages/public/Booking'
import BookingSuccess from '../pages/public/BookingSuccess'
import Contact from '../pages/public/Contact'
import Home from '../pages/public/Home'
import NotFound from '../pages/public/NotFound'
import ServiceDetail from '../pages/public/ServiceDetail'
import Services from '../pages/public/Services'
import Waitlist from '../pages/public/Waitlist'
import ProtectedRoute from './ProtectedRoute'

export default function AppRoutes() {
  return <Routes>
    <Route element={<PublicLayout />}>
      <Route index element={<Home />} />
      <Route path="services" element={<Services />} />
      <Route path="services/:slug" element={<ServiceDetail />} />
      <Route path="book" element={<Booking />} />
      <Route path="booking-success" element={<BookingSuccess />} />
      <Route path="about" element={<About />} />
      <Route path="contact" element={<Contact />} />
      <Route path="*" element={<NotFound />} />
    </Route>

    <Route path="waitlist" element={<Waitlist />} />
    <Route path="join-allay" element={<Navigate to="/waitlist" replace />} />
    <Route path="auth" element={<AuthLayout />}>
      <Route path="sign-in" element={<SignIn />} />
      <Route path="sign-up" element={<SignUp />} />
    </Route>
    <Route path="allay-admin/login" element={<AdminLogin />} />
    <Route element={<ProtectedRoute />}>
      <Route path="allay-admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="bookings/:id" element={<BookingDetails />} />
        <Route path="services" element={<ServicesManager />} />
        <Route path="availability" element={<Availability />} />
        <Route path="waitlist" element={<WaitlistManager />} />
        <Route path="payments" element={<Payments />} />
        <Route path="email-logs" element={<EmailLogs />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Route>
    <Route path="allay-admin/overview" element={<Navigate to="/allay-admin" replace />} />
  </Routes>
}
