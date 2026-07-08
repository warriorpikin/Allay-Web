import { query } from '../config/database.js'
import { getSetting } from './settingsService.js'
import { addMinutesToTime, generateTimeSlots, sortSlotsByPreferredTime, timeToMinutes } from '../utils/timeSlots.js'

const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'no_show']
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function dayOfWeek(date) {
  return new Date(`${date}T00:00:00.000Z`).getUTCDay()
}

function normalizeTime(time) {
  return String(time || '').slice(0, 5)
}

async function checkNotInPast(date, startTime) {
  const target = new Date(`${date}T${normalizeTime(startTime)}:00.000Z`)
  if (Number.isNaN(target.getTime())) return { available: true }

  const bookingSettings = await getSetting('booking')
  const minimumNoticeMinutes = Math.max(Number(bookingSettings?.value?.minimum_notice_minutes) || 0, 0)
  const threshold = new Date(Date.now() + minimumNoticeMinutes * 60_000)

  if (target.getTime() < threshold.getTime()) {
    return {
      available: false,
      reason: 'past',
      message: minimumNoticeMinutes > 0
        ? `Please choose a time at least ${minimumNoticeMinutes} minutes from now.`
        : 'This time has already passed. Please choose an upcoming time.',
      remainingCapacity: 0,
    }
  }
  return { available: true }
}

function normalizeServiceIds(serviceIds = []) {
  const values = typeof serviceIds === 'string' ? serviceIds.split(',') : Array.isArray(serviceIds) ? serviceIds : []
  return values.map((id) => String(id).trim()).filter((id) => UUID_PATTERN.test(id))
}

export async function getBusinessHoursForDate(date) {
  const result = await query('SELECT * FROM business_hours WHERE day_of_week = $1 LIMIT 1', [dayOfWeek(date)])
  return result.rows[0] || null
}

export async function getBlockedPeriodsForDate(date) {
  const result = await query(
    `SELECT *
     FROM blocked_periods
     WHERE start_datetime < ($1::date + INTERVAL '1 day')
       AND end_datetime > $1::date
     ORDER BY start_datetime ASC`,
    [date],
  )
  return result.rows
}

export async function isDateBlocked(date) {
  const blocked = await getBlockedPeriodsForDate(date)
  return blocked.length ? { blocked: true, period: blocked[0] } : { blocked: false, period: null }
}

export async function isTimeRangeBlocked(date, startTime, endTime) {
  const result = await query(
    `SELECT *
     FROM blocked_periods
     WHERE start_datetime < ($1::date + $3::time)
       AND end_datetime > ($1::date + $2::time)
     ORDER BY start_datetime ASC
     LIMIT 1`,
    [date, normalizeTime(startTime), normalizeTime(endTime)],
  )
  return result.rows[0] ? { blocked: true, period: result.rows[0] } : { blocked: false, period: null }
}

export async function getDailyBookingCount(date) {
  const result = await query(
    'SELECT COUNT(*)::int AS count FROM bookings WHERE appointment_date = $1 AND status = ANY($2)',
    [date, ACTIVE_BOOKING_STATUSES],
  )
  return result.rows[0]?.count || 0
}

export async function getBookingsForTimeRange(date, startTime, endTime) {
  const result = await query(
    `SELECT *
     FROM bookings
     WHERE appointment_date = $1
       AND status = ANY($4)
       AND start_time < $3::time
       AND end_time > $2::time
     ORDER BY start_time ASC`,
    [date, normalizeTime(startTime), normalizeTime(endTime), ACTIVE_BOOKING_STATUSES],
  )
  return result.rows
}

export async function getServiceBookingsForTimeRange(serviceIds, date, startTime, endTime) {
  const ids = normalizeServiceIds(serviceIds)
  if (!ids.length) return []
  const result = await query(
    `SELECT bs.service_id, COUNT(DISTINCT b.id)::int AS count
     FROM booking_services bs
     JOIN bookings b ON b.id = bs.booking_id
     WHERE bs.service_id = ANY($1::uuid[])
       AND b.appointment_date = $2
       AND b.status = ANY($5)
       AND b.start_time < $4::time
       AND b.end_time > $3::time
     GROUP BY bs.service_id`,
    [ids, date, normalizeTime(startTime), normalizeTime(endTime), ACTIVE_BOOKING_STATUSES],
  )
  return result.rows
}

async function getCapacityOverride(date, timeSlot) {
  const result = await query(
    `SELECT *
     FROM booking_capacity_overrides
     WHERE date = $1 AND (time_slot = $2::time OR time_slot IS NULL)
     ORDER BY (time_slot IS NULL) ASC
     LIMIT 1`,
    [date, timeSlot ? normalizeTime(timeSlot) : null],
  )
  return result.rows[0] || null
}

async function getServicesCapacity(serviceIds) {
  const ids = normalizeServiceIds(serviceIds)
  if (!ids.length) return []
  const result = await query(
    'SELECT id, name, COALESCE(simultaneous_capacity, 999999)::int AS simultaneous_capacity FROM services WHERE id = ANY($1::uuid[]) AND is_active = TRUE',
    [ids],
  )
  return result.rows
}

