import { z } from 'zod'
import { query } from '../config/database.js'

const contactSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(5).max(2000),
})

export async function createContactMessage(req, res, next) {
  try {
    const parsed = contactSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter your name, a valid email, and a message.' })

    await query(
      'INSERT INTO contact_messages (full_name, email, phone, message) VALUES ($1, $2, $3, $4)',
      [parsed.data.fullName, parsed.data.email.toLowerCase(), parsed.data.phone || null, parsed.data.message],
    )
    return res.status(201).json({ message: 'Your message has been sent to the Allay House team.' })
  } catch (error) {
    return next(error)
  }
}
