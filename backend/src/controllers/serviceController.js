import { z } from 'zod'
import { query } from '../config/database.js'
import { removeStoredImage, saveUploadedImage } from '../services/imageStorageService.js'

const servicePayloadSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().trim().min(2),
  slug: z.string().trim().optional().default(''),
  description: z.string().trim().optional().default(''),
  durationMinutes: z.coerce.number().int().min(5),
  price: z.coerce.number().min(0),
  imageUrl: z.string().trim().optional().default(''),
  isActive: z.coerce.boolean().default(true),
  bookable: z.coerce.boolean().default(true),
  isDiscountEligible: z.coerce.boolean().default(true),
  simultaneousCapacity: z.coerce.number().int().min(1).default(7),
  displayOrder: z.coerce.number().int().min(0).default(0),
})

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function mapService(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    categoryId: row.category_id,
    category: row.category_name,
    description: row.description,
    durationMinutes: Number(row.duration_minutes),
    price: Number(row.price),
    image: row.image_url || row.local_image_path,
    imageUrl: row.image_url,
    localImagePath: row.local_image_path,
    imagePublicId: row.image_public_id,
    isActive: row.is_active,
    bookable: row.bookable !== false,
    isDiscountEligible: row.is_discount_eligible,
    simultaneousCapacity: Number(row.simultaneous_capacity || 7),
    displayOrder: Number(row.display_order || 0),
  }
}

export async function listServices(req, res, next) {
  try {
    const result = await query(
      `SELECT s.*, c.name AS category_name
       FROM services s
       JOIN service_categories c ON c.id = s.category_id
       WHERE s.is_active = TRUE AND COALESCE(s.bookable, TRUE) = TRUE AND c.is_active = TRUE
       ORDER BY c.display_order ASC, s.display_order ASC, s.name ASC`,
    )
    res.json({ services: result.rows.map(mapService) })
  } catch (error) {
    next(error)
  }
}

export async function getServiceBySlug(req, res, next) {
  try {
    const result = await query(
      `SELECT s.*, c.name AS category_name
       FROM services s
       JOIN service_categories c ON c.id = s.category_id
       WHERE s.slug = $1 AND s.is_active = TRUE AND COALESCE(s.bookable, TRUE) = TRUE AND c.is_active = TRUE
       LIMIT 1`,
      [req.params.slug],
    )
    if (!result.rows[0]) return res.status(404).json({ message: 'Service not found.' })
    return res.json({ service: mapService(result.rows[0]) })
  } catch (error) {
    return next(error)
  }
}

export async function listServiceCategories(req, res, next) {
  try {
    const result = await query(
      `SELECT id, name, slug, description, display_order AS "displayOrder", is_active AS "isActive"
       FROM service_categories
       WHERE is_active = TRUE
       ORDER BY display_order ASC, name ASC`,
    )
    res.json({ categories: result.rows })
  } catch (error) {
    next(error)
  }
}

export async function listAdminServices(req, res, next) {
  try {
    const result = await query(
      `SELECT s.*, c.name AS category_name
       FROM services s
       JOIN service_categories c ON c.id = s.category_id
       ORDER BY c.display_order ASC, s.display_order ASC, s.name ASC`,
    )
    return res.json({ services: result.rows.map(mapService) })
  } catch (error) {
    return next(error)
  }
}

export async function listAdminServiceCategories(req, res, next) {
  try {
    const result = await query(
      `SELECT id, name, slug, description, display_order AS "displayOrder", is_active AS "isActive"
       FROM service_categories
       ORDER BY display_order ASC, name ASC`,
    )
    return res.json({ categories: result.rows })
  } catch (error) {
    return next(error)
  }
}