export async function checkSlotCapacity(date, startTime, endTime, serviceIds = []) {
  const pastCheck = await checkNotInPast(date, startTime)
  if (!pastCheck.available) return pastCheck

  const hours = await getBusinessHoursForDate(date)
  if (!hours || !hours.is_open) return { available: false, reason: 'closed', message: 'Allay House is closed on this date.', remainingCapacity: 0 }

  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  if (start < timeToMinutes(hours.open_time) || end > timeToMinutes(hours.close_time)) {
    return { available: false, reason: 'outside_business_hours', message: 'This time is outside business hours.', remainingCapacity: 0 }
  }

  const blocked = await isTimeRangeBlocked(date, startTime, endTime)
  if (blocked.blocked) {
    return { available: false, reason: 'blocked', message: 'Allay House is unavailable during this period.', remainingCapacity: 0 }
  }

  const dailyOverride = await getCapacityOverride(date, null)
  const maxDailyBookings = dailyOverride ? Number(dailyOverride.max_bookings) : Number(hours.max_daily_bookings)
  const dailyCount = await getDailyBookingCount(date)
  if (dailyCount >= maxDailyBookings) return { available: false, reason: 'date_full', message: 'This date is fully booked. Please select another day.', remainingCapacity: 0 }

  const timeOverride = await getCapacityOverride(date, startTime)
  const maxSlotBookings = timeOverride?.time_slot ? Number(timeOverride.max_bookings) : Number(hours.max_bookings_per_slot)
  const overlappingBookings = await getBookingsForTimeRange(date, startTime, endTime)
  if (overlappingBookings.length >= maxSlotBookings) return { available: false, reason: 'time_full', message: 'This time is full.', remainingCapacity: 0 }

  let remainingCapacity = Math.max(maxSlotBookings - overlappingBookings.length, 0)
  const services = await getServicesCapacity(serviceIds)
  const serviceCounts = await getServiceBookingsForTimeRange(serviceIds, date, startTime, endTime)
  const countsByService = new Map(serviceCounts.map((item) => [item.service_id, item.count]))

  for (const service of services) {
    const remainingForService = Number(service.simultaneous_capacity) - (countsByService.get(service.id) || 0)
    remainingCapacity = Math.min(remainingCapacity, Math.max(remainingForService, 0))
    if (remainingForService <= 0) {
      return { available: false, reason: 'service_full', message: `${service.name} is full at this time.`, remainingCapacity: 0 }
    }
  }

  return { available: true, reason: 'available', message: 'Available', remainingCapacity }
}

export async function getAvailableTimeSlots(date, serviceIds = [], durationMinutes = 30) {
  const hours = await getBusinessHoursForDate(date)
  if (!hours || !hours.is_open) return []

  const slots = generateTimeSlots({
    openTime: hours.open_time,
    closeTime: hours.close_time,
    intervalMinutes: hours.slot_interval_minutes,
    durationMinutes,
  })

  const checked = []
  for (const time of slots) {
    const endTime = addMinutesToTime(time, durationMinutes)
    const status = await checkSlotCapacity(date, time, endTime, serviceIds)
    checked.push({ time, available: status.available, reason: status.reason, message: status.message, remainingCapacity: status.remainingCapacity })
  }
  return checked
}

export async function suggestAvailableTimes(date, preferredTime, serviceIds = [], durationMinutes = 30, limit = 4) {
  const slots = await getAvailableTimeSlots(date, serviceIds, durationMinutes)
  return sortSlotsByPreferredTime(slots.filter((slot) => slot.available && slot.time !== normalizeTime(preferredTime)), preferredTime)
    .slice(0, limit)
    .map((slot) => slot.time)
}

export async function checkAvailability({ date, preferredTime, serviceIds = [], totalDurationMinutes = 30 }) {
  const endTime = addMinutesToTime(preferredTime, totalDurationMinutes)
  const status = await checkSlotCapacity(date, preferredTime, endTime, serviceIds)
  const suggestedTimes = status.available ? [] : await suggestAvailableTimes(date, preferredTime, serviceIds, totalDurationMinutes)
  return { ...status, available: status.available, suggestedTimes }
}

export async function getAvailabilityDays({ month, year, serviceIds = [], durationMinutes = 30 }) {
  const monthIndex = Number(month) - 1
  const lastDay = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate()
  const days = []

  for (let day = 1; day <= lastDay; day += 1) {
    const date = new Date(Date.UTC(Number(year), monthIndex, day)).toISOString().slice(0, 10)
    const hours = await getBusinessHoursForDate(date)
    const blocked = await isDateBlocked(date)
    const slots = !blocked.blocked && hours?.is_open ? await getAvailableTimeSlots(date, serviceIds, durationMinutes) : []
    const hasAvailableSlot = slots.some((slot) => slot.available)
    days.push({
      date,
      isAvailable: Boolean(hours?.is_open && !blocked.blocked && hasAvailableSlot),
      isFullyBooked: Boolean(hours?.is_open && !blocked.blocked && !hasAvailableSlot),
      isBlocked: blocked.blocked || !hours?.is_open,
      reason: blocked.blocked ? blocked.period?.reason || blocked.period?.title || 'Blocked' : !hours?.is_open ? 'Closed' : !hasAvailableSlot ? 'Fully booked' : null,
    })
  }

  return days
}
