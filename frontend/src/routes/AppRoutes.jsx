import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from '../components/layout/AdminLayout'
import PublicLayout from '../components/layout/PublicLayout'
import AuthLayout from '../components/layout/AuthLayout'
import Loader from '../components/common/Loader'
import Home from '../pages/public/Home'
import Landing from '../pages/public/Landing'
import ProtectedRoute from './ProtectedRoute'

const AdminLogin = lazy(() => import('../pages/admin/AdminLogin'))
const Analytics = lazy(() => import('../pages/admin/Analytics'))
const Availability = lazy(() => import('../pages/admin/Availability'))
const BookingDetails = lazy(() => import('../pages/admin/BookingDetails'))
const Bookings = lazy(() => import('../pages/admin/Bookings'))
const Customers = lazy(() => import('../pages/admin/Customers'))
const AdminEmails = lazy(() => import('../pages/admin/AdminEmails'))
const Dashboard = lazy(() => import('../pages/admin/Dashboard'))
const EmailLogs = lazy(() => import('../pages/admin/EmailLogs'))
const MembershipsManager = lazy(() => import('../pages/admin/MembershipsManager'))
const Promotions = lazy(() => import('../pages/admin/Promotions'))
const ServicesManager = lazy(() => import('../pages/admin/ServicesManager'))
const Settings = lazy(() => import('../pages/admin/Settings'))
const Testimonials = lazy(() => import('../pages/admin/Testimonials'))
const Users = lazy(() => import('../pages/admin/Users'))
const WaitlistManager = lazy(() => import('../pages/admin/WaitlistManager'))
const SignIn = lazy(() => import('../pages/auth/SignIn'))
const SignUp = lazy(() => import('../pages/auth/SignUp'))
const About = lazy(() => import('../pages/public/About'))
const Booking = lazy(() => import('../pages/public/Booking'))
const BookingSuccess = lazy(() => import('../pages/public/BookingSuccess'))
const Contact = lazy(() => import('../pages/public/Contact'))
const MembershipDetail = lazy(() => import('../pages/public/MembershipDetail'))
const Memberships = lazy(() => import('../pages/public/Memberships'))
const NotFound = lazy(() => import('../pages/public/NotFound'))
const PrivacyPolicy = lazy(() => import('../pages/public/PrivacyPolicy'))
const ServiceDetail = lazy(() => import('../pages/public/ServiceDetail'))
const Services = lazy(() => import('../pages/public/Services'))
const TermsOfUse = lazy(() => import('../pages/public/TermsOfUse'))
const Waitlist = lazy(() => import('../pages/public/Waitlist'))

export default function AppRoutes() {
  return <Suspense fallback={<Loader label="Preparing Allay House" />}><Routes>
    <Route element={<PublicLayout />}>
      <Route index element={<Home />} />
      <Route path="services" element={<Services />} />
      <Route path="services/category/:categorySlug" element={<Services />} />
      <Route path="services/:slug" element={<ServiceDetail />} />
      <Route path="memberships" element={<Memberships />} />
      <Route path="memberships/:slug" element={<MembershipDetail />} />
      <Route path="book" element={<Booking />} />
      <Route path="booking-success" element={<BookingSuccess />} />
      <Route path="about" element={<About />} />
      <Route path="contact" element={<Contact />} />
      <Route path="privacy-policy" element={<PrivacyPolicy />} />
      <Route path="terms-of-use" element={<TermsOfUse />} />
      <Route path="*" element={<NotFound />} />
    </Route>

    <Route path="landing" element={<Landing />} />
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
        <Route path="analytics" element={<Analytics />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="bookings/:id" element={<BookingDetails />} />
        <Route path="users" element={<Users />} />
        <Route path="customers" element={<Customers />} />
        <Route path="services" element={<ServicesManager />} />
        <Route path="memberships" element={<MembershipsManager />} />
        <Route path="testimonials" element={<Testimonials />} />
        <Route path="promotions" element={<Promotions />} />
        <Route path="availability" element={<Availability />} />
        <Route path="waitlist" element={<WaitlistManager />} />
        <Route path="payments" element={<Navigate to="/allay-admin/bookings" replace />} />
        <Route path="emails" element={<AdminEmails />} />
        <Route path="email-logs" element={<EmailLogs />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Route>
    <Route path="allay-admin/overview" element={<Navigate to="/allay-admin" replace />} />
  </Routes></Suspense>
}
