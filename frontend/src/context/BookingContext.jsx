import { useCallback, useMemo, useState } from 'react'
import { BookingContext } from './booking-context'

const initialBooking = { services: [], addons: [], date: '', time: '', customer: { fullName: '', email: '', phone: '' }, note: '' }
export function BookingProvider({ children }) {
  const [booking, setBooking] = useState(initialBooking)
  const updateBooking = useCallback((changes) => {
    setBooking((current) => {
      const nextChanges = typeof changes === 'function' ? changes(current) : changes
      return { ...current, ...nextChanges }
    })
  }, [])
  const resetBooking = useCallback(() => setBooking(initialBooking), [])
  const value = useMemo(() => ({ booking, updateBooking, resetBooking }), [booking, updateBooking, resetBooking])
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}
