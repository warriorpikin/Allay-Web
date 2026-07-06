import { useCallback, useMemo, useState } from 'react'
import { BookingContext } from './booking-context'

const initialBooking = { services: [], addons: [], date: '', time: '', customer: { fullName: '', email: '', phone: '' }, note: '' }
export function BookingProvider({ children }) {
  const [booking, setBooking] = useState(initialBooking)
  const updateBooking = useCallback((changes) => setBooking((current) => ({ ...current, ...changes })), [])
  const resetBooking = useCallback(() => setBooking(initialBooking), [])
  const value = useMemo(() => ({ booking, updateBooking, resetBooking }), [booking, updateBooking, resetBooking])
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}
