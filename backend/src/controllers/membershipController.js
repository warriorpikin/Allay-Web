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

function formOptionalString(max) {
  return z.preprocess((value) => {
    if (value === undefined || value === null) return null
    const trimmed = String(value).trim()
    return trimmed === '' ? null : trimmed
  }, z.string().max(max).nullable())
}

function parseBenefits(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean)
  } catch {
    // Not JSON — fall through to newline splitting below.
  }
  return value.split('\n').map((line) => line.trim()).filter(Boolean)
}

const membershipPayloadSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().optional().default(''),
  tagline: formOptionalString(200),
  monthlyPrice: z.coerce.number().min(0),
  description: z.string().trim().optional().default(''),
  benefits: z.preprocess(parseBenefits, z.array(z.string())),
  recurringFrequency: z.string().trim().optional().default('monthly'),
  isActive: formBoolean(true),
  isFeatured: formBoolean(false),
  displayOrder: z.coerce.number().int().min(0).default(0),
  imageUrl: z.string().trim().optional().default(''),
  seoTitle: formOptionalString(160),
  seoDescription: formOptionalString(300),
  terms: z.string().trim().optional().default(''),
})

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function mapMembership(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    tagline: row.tagline,
    monthlyPrice: Number(row.monthly_price),
    description: row.description,
    benefits: Array.isArray(row.benefits) ? row.benefits : [],
    recurringFrequency: row.recurring_frequency,
    isActive: row.is_active,
    isFeatured: row.is_featured,
    displayOrder: Number(row.display_order || 0),
    image: row.image_url,
    imageUrl: row.image_url,
    imagePublicId: row.image_storage_key,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    terms: row.terms,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listMemberships(req, res, next) {
  try {
    const result = await query(
      `SELECT * FROM memberships WHERE is_active = TRUE ORDER BY display_order ASC, monthly_price ASC`,
    )
    return res.json({ memberships: result.rows.map(mapMembership) })
  } catch (error) {
    return next(error)
  }
}

export async function getMembershipBySlug(req, res, next) {
  try {
    const result = await query('SELECT * FROM memberships WHERE slug = $1 AND is_active = TRUE LIMIT 1', [req.params.slug])
    if (!result.rows[0]) return res.status(404).json({ message: 'Membership not found.' })
    return res.json({ membership: mapMembership(result.rows[0]) })
  } catch (error) {
    return next(error)
  }
}

export async function listAdminMemberships(req, res, next) {
  try {
    const result = await query('SELECT * FROM memberships ORDER BY display_order ASC, monthly_price ASC')
    return res.json({ memberships: result.rows.map(mapMembership) })
  } catch (error) {
    return next(error)
  }
}

export async function createAdminMembership(req, res, next) {
  let uploadedImage = null
  try {
    const parsed = membershipPayloadSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter valid membership details.' })
    const slug = slugify(parsed.data.slug || parsed.data.name)
    if (!slug) return res.status(400).json({ message: 'Enter a valid membership name or slug.' })
    uploadedImage = req.file ? await saveUploadedImage(req.file, { folder: 'memberships', slugPrefix: slug, req }) : null

    const result = await query(
      `INSERT INTO memberships (
        name, slug, tagline, monthly_price, description, benefits, recurring_frequency,
        is_active, is_featured, display_order, image_url, image_storage_key, seo_title, seo_description, terms
      ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        parsed.data.name,
        slug,
        parsed.data.tagline,
        parsed.data.monthlyPrice,
        parsed.data.description || null,
        JSON.stringify(parsed.data.benefits),
        parsed.data.recurringFrequency,
        parsed.data.isActive,
        parsed.data.isFeatured,
        parsed.data.displayOrder,
        uploadedImage?.url || parsed.data.imageUrl || null,
        uploadedImage?.publicId || null,
        parsed.data.seoTitle,
        parsed.data.seoDescription,
        parsed.data.terms || null,
      ],
    )
    invalidateSitemapCache()
    return res.status(201).json({ membership: mapMembership(result.rows[0]) })
  } catch (error) {
    if (uploadedImage?.publicId) await removeStoredImage(uploadedImage.publicId)
    if (error.code === '23505') return res.status(409).json({ message: 'A membership with that slug already exists.' })
    return next(error)
  }
}

export async function updateAdminMembership(req, res, next) {
  let uploadedImage = null
  try {
    const parsed = membershipPayloadSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter valid membership details.' })
    const slug = slugify(parsed.data.slug || parsed.data.name)
    if (!slug) return res.status(400).json({ message: 'Enter a valid membership name or slug.' })
    const current = await query('SELECT image_storage_key AS image_public_id FROM memberships WHERE id = $1', [req.params.id])
    if (!current.rows[0]) return res.status(404).json({ message: 'Membership not found.' })
    uploadedImage = req.file ? await saveUploadedImage(req.file, { folder: 'memberships', slugPrefix: slug, req }) : null

    const result = await query(
      `UPDATE memberships SET
        name = $1, slug = $2, tagline = $3, monthly_price = $4, description = $5, benefits = $6::jsonb,
        recurring_frequency = $7, is_active = $8, is_featured = $9, display_order = $10,
        image_url = COALESCE($11, image_url), image_storage_key = COALESCE($12, image_storage_key),
        seo_title = $13, seo_description = $14, terms = $15
       WHERE id = $16
       RETURNING *`,
      [
        parsed.data.name,
        slug,
        parsed.data.tagline,
        parsed.data.monthlyPrice,
        parsed.data.description || null,
        JSON.stringify(parsed.data.benefits),
        parsed.data.recurringFrequency,
        parsed.data.isActive,
        parsed.data.isFeatured,
        parsed.data.displayOrder,
        uploadedImage?.url || null,
        uploadedImage?.publicId || null,
        parsed.data.seoTitle,
        parsed.data.seoDescription,
        parsed.data.terms || null,
        req.params.id,
      ],
    )
    if (!result.rows[0]) return res.status(404).json({ message: 'Membership not found.' })
    if (uploadedImage && current.rows[0].image_public_id) await removeStoredImage(current.rows[0].image_public_id)
    invalidateSitemapCache()
    return res.json({ membership: mapMembership(result.rows[0]) })
  } catch (error) {
    if (uploadedImage?.publicId) await removeStoredImage(uploadedImage.publicId)
    if (error.code === '23505') return res.status(409).json({ message: 'A membership with that slug already exists.' })
    return next(error)
  }
}

export async function deleteAdminMembership(req, res, next) {
  try {
    const result = await query('UPDATE memberships SET is_active = FALSE WHERE id = $1 RETURNING id', [req.params.id])
    if (!result.rows[0]) return res.status(404).json({ message: 'Membership not found.' })
    invalidateSitemapCache()
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
}
