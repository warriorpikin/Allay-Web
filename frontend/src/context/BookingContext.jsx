import { useMemo, useState } from 'react'
import { BookingContext } from './booking-context'

const initialBooking = { service: null, addons: [], date: '', time: '', customer: null, note: '' }
export function BookingProvider({ children }) {
  const [booking, setBooking] = useState(initialBooking)
  const updateBooking = (changes) => setBooking((current) => ({ ...current, ...changes }))
  const resetBooking = () => setBooking(initialBooking)
  const value = useMemo(() => ({ booking, updateBooking, resetBooking }), [booking])
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}
