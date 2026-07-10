import { z } from 'zod'
import { query } from '../config/database.js'
import { validateDiscountCode } from '../services/discountService.js'

const validateSchema = z.object({
  code: z.string().trim().min(1),
  serviceIds: z.array(z.string()).default([]),
  subtotal: z.coerce.number().min(0).default(0),
})

export async function validateBookingDiscount(req, res, next) {
  try {
    const parsed = validateSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter a valid discount code.' })
    const services = parsed.data.serviceIds.length
      ? await query(
        `SELECT id, price, is_discount_eligible
         FROM services
         WHERE id::text = ANY($1) AND is_active = TRUE`,
        [parsed.data.serviceIds],
      )
      : { rows: [] }
    const result = await validateDiscountCode({ code: parsed.data.code, services: services.rows, subtotal: parsed.data.subtotal })
    return res.json({
      ...result,
      formattedDiscount: new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(result.discountAmount),
    })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message })
    return next(error)
  }
}