export async function createAdminService(req, res, next) {
  let uploadedImage = null
  try {
    const parsed = servicePayloadSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter valid service details.' })
    const slug = slugify(parsed.data.slug || parsed.data.name)
    if (!slug) return res.status(400).json({ message: 'Enter a valid service name or slug.' })
    uploadedImage = req.file ? await saveUploadedImage(req.file, { folder: 'services', slugPrefix: slug, req }) : null

    const result = await query(
      `INSERT INTO services (category_id, name, slug, description, duration_minutes, price, image_url, local_image_path, image_public_id,
        is_active, bookable, is_discount_eligible, simultaneous_capacity, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        parsed.data.categoryId,
        parsed.data.name,
        slug,
        parsed.data.description || null,
        parsed.data.durationMinutes,
        parsed.data.price,
        uploadedImage?.url || parsed.data.imageUrl || null,
        parsed.data.imageUrl && !uploadedImage ? parsed.data.imageUrl : null,
        uploadedImage?.publicId || null,
        parsed.data.isActive,
        parsed.data.bookable,
        parsed.data.isDiscountEligible,
        parsed.data.simultaneousCapacity,
        parsed.data.displayOrder,
      ],
    )
    const category = await query('SELECT name FROM service_categories WHERE id = $1', [parsed.data.categoryId])
    return res.status(201).json({ service: mapService({ ...result.rows[0], category_name: category.rows[0]?.name }) })
  } catch (error) {
    if (uploadedImage?.publicId) await removeStoredImage(uploadedImage.publicId)
    if (error.code === '23505') return res.status(409).json({ message: 'A service with that slug already exists.' })
    return next(error)
  }
}

export async function updateAdminService(req, res, next) {
  let uploadedImage = null
  try {
    const parsed = servicePayloadSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter valid service details.' })
    const slug = slugify(parsed.data.slug || parsed.data.name)
    if (!slug) return res.status(400).json({ message: 'Enter a valid service name or slug.' })
    const current = await query('SELECT image_public_id, image_url, local_image_path FROM services WHERE id = $1', [req.params.id])
    if (!current.rows[0]) return res.status(404).json({ message: 'Service not found.' })
    uploadedImage = req.file ? await saveUploadedImage(req.file, { folder: 'services', slugPrefix: slug, req }) : null

    const result = await query(
      `UPDATE services
       SET category_id = $1, name = $2, slug = $3, description = $4, duration_minutes = $5, price = $6,
        image_url = COALESCE($7, image_url), local_image_path = COALESCE($8, local_image_path), image_public_id = COALESCE($9, image_public_id), is_active = $10,
        bookable = $11, is_discount_eligible = $12, simultaneous_capacity = $13, display_order = $14
       WHERE id = $15
       RETURNING *`,
      [
        parsed.data.categoryId,
        parsed.data.name,
        slug,
        parsed.data.description || null,
        parsed.data.durationMinutes,
        parsed.data.price,
        uploadedImage?.url || null,
        uploadedImage ? null : null,
        uploadedImage?.publicId || null,
        parsed.data.isActive,
        parsed.data.bookable,
        parsed.data.isDiscountEligible,
        parsed.data.simultaneousCapacity,
        parsed.data.displayOrder,
        req.params.id,
      ],
    )
    if (!result.rows[0]) return res.status(404).json({ message: 'Service not found.' })
    if (uploadedImage && current.rows[0].image_public_id) await removeStoredImage(current.rows[0].image_public_id)
    const category = await query('SELECT name FROM service_categories WHERE id = $1', [parsed.data.categoryId])
    return res.json({ service: mapService({ ...result.rows[0], category_name: category.rows[0]?.name }) })
  } catch (error) {
    if (uploadedImage?.publicId) await removeStoredImage(uploadedImage.publicId)
    if (error.code === '23505') return res.status(409).json({ message: 'A service with that slug already exists.' })
    return next(error)
  }
}

export async function deleteAdminService(req, res, next) {
  try {
    const result = await query('DELETE FROM services WHERE id = $1 RETURNING id, image_public_id', [req.params.id])
    if (!result.rows[0]) return res.status(404).json({ message: 'Service not found.' })
    await removeStoredImage(result.rows[0].image_public_id)
    return res.status(204).send()
  } catch (error) {
    if (error.code === '23503') {
      try {
        await query('UPDATE services SET is_active = FALSE WHERE id = $1', [req.params.id])
        return res.status(204).send()
      } catch (fallbackError) {
        return next(fallbackError)
      }
    }
    return next(error)
  }
}
