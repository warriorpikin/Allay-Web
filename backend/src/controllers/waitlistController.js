import { z } from 'zod'
import { joinWaitlist, listWaitlistEntries, sendCouponEmailsToWaitlist } from '../services/waitlistService.js'

const waitlistSchema = z.object({
  email: z.string().trim().email(),
  selectedServices: z.array(z.union([
    z.string(),
    z.object({ id: z.string().optional(), serviceId: z.string().optional(), slug: z.string().optional() }).passthrough(),
  ])).min(1, 'Choose at least one service.'),
  fullName: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  note: z.string().trim().max(1000).optional(),
})

export async function createWaitlistEntry(req, res, next) {
  try {
    const parsed = waitlistSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter a valid email and at least one service.' })

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
