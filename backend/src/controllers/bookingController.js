import { z } from 'zod'
import { createBookingRequest } from '../services/bookingService.js'
import { normalizeBookingTime } from '../utils/timeSlots.js'

const bookingSchema = z.object({
  customerName: z.string().trim().min(2),
  customerEmail: z.string().trim().email(),
  customerPhone: z.string().trim().min(5),
  selectedServices: z.array(z.object({
    id: z.string().optional(),
    serviceId: z.string().optional(),
    slug: z.string().optional(),
  }).passthrough()).min(1),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferredTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  customerNote: z.string().trim().max(1000).optional().default(''),
})

export async function createBooking(req, res, next) {
  try {
    const parsed = bookingSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter valid booking details.' })
    const preferredTime = normalizeBookingTime(parsed.data.preferredTime)
    if (!preferredTime) return res.status(400).json({ message: 'Enter a valid preferred time.' })
    const result = await createBookingRequest({ ...parsed.data, preferredTime })
    return res.status(201).json({
      bookingReference: result.bookingReference,
      booking: result.booking,
      services: result.services,
    })
  } catch (error) {
    if (error.status === 409) return res.status(409).json({ message: error.message, reason: error.reason, suggestedTimes: error.suggestedTimes || [] })
    return next(error)
  }
}
