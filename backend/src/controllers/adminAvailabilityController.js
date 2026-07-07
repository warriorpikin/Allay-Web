import { z } from 'zod'
import { query } from '../config/database.js'

const time = z.string().regex(/^\d{2}:\d{2}$/)

const businessHoursSchema = z.object({
  openTime: time,
  closeTime: time,
  isOpen: z.boolean(),
  maxDailyBookings: z.coerce.number().int().min(0),
  maxBookingsPerSlot: z.coerce.number().int().min(0),
  slotIntervalMinutes: z.coerce.number().int().positive(),
})

const blockedPeriodSchema = z.object({
  title: z.string().trim().min(2),
  reason: z.string().trim().optional().default(''),
  startDatetime: z.string().min(10),
  endDatetime: z.string().min(10),
  isFullDay: z.boolean().default(false),
  blockType: z.string().trim().min(2).default('time_range'),
})

const capacityOverrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeSlot: time.nullish(),
  maxBookings: z.coerce.number().int().min(0),
  reason: z.string().trim().optional().default(''),
})

export async function listBusinessHours(req, res, next) {
  try {
    const result = await query(
      `SELECT id, day_of_week AS "dayOfWeek", open_time AS "openTime", close_time AS "closeTime", is_open AS "isOpen",
        max_daily_bookings AS "maxDailyBookings", max_bookings_per_slot AS "maxBookingsPerSlot", slot_interval_minutes AS "slotIntervalMinutes"
       FROM business_hours
       ORDER BY day_of_week ASC`,
    )
    res.json({ businessHours: result.rows })
  } catch (error) {
    next(error)
  }
}

export async function updateBusinessHours(req, res, next) {
  try {
    const parsed = businessHoursSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter valid business hour settings.' })
    const result = await query(
      `UPDATE business_hours
       SET open_time = $1, close_time = $2, is_open = $3, max_daily_bookings = $4, max_bookings_per_slot = $5, slot_interval_minutes = $6
       WHERE id = $7
       RETURNING id, day_of_week AS "dayOfWeek", open_time AS "openTime", close_time AS "closeTime", is_open AS "isOpen",
        max_daily_bookings AS "maxDailyBookings", max_bookings_per_slot AS "maxBookingsPerSlot", slot_interval_minutes AS "slotIntervalMinutes"`,
      [parsed.data.openTime, parsed.data.closeTime, parsed.data.isOpen, parsed.data.maxDailyBookings, parsed.data.maxBookingsPerSlot, parsed.data.slotIntervalMinutes, req.params.id],
    )
    if (!result.rows[0]) return res.status(404).json({ message: 'Business hours not found.' })
    return res.json({ businessHours: result.rows[0] })
  } catch (error) {
    return next(error)
  }
}

export async function listBlockedPeriods(req, res, next) {
  try {
    const result = await query(
      `SELECT id, title, reason, start_datetime AS "startDatetime", end_datetime AS "endDatetime", is_full_day AS "isFullDay", block_type AS "blockType", created_at AS "createdAt"
       FROM blocked_periods
       ORDER BY start_datetime DESC`,
    )
    res.json({ blockedPeriods: result.rows })
  } catch (error) {
    next(error)
  }
}

export async function createBlockedPeriod(req, res, next) {
  try {
    const parsed = blockedPeriodSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter a valid blocked period.' })
    const result = await query(
      `INSERT INTO blocked_periods (title, reason, start_datetime, end_datetime, is_full_day, block_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, reason, start_datetime AS "startDatetime", end_datetime AS "endDatetime", is_full_day AS "isFullDay", block_type AS "blockType", created_at AS "createdAt"`,
      [parsed.data.title, parsed.data.reason || null, parsed.data.startDatetime, parsed.data.endDatetime, parsed.data.isFullDay, parsed.data.blockType, req.admin?.sub || null],
    )
    return res.status(201).json({ blockedPeriod: result.rows[0] })
  } catch (error) {
    return next(error)
  }
}

export async function deleteBlockedPeriod(req, res, next) {
  try {
    await query('DELETE FROM blocked_periods WHERE id = $1', [req.params.id])
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
}

export async function listCapacityOverrides(req, res, next) {
  try {
    const result = await query(
      `SELECT id, date, time_slot AS "timeSlot", max_bookings AS "maxBookings", reason, created_at AS "createdAt"
       FROM booking_capacity_overrides
       ORDER BY date DESC, time_slot ASC NULLS FIRST`,
    )
    res.json({ capacityOverrides: result.rows })
  } catch (error) {
    next(error)
  }
}

export async function createCapacityOverride(req, res, next) {
  try {
    const parsed = capacityOverrideSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter a valid capacity override.' })
    const result = await query(
      `INSERT INTO booking_capacity_overrides (date, time_slot, max_bookings, reason)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (date, time_slot) DO UPDATE SET max_bookings = EXCLUDED.max_bookings, reason = EXCLUDED.reason
       RETURNING id, date, time_slot AS "timeSlot", max_bookings AS "maxBookings", reason, created_at AS "createdAt"`,
      [parsed.data.date, parsed.data.timeSlot || null, parsed.data.maxBookings, parsed.data.reason || null],
    )
    return res.status(201).json({ capacityOverride: result.rows[0] })
  } catch (error) {
    return next(error)
  }
}

export async function deleteCapacityOverride(req, res, next) {
  try {
    await query('DELETE FROM booking_capacity_overrides WHERE id = $1', [req.params.id])
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
}
