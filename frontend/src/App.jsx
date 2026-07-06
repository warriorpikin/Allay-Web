import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { BookingProvider } from './context/BookingContext'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  return <AuthProvider><AdminAuthProvider><BookingProvider><AppRoutes /><Toaster position="top-center" toastOptions={{ className: 'allay-toast', duration: 4200 }} /></BookingProvider></AdminAuthProvider></AuthProvider>
}
