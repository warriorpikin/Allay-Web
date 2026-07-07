export function timeToMinutes(time) {
  if (!time) return 0
  const [hours, minutes] = String(time).slice(0, 5).split(':').map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function addMinutesToTime(time, durationMinutes) {
  return minutesToTime(timeToMinutes(time) + Number(durationMinutes || 0))
}

export function generateTimeSlots({ openTime, closeTime, intervalMinutes = 30, durationMinutes = 30 }) {
  const open = timeToMinutes(openTime)
  const close = timeToMinutes(closeTime)
  const interval = Math.max(Number(intervalMinutes) || 30, 1)
  const duration = Math.max(Number(durationMinutes) || interval, interval)
  const lastStart = close - duration
  const slots = []

  for (let cursor = open; cursor <= lastStart; cursor += interval) {
    slots.push(minutesToTime(cursor))
  }

  return slots
}

export function sortSlotsByPreferredTime(slots, preferredTime) {
  const preferred = timeToMinutes(preferredTime)
  return [...slots].sort((a, b) => Math.abs(timeToMinutes(a.time) - preferred) - Math.abs(timeToMinutes(b.time) - preferred))
}
