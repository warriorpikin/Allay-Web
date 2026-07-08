import { z } from 'zod'
import { checkAvailability, getAvailabilityDays, getAvailableTimeSlots } from '../services/availabilityService.js'
import { normalizeBookingTime } from '../utils/timeSlots.js'

const daysQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2024).max(2100),
  serviceIds: z.string().optional(),
  durationMinutes: z.coerce.number().int().positive().default(30),
})

const timesQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serviceIds: z.string().optional(),
  durationMinutes: z.coerce.number().int().positive().default(30),
})

const checkSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferredTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  serviceIds: z.array(z.string()).default([]),
  totalDurationMinutes: z.coerce.number().int().positive(),
})

export async function listAvailabilityDays(req, res, next) {
  try {
    const parsed = daysQuerySchema.safeParse(req.query)
    if (!parsed.success) return res.status(400).json({ message: 'Enter a valid month and year.' })
    const days = await getAvailabilityDays({
      month: parsed.data.month,
      year: parsed.data.year,
      serviceIds: parsed.data.serviceIds,
      durationMinutes: parsed.data.durationMinutes,
    })
    return res.json({ days })
  } catch (error) {
    return next(error)
  }
}

export async function listAvailabilityTimes(req, res, next) {
  try {
    const parsed = timesQuerySchema.safeParse(req.query)
    if (!parsed.success) return res.status(400).json({ message: 'Enter a valid date.' })
    const times = await getAvailableTimeSlots(parsed.data.date, parsed.data.serviceIds, parsed.data.durationMinutes)
    return res.json({ times })
  } catch (error) {
    return next(error)
  }
}

export async function checkPreferredAvailability(req, res, next) {
  try {
    const parsed = checkSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter a valid date, time, and service selection.' })
    const preferredTime = normalizeBookingTime(parsed.data.preferredTime)
    if (!preferredTime) return res.status(400).json({ message: 'Enter a valid preferred time.' })
    const result = await checkAvailability({ ...parsed.data, preferredTime })
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}
