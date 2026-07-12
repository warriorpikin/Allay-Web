import { z } from 'zod'
import { query } from '../config/database.js'
import { removeStoredImage, saveUploadedImage } from '../services/imageStorageService.js'

function formBoolean(defaultValue) {
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return defaultValue
    if (typeof value === 'string') return value === 'true' || value === '1' || value === 'on'
    return value
  }, z.boolean())
}

const testimonialSchema = z.object({
  customerName: z.string().trim().min(2),
  customerRole: z.string().trim().optional().default(''),
  profileImageUrl: z.string().trim().optional().default(''),
  testimonialText: z.string().trim().min(8),
  rating: z.coerce.number().min(1).max(5).refine((value) => Number.isInteger(value * 2), 'Rating must use half-point increments.').default(5),
  isActive: formBoolean(true),
  displayOrder: z.coerce.number().int().min(0).default(0),
})

function mapTestimonial(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerRole: row.customer_role,
    profileImageUrl: row.image_url || row.profile_image_url,
    imageUrl: row.image_url || row.profile_image_url,
    imagePublicId: row.image_public_id || row.profile_image_storage_key,
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
  let uploadedImage = null
  try {
    const parsed = testimonialSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter valid testimonial details.' })
    uploadedImage = req.file ? await saveUploadedImage(req.file, { folder: 'testimonials', slugPrefix: parsed.data.customerName, req }) : null
    const result = await query(
      `INSERT INTO testimonials (customer_name, customer_role, profile_image_url, profile_image_storage_key, testimonial_text, rating, is_active, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        parsed.data.customerName,
        parsed.data.customerRole || null,
        uploadedImage?.url || parsed.data.profileImageUrl || null,
        uploadedImage?.publicId || null,
        parsed.data.testimonialText,
        parsed.data.rating,
        parsed.data.isActive,
        parsed.data.displayOrder,
      ],
    )
    return res.status(201).json({ testimonial: mapTestimonial(result.rows[0]) })
  } catch (error) {
    if (uploadedImage?.publicId) await removeStoredImage(uploadedImage.publicId)
    return next(error)
  }
}

export async function updateAdminTestimonial(req, res, next) {
  let uploadedImage = null
  try {
    const parsed = testimonialSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter valid testimonial details.' })
    const current = await query('SELECT profile_image_storage_key AS image_public_id FROM testimonials WHERE id = $1', [req.params.id])
    if (!current.rows[0]) return res.status(404).json({ message: 'Testimonial not found.' })
    uploadedImage = req.file ? await saveUploadedImage(req.file, { folder: 'testimonials', slugPrefix: parsed.data.customerName, req }) : null
    const result = await query(
      `UPDATE testimonials
       SET customer_name = $1, customer_role = $2, profile_image_url = COALESCE($3, profile_image_url), profile_image_storage_key = COALESCE($4, profile_image_storage_key),
        testimonial_text = $5, rating = $6, is_active = $7, display_order = $8
       WHERE id = $9
       RETURNING *`,
      [
        parsed.data.customerName,
        parsed.data.customerRole || null,
        uploadedImage?.url || null,
        uploadedImage?.publicId || null,
        parsed.data.testimonialText,
        parsed.data.rating,
        parsed.data.isActive,
        parsed.data.displayOrder,
        req.params.id,
      ],
    )
    if (!result.rows[0]) return res.status(404).json({ message: 'Testimonial not found.' })
    if (uploadedImage && current.rows[0].image_public_id) await removeStoredImage(current.rows[0].image_public_id)
    return res.json({ testimonial: mapTestimonial(result.rows[0]) })
  } catch (error) {
    if (uploadedImage?.publicId) await removeStoredImage(uploadedImage.publicId)
    return next(error)
  }
}

export async function deleteAdminTestimonial(req, res, next) {
  try {
    const result = await query('DELETE FROM testimonials WHERE id = $1 RETURNING id, profile_image_storage_key AS image_public_id', [req.params.id])
    if (!result.rows[0]) return res.status(404).json({ message: 'Testimonial not found.' })
    await removeStoredImage(result.rows[0].image_public_id)
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
}
