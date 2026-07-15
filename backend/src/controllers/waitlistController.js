import { z } from 'zod'
import { joinWaitlist, listWaitlistEntries, sendCouponEmailsToWaitlist } from '../services/waitlistService.js'
import { isValidPhoneNumber } from '../utils/phoneValidation.js'

const waitlistSchema = z.object({
  email: z.string().trim().min(1, 'Please enter your email address.').email('Please enter your email address.'),
  selectedServices: z.array(z.union([
    z.string(),
    z.object({ id: z.string().optional(), serviceId: z.string().optional(), slug: z.string().optional() }).passthrough(),
  ])).min(1, 'Please select at least one service.'),
  fullName: z.string().trim().min(2, 'Please enter your full name.').max(160, 'Full name is too long.'),
  phone: z.string().trim().min(1, 'Please enter a valid phone number.').max(40, 'Please enter a valid phone number.')
    .refine(isValidPhoneNumber, 'Please enter a valid phone number.'),
  note: z.string().trim().max(1000).optional(),
})

export async function createWaitlistEntry(req, res, next) {
  try {
    const parsed = waitlistSchema.safeParse(req.body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Enter a valid email and at least one service.'
      return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message })
    }

    const { entry, services, confirmationEmail } = await joinWaitlist(parsed.data)
    return res.status(201).json({
      message: 'You are on the Allay House waitlist.',
      waitlistEntry: { id: entry.id, email: entry.email, status: entry.status },
      services: services.map((service) => ({ id: service.id, name: service.name, slug: service.slug })),
      email: { confirmationSent: Boolean(confirmationEmail?.sent), skippedDuplicate: Boolean(confirmationEmail?.skipped) },
    })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message })
    return next(error)
  }
}

export async function listWaitlist(req, res, next) {
  try {
    const entries = await listWaitlistEntries()
    return res.json({ waitlist: entries })
  } catch (error) {
    return next(error)
  }
}

export async function sendWaitlistCoupons(req, res, next) {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : []
    const result = await sendCouponEmailsToWaitlist({ ids })
    return res.json({ message: 'Coupon email run completed.', ...result })
  } catch (error) {
    return next(error)
  }
}
