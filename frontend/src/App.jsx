import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { BookingProvider } from './context/BookingContext'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  return <AuthProvider><BookingProvider><AppRoutes /><Toaster position="top-center" toastOptions={{ className: 'allay-toast', duration: 4200 }} /></BookingProvider></AuthProvider>
}

