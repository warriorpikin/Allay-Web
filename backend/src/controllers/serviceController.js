import { z } from 'zod'
import { query } from '../config/database.js'
import { removeStoredImage, saveUploadedImage } from '../services/imageStorageService.js'
import { invalidateSitemapCache } from '../services/sitemapCacheService.js'

function formBoolean(defaultValue) {
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return defaultValue
    if (typeof value === 'string') return value === 'true' || value === '1' || value === 'on'
    return value
  }, z.boolean())
}

function formOptionalNumber() {
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return null
    const number = Number(value)
    return Number.isFinite(number) ? number : value
  }, z.number().min(0).nullable())
}

function formOptionalInt() {
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return null
    const number = Number(value)
    return Number.isFinite(number) ? Math.trunc(number) : value
  }, z.number().int().min(1).nullable())
}

function formOptionalString(max) {
  return z.preprocess((value) => {
    if (value === undefined || value === null) return null
    const trimmed = String(value).trim()
    return trimmed === '' ? null : trimmed
  }, z.string().max(max).nullable())
}

const servicePayloadSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().trim().min(2),
  slug: z.string().trim().optional().default(''),
  description: z.string().trim().optional().default(''),
  shortDescription: formOptionalString(240),
  durationMinutes: z.coerce.number().int().min(5),
  price: z.coerce.number().min(0),
  priceFrom: formOptionalNumber(),
  priceTo: formOptionalNumber(),
  priceIsFrom: formBoolean(false),
  priceUnitLabel: formOptionalString(40),
  serviceType: formOptionalString(40),
  isAddon: formBoolean(false),
  isCouples: formBoolean(false),
  sessionCount: formOptionalInt(),
  seoTitle: formOptionalString(160),
  seoDescription: formOptionalString(300),
  seoKeywords: formOptionalString(500),
  imageUrl: z.string().trim().optional().default(''),
  isActive: formBoolean(true),
  bookable: formBoolean(true),
  isDiscountEligible: formBoolean(true),
  simultaneousCapacity: z.coerce.number().int().min(1).default(7),
  displayOrder: z.coerce.number().int().min(0).default(0),
}).refine((data) => data.priceFrom === null || data.priceTo === null || data.priceTo >= data.priceFrom, {
  message: 'The maximum price must be greater than or equal to the starting price.',
  path: ['priceTo'],
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
    categorySlug: row.category_slug,
    description: row.description,
    shortDescription: row.short_description,
    durationMinutes: Number(row.duration_minutes),
    price: Number(row.price),
    priceFrom: row.price_from === null || row.price_from === undefined ? null : Number(row.price_from),
    priceTo: row.price_to === null || row.price_to === undefined ? null : Number(row.price_to),
    priceIsFrom: Boolean(row.price_is_from),
    priceUnitLabel: row.price_unit_label || null,
    serviceType: row.service_type || null,
    isAddon: Boolean(row.is_addon),
    isCouples: Boolean(row.is_couples),
    sessionCount: row.session_count === null || row.session_count === undefined ? null : Number(row.session_count),
    seoTitle: row.seo_title || null,
    seoDescription: row.seo_description || null,
    seoKeywords: row.seo_keywords || null,
    image: row.image_url || row.local_image_path,
    imageUrl: row.image_url,
    localImagePath: row.local_image_path,
    imagePublicId: row.image_public_id || row.image_storage_key,
    isActive: row.is_active,
    bookable: row.bookable !== false,
    isDiscountEligible: row.is_discount_eligible,
    simultaneousCapacity: Number(row.simultaneous_capacity || 7),
    displayOrder: Number(row.display_order || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listServices(req, res, next) {
  try {
    const result = await query(
      `SELECT s.*, c.name AS category_name, c.slug AS category_slug
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
      `SELECT s.*, c.name AS category_name, c.slug AS category_slug
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
      `SELECT id, name, slug, description, display_order AS "displayOrder", is_active AS "isActive",
        seo_title AS "seoTitle", seo_description AS "seoDescription"
       FROM service_categories
       WHERE is_active = TRUE
       ORDER BY display_order ASC, name ASC`,
    )
    res.json({ categories: result.rows })
  } catch (error) {
    next(error)
  }
}

const MAX_ADMIN_PAGE_SIZE = 100
const DEFAULT_ADMIN_PAGE_SIZE = 25

export async function listAdminServices(req, res, next) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const limit = Math.min(MAX_ADMIN_PAGE_SIZE, Math.max(1, Number.parseInt(req.query.limit, 10) || DEFAULT_ADMIN_PAGE_SIZE))
    const offset = (page - 1) * limit

    const conditions = []
    const params = []

    const search = (req.query.search || '').trim()
    if (search) {
      params.push(`%${search}%`)
      conditions.push(`s.name ILIKE $${params.length}`)
    }

    if (req.query.categoryId) {
      params.push(req.query.categoryId)
      conditions.push(`s.category_id = $${params.length}`)
    }

    if (req.query.isActive === 'true' || req.query.isActive === 'false') {
      params.push(req.query.isActive === 'true')
      conditions.push(`s.is_active = $${params.length}`)
    }

    if (req.query.isAddon === 'true' || req.query.isAddon === 'false') {
      params.push(req.query.isAddon === 'true')
      conditions.push(`s.is_addon = $${params.length}`)
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const countResult = await query(
      `SELECT COUNT(*)::int AS count
       FROM services s
       JOIN service_categories c ON c.id = s.category_id
       ${whereClause}`,
      params,
    )

    const rowsResult = await query(
      `SELECT s.*, c.name AS category_name, c.slug AS category_slug
       FROM services s
       JOIN service_categories c ON c.id = s.category_id
       ${whereClause}
       ORDER BY c.display_order ASC, s.display_order ASC, s.name ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    )

    const total = countResult.rows[0]?.count || 0
    return res.json({
      services: rowsResult.rows.map(mapService),
      pagination: { page, limit, total },
    })
  } catch (error) {
    return next(error)
  }
}

export async function listAdminServiceCategories(req, res, next) {
  try {
    const result = await query(
      `SELECT id, name, slug, description, display_order AS "displayOrder", is_active AS "isActive",
        seo_title AS "seoTitle", seo_description AS "seoDescription"
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
      `INSERT INTO services (
        category_id, name, slug, description, short_description, duration_minutes, price,
        price_from, price_to, price_is_from, price_unit_label, service_type, is_addon, is_couples, session_count,
        seo_title, seo_description, seo_keywords,
        image_url, local_image_path, image_storage_key,
        is_active, bookable, is_discount_eligible, simultaneous_capacity, display_order
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
       RETURNING *`,
      [
        parsed.data.categoryId,
        parsed.data.name,
        slug,
        parsed.data.description || null,
        parsed.data.shortDescription,
        parsed.data.durationMinutes,
        parsed.data.price,
        parsed.data.priceFrom,
        parsed.data.priceTo,
        parsed.data.priceIsFrom,
        parsed.data.priceUnitLabel,
        parsed.data.serviceType,
        parsed.data.isAddon,
        parsed.data.isCouples,
        parsed.data.sessionCount,
        parsed.data.seoTitle,
        parsed.data.seoDescription,
        parsed.data.seoKeywords,
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
    const category = await query('SELECT name, slug FROM service_categories WHERE id = $1', [parsed.data.categoryId])
    invalidateSitemapCache()
    return res.status(201).json({ service: mapService({ ...result.rows[0], category_name: category.rows[0]?.name, category_slug: category.rows[0]?.slug }) })
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
    const current = await query('SELECT image_storage_key AS image_public_id, image_url, local_image_path FROM services WHERE id = $1', [req.params.id])
    if (!current.rows[0]) return res.status(404).json({ message: 'Service not found.' })
    uploadedImage = req.file ? await saveUploadedImage(req.file, { folder: 'services', slugPrefix: slug, req }) : null

    const result = await query(
      `UPDATE services
       SET category_id = $1, name = $2, slug = $3, description = $4, short_description = $5, duration_minutes = $6, price = $7,
        price_from = $8, price_to = $9, price_is_from = $10, price_unit_label = $11,
        service_type = $12, is_addon = $13, is_couples = $14, session_count = $15,
        seo_title = $16, seo_description = $17, seo_keywords = $18,
        image_url = COALESCE($19, image_url), local_image_path = CASE WHEN $19 IS NULL THEN local_image_path ELSE NULL END, image_storage_key = COALESCE($20, image_storage_key),
        is_active = $21, bookable = $22, is_discount_eligible = $23, simultaneous_capacity = $24, display_order = $25
       WHERE id = $26
       RETURNING *`,
      [
        parsed.data.categoryId,
        parsed.data.name,
        slug,
        parsed.data.description || null,
        parsed.data.shortDescription,
        parsed.data.durationMinutes,
        parsed.data.price,
        parsed.data.priceFrom,
        parsed.data.priceTo,
        parsed.data.priceIsFrom,
        parsed.data.priceUnitLabel,
        parsed.data.serviceType,
        parsed.data.isAddon,
        parsed.data.isCouples,
        parsed.data.sessionCount,
        parsed.data.seoTitle,
        parsed.data.seoDescription,
        parsed.data.seoKeywords,
        uploadedImage?.url || null,
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
    const category = await query('SELECT name, slug FROM service_categories WHERE id = $1', [parsed.data.categoryId])
    invalidateSitemapCache()
    return res.json({ service: mapService({ ...result.rows[0], category_name: category.rows[0]?.name, category_slug: category.rows[0]?.slug }) })
  } catch (error) {
    if (uploadedImage?.publicId) await removeStoredImage(uploadedImage.publicId)
    if (error.code === '23505') return res.status(409).json({ message: 'A service with that slug already exists.' })
    return next(error)
  }
}

export async function deleteAdminService(req, res, next) {
  try {
    const result = await query('DELETE FROM services WHERE id = $1 RETURNING id, image_storage_key AS image_public_id', [req.params.id])
    if (!result.rows[0]) return res.status(404).json({ message: 'Service not found.' })
    await removeStoredImage(result.rows[0].image_public_id)
    invalidateSitemapCache()
    return res.status(204).send()
  } catch (error) {
    if (error.code === '23503') {
      try {
        await query('UPDATE services SET is_active = FALSE WHERE id = $1', [req.params.id])
        invalidateSitemapCache()
        return res.status(204).send()
      } catch (fallbackError) {
        return next(fallbackError)
      }
    }
    return next(error)
  }
}
