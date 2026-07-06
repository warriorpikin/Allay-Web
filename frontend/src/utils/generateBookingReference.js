export function generateBookingReference() {
  const stamp = Date.now().toString(36).toUpperCase()
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `ALY-${stamp}-${suffix}`
}

