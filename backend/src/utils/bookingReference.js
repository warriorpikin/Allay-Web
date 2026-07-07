export function generateBookingReference() {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `ALLAY-${datePart}-${randomPart}`
}
