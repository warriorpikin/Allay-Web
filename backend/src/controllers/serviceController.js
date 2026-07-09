import { mkdir, writeFile } from 'node:fs/promises'
import { extname } from 'node:path'
import { z } from 'zod'
import { query } from '../config/database.js'

const serviceImageDirectory = new URL('../../../frontend/public/images/allay/services/', import.meta.url)
const allowedImageTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
])

const servicePayloadSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().trim().min(2),
  slug: z.string().trim().optional().default(''),
  description: z.string().trim().optional().default(''),
  durationMinutes: z.coerce.number().int().min(5),
  price: z.coerce.number().min(0),
  imageUrl: z.string().trim().optional().default(''),
  isActive: z.coerce.boolean().default(true),
  isDiscountEligible: z.coerce.boolean().default(true),
  simultaneousCapacity: z.coerce.number().int().min(1).default(7),
  displayOrder: z.coerce.number().int().min(0).default(0),
  imageUpload: z.object({
    filename: z.string().trim().min(1),
    mimeType: z.string().trim().min(1),
    data: z.string().min(1),
  }).nullable().optional(),
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
    isActive: row.is_active,
    isDiscountEligible: row.is_discount_eligible,
    simultaneousCapacity: Number(row.simultaneous_capacity || 7),
    displayOrder: Number(row.display_order || 0),
  }
}

async function saveServiceImage(upload, slug) {
  if (!upload?.data) return null
  const extension = allowedImageTypes.get(upload.mimeType) || extname(upload.filename).toLowerCase()
  if (!allowedImageTypes.has(upload.mimeType) || !['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) {
    const error = new Error('Use a JPG, PNG, or WebP image.')
    error.status = 400
    throw error
  }

  const buffer = Buffer.from(upload.data, 'base64')
  if (!buffer.length || buffer.length > 2_500_000) {
    const error = new Error('Service image must be smaller than 2.5MB.')
    error.status = 400
    throw error
  }

  const normalizedExtension = extension === '.jpeg' ? '.jpg' : extension
  const filename = `${slug}-${Date.now()}${normalizedExtension}`
  await mkdir(serviceImageDirectory, { recursive: true })
  await writeFile(new URL(filename, serviceImageDirectory), buffer)
  return `/images/allay/services/${filename}`
}

export async function listServices(req, res, next) {
  try {
    const result = await query(
      `SELECT s.*, c.name AS category_name
       FROM services s
       JOIN service_categories c ON c.id = s.category_id
       WHERE s.is_active = TRUE AND c.is_active = TRUE
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
       WHERE s.slug = $1 AND s.is_active = TRUE AND c.is_active = TRUE
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
  try {
    const parsed = servicePayloadSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter valid service details.' })
    const slug = slugify(parsed.data.slug || parsed.data.name)
    if (!slug) return res.status(400).json({ message: 'Enter a valid service name or slug.' })
    const localImagePath = await saveServiceImage(parsed.data.imageUpload, slug)

    const result = await query(
      `INSERT INTO services (category_id, name, slug, description, duration_minutes, price, image_url, local_image_path,
        is_active, is_discount_eligible, simultaneous_capacity, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        parsed.data.categoryId,
        parsed.data.name,
        slug,
        parsed.data.description || null,
        parsed.data.durationMinutes,
        parsed.data.price,
        parsed.data.imageUrl || null,
        localImagePath,
        parsed.data.isActive,
        parsed.data.isDiscountEligible,
        parsed.data.simultaneousCapacity,
        parsed.data.displayOrder,
      ],
    )
    const category = await query('SELECT name FROM service_categories WHERE id = $1', [parsed.data.categoryId])
    return res.status(201).json({ service: mapService({ ...result.rows[0], category_name: category.rows[0]?.name }) })
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'A service with that slug already exists.' })
    return next(error)
  }
}

export async function updateAdminService(req, res, next) {
  try {
    const parsed = servicePayloadSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter valid service details.' })
    const slug = slugify(parsed.data.slug || parsed.data.name)
    if (!slug) return res.status(400).json({ message: 'Enter a valid service name or slug.' })
    const localImagePath = await saveServiceImage(parsed.data.imageUpload, slug)

    const result = await query(
      `UPDATE services
       SET category_id = $1, name = $2, slug = $3, description = $4, duration_minutes = $5, price = $6,
        image_url = $7, local_image_path = COALESCE($8, local_image_path), is_active = $9,
        is_discount_eligible = $10, simultaneous_capacity = $11, display_order = $12
       WHERE id = $13
       RETURNING *`,
      [
        parsed.data.categoryId,
        parsed.data.name,
        slug,
        parsed.data.description || null,
        parsed.data.durationMinutes,
        parsed.data.price,
        parsed.data.imageUrl || null,
        localImagePath,
        parsed.data.isActive,
        parsed.data.isDiscountEligible,
        parsed.data.simultaneousCapacity,
        parsed.data.displayOrder,
        req.params.id,
      ],
    )
    if (!result.rows[0]) return res.status(404).json({ message: 'Service not found.' })
    const category = await query('SELECT name FROM service_categories WHERE id = $1', [parsed.data.categoryId])
    return res.json({ service: mapService({ ...result.rows[0], category_name: category.rows[0]?.name }) })
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'A service with that slug already exists.' })
    return next(error)
  }
}

export async function deleteAdminService(req, res, next) {
  try {
    const result = await query('DELETE FROM services WHERE id = $1 RETURNING id', [req.params.id])
    if (!result.rows[0]) return res.status(404).json({ message: 'Service not found.' })
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
