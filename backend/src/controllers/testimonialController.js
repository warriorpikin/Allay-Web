import { z } from 'zod'
import { query } from '../config/database.js'

const testimonialSchema = z.object({
  customerName: z.string().trim().min(2),
  profileImageUrl: z.string().trim().optional().default(''),
  testimonialText: z.string().trim().min(8),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  isActive: z.coerce.boolean().default(true),
  displayOrder: z.coerce.number().int().min(0).default(0),
})

function mapTestimonial(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    profileImageUrl: row.profile_image_url,
    testimonialText: row.testimonial_text,
    rating: Number(row.rating || 5),
    isActive: row.is_active,
    displayOrder: Number(row.display_order || 0),
    createdAt: row.created_at,
  }
}

export async function listTestimonials(req, res, next) {
  try {
    const result = await query(
      `SELECT *
       FROM testimonials
       WHERE is_active = TRUE
       ORDER BY display_order ASC, created_at DESC
       LIMIT 12`,
    )
    return res.json({ testimonials: result.rows.map(mapTestimonial) })
  } catch (error) {
    return next(error)
  }
}

export async function listAdminTestimonials(req, res, next) {
  try {
    const result = await query(
      `SELECT *
       FROM testimonials
       ORDER BY display_order ASC, created_at DESC`,
    )
    return res.json({ testimonials: result.rows.map(mapTestimonial) })
  } catch (error) {
    return next(error)
  }
}

export async function createAdminTestimonial(req, res, next) {
  try {
    const parsed = testimonialSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter valid testimonial details.' })
    const result = await query(
      `INSERT INTO testimonials (customer_name, profile_image_url, testimonial_text, rating, is_active, display_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        parsed.data.customerName,
        parsed.data.profileImageUrl || null,
        parsed.data.testimonialText,
        parsed.data.rating,
        parsed.data.isActive,
        parsed.data.displayOrder,
      ],
    )
    return res.status(201).json({ testimonial: mapTestimonial(result.rows[0]) })
  } catch (error) {
    return next(error)
  }
}

export async function updateAdminTestimonial(req, res, next) {
  try {
    const parsed = testimonialSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter valid testimonial details.' })
    const result = await query(
      `UPDATE testimonials
       SET customer_name = $1, profile_image_url = $2, testimonial_text = $3, rating = $4, is_active = $5, display_order = $6
       WHERE id = $7
       RETURNING *`,
      [
        parsed.data.customerName,
        parsed.data.profileImageUrl || null,
        parsed.data.testimonialText,
        parsed.data.rating,
        parsed.data.isActive,
        parsed.data.displayOrder,
        req.params.id,
      ],
    )
    if (!result.rows[0]) return res.status(404).json({ message: 'Testimonial not found.' })
    return res.json({ testimonial: mapTestimonial(result.rows[0]) })
  } catch (error) {
    return next(error)
  }
}

export async function deleteAdminTestimonial(req, res, next) {
  try {
    const result = await query('DELETE FROM testimonials WHERE id = $1 RETURNING id', [req.params.id])
    if (!result.rows[0]) return res.status(404).json({ message: 'Testimonial not found.' })
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
}
