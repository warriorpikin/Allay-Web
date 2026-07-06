import { format, isValid, parseISO } from 'date-fns'

export function formatDate(value, pattern = 'EEEE, d MMMM yyyy') {
  const date = value instanceof Date ? value : parseISO(value)
  return isValid(date) ? format(date, pattern) : 'Date to be confirmed'
}

