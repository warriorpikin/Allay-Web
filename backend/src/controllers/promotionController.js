import { z } from 'zod'
import { query } from '../config/database.js'
import { saveUploadedImage } from '../services/imageStorageService.js'

const ctaActionEnum = z.enum(['internal_page', 'waitlist', 'booking', 'service', 'external_url', 'close', 'none'])

const imageSchema = z.object({
  type: z.enum(['custom', 'category']),
  url: z.string().trim().optional().default(''),
  publicId: z.string().trim().optional().default(''),
  categorySlug: z.string().trim().optional().default(''),
  alt: z.string().trim().optional().default(''),
}).refine((image) => (image.type === 'custom' ? Boolean(image.url) : Boolean(image.categorySlug)), {
  message: 'Custom images need an uploaded url; category images need a categorySlug.',
})

const promotionSchema = z.object({
  internalName: z.string().trim().min(2).max(160),
  heading: z.string().trim().min(2).max(200),
  eyebrowText: z.string().trim().max(120).optional().default(''),
  message: z.string().trim().max(2000).optional().default(''),
  ctaText: z.string().trim().max(80).optional().default(''),
  ctaAction: ctaActionEnum.optional().default('none'),
  ctaTarget: z.string().trim().max(300).optional().default(''),
  secondaryCtaText: z.string().trim().max(80).optional().default(''),
  secondaryCtaAction: ctaActionEnum.optional().default('none'),
  secondaryCtaTarget: z.string().trim().max(300).optional().default(''),
  imageSourceType: z.enum(['custom', 'category', 'mixed']).optional().default('custom'),
  images: z.array(imageSchema).max(10).optional().default([]),
  priority: z.coerce.number().int().min(0).max(1000).optional().default(0),
  startAt: z.string().datetime({ offset: true }).nullable().optional(),
  endAt: z.string().datetime({ offset: true }).nullable().optional(),
  isDismissible: z.boolean().optional().default(true),
  autoplayImages: z.boolean().optional().default(true),
  slideIntervalMs: z.coerce.number().int().min(2000).max(30000).optional().default(6000),
  triggerFirstVisit: z.boolean().optional().default(false),
  triggerReturnVisit: z.boolean().optional().default(false),
  returnAfterDays: z.coerce.number().int().min(1).max(365).optional().default(7),
  triggerAfterDelay: z.boolean().optional().default(false),
  delaySeconds: z.coerce.number().int().min(0).max(3600).optional().default(900),
  triggerOnReload: z.boolean().optional().default(false),
  reloadFrequency: z.enum(['once_per_session', 'cooldown', 'every_reload']).optional().default('once_per_session'),
  triggerAfterSignup: z.boolean().optional().default(false),
  triggerAfterLogin: z.boolean().optional().default(false),
  targetRoutes: z.array(z.string().trim().min(1)).min(1).max(20).optional().default(['all']),
  targetAudience: z.enum(['all', 'new', 'returning', 'guest', 'signed_in']).optional().default('all'),
  cooldownSeconds: z.coerce.number().int().min(0).max(2_592_000).optional().default(86400),
  maxPerSession: z.coerce.number().int().min(0).max(50).optional().default(1),
  maxLifetimeImpressions: z.coerce.number().int().min(0).max(10000).nullable().optional(),
  stopAfterDismissal: z.boolean().optional().default(true),
  campaignVersion: z.coerce.number().int().min(1).max(100000).optional().default(1),
}).refine((data) => !data.startAt || !data.endAt || new Date(data.endAt) > new Date(data.startAt), {
  message: 'End date must be after the start date.',
  path: ['endAt'],
})

const statusSchema = z.object({ status: z.enum(['draft', 'active', 'paused']) })

// [camelField, sqlColumn, cast?] — one ordered list drives both INSERT and
// UPDATE so the two statements can never drift out of sync with each other.
// `status` is deliberately excluded: it only ever changes through the
// dedicated status endpoint, never through a content save.
const PROMOTION_FIELDS = [
  ['internalName', 'internal_name'],
  ['heading', 'heading'],
  ['eyebrowText', 'eyebrow_text'],
  ['message', 'message'],
  ['ctaText', 'cta_text'],
  ['ctaAction', 'cta_action'],
  ['ctaTarget', 'cta_target'],
  ['secondaryCtaText', 'secondary_cta_text'],
  ['secondaryCtaAction', 'secondary_cta_action'],
  ['secondaryCtaTarget', 'secondary_cta_target'],
  ['imageSourceType', 'image_source_type'],
  ['images', 'images', 'jsonb'],
  ['priority', 'priority'],
  ['startAt', 'start_at'],
  ['endAt', 'end_at'],
  ['isDismissible', 'is_dismissible'],
  ['autoplayImages', 'autoplay_images'],
  ['slideIntervalMs', 'slide_interval_ms'],
  ['triggerFirstVisit', 'trigger_first_visit'],
  ['triggerReturnVisit', 'trigger_return_visit'],
  ['returnAfterDays', 'return_after_days'],
  ['triggerAfterDelay', 'trigger_after_delay'],
  ['delaySeconds', 'delay_seconds'],
  ['triggerOnReload', 'trigger_on_reload'],
  ['reloadFrequency', 'reload_frequency'],
  ['triggerAfterSignup', 'trigger_after_signup'],
  ['triggerAfterLogin', 'trigger_after_login'],
  ['targetRoutes', 'target_routes', 'jsonb'],
  ['targetAudience', 'target_audience'],
  ['cooldownSeconds', 'cooldown_seconds'],
  ['maxPerSession', 'max_per_session'],
  ['maxLifetimeImpressions', 'max_lifetime_impressions'],
  ['stopAfterDismissal', 'stop_after_dismissal'],
  ['campaignVersion', 'campaign_version'],
]

function fieldValue(data, key, cast) {
  if (cast === 'jsonb') return JSON.stringify(data[key] ?? [])
  const value = data[key]
  return value === undefined ? null : value
}

async function insertPromotion(data) {
  const columns = PROMOTION_FIELDS.map(([, column]) => column)
  const placeholders = PROMOTION_FIELDS.map(([, , cast], index) => (cast === 'jsonb' ? `$${index + 1}::jsonb` : `$${index + 1}`))
  const values = PROMOTION_FIELDS.map(([key, , cast]) => fieldValue(data, key, cast))
  const result = await query(
    `INSERT INTO website_promotions (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
    values,
  )
  return result.rows[0]
}

async function updatePromotionById(id, data) {
  const assignments = PROMOTION_FIELDS.map(([, column, cast], index) => (cast === 'jsonb' ? `${column} = $${index + 1}::jsonb` : `${column} = $${index + 1}`))
  const values = PROMOTION_FIELDS.map(([key, , cast]) => fieldValue(data, key, cast))
  const result = await query(
    `UPDATE website_promotions SET ${assignments.join(', ')} WHERE id = $${PROMOTION_FIELDS.length + 1} RETURNING *`,
    [...values, id],
  )
  return result.rows[0]
}

function computeEffectiveStatus(row, now = new Date()) {
  if (row.status !== 'active') return row.status
  if (row.start_at && new Date(row.start_at) > now) return 'scheduled'
  if (row.end_at && new Date(row.end_at) < now) return 'expired'
  return 'active'
}

function mapPromotion(row) {
  return {
    id: row.id,
    internalName: row.internal_name,
    heading: row.heading,
    eyebrowText: row.eyebrow_text,
    message: row.message,
    ctaText: row.cta_text,
    ctaAction: row.cta_action,
    ctaTarget: row.cta_target,
    secondaryCtaText: row.secondary_cta_text,
    secondaryCtaAction: row.secondary_cta_action,
    secondaryCtaTarget: row.secondary_cta_target,
    imageSourceType: row.image_source_type,
    images: row.images || [],
    status: row.status,
    effectiveStatus: computeEffectiveStatus(row),
    priority: row.priority,
    startAt: row.start_at,
    endAt: row.end_at,
    isDismissible: row.is_dismissible,
    autoplayImages: row.autoplay_images,
    slideIntervalMs: row.slide_interval_ms,
    triggerFirstVisit: row.trigger_first_visit,
    triggerReturnVisit: row.trigger_return_visit,
    returnAfterDays: row.return_after_days,
    triggerAfterDelay: row.trigger_after_delay,
    delaySeconds: row.delay_seconds,
    triggerOnReload: row.trigger_on_reload,
    reloadFrequency: row.reload_frequency,
    triggerAfterSignup: row.trigger_after_signup,
    triggerAfterLogin: row.trigger_after_login,
    targetRoutes: row.target_routes || ['all'],
    targetAudience: row.target_audience,
    cooldownSeconds: row.cooldown_seconds,
    maxPerSession: row.max_per_session,
    maxLifetimeImpressions: row.max_lifetime_impressions,
    stopAfterDismissal: row.stop_after_dismissal,
    campaignVersion: row.campaign_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapPublicPromotion(row) {
  const { internalName, status, effectiveStatus, createdAt, updatedAt, ...publicFields } = mapPromotion(row)
  return publicFields
}

function firstValidationMessage(error) {
  return error.issues?.[0]?.message || 'Enter valid promotion details.'
}

export async function getEligiblePromotions(req, res, next) {
  try {
    const result = await query(
      `SELECT * FROM website_promotions
       WHERE status = 'active'
         AND (start_at IS NULL OR start_at <= NOW())
         AND (end_at IS NULL OR end_at >= NOW())
       ORDER BY priority DESC, start_at DESC NULLS LAST`,
    )
    return res.json({ promotions: result.rows.map(mapPublicPromotion) })
  } catch (error) {
    return next(error)
  }
}

export async function listAdminPromotions(req, res, next) {
  try {
    const result = await query('SELECT * FROM website_promotions ORDER BY priority DESC, created_at DESC')
    return res.json({ promotions: result.rows.map(mapPromotion) })
  } catch (error) {
    return next(error)
  }
}

export async function getAdminPromotion(req, res, next) {
  try {
    const result = await query('SELECT * FROM website_promotions WHERE id = $1', [req.params.id])
    if (!result.rows[0]) return res.status(404).json({ message: 'Promotion not found.' })
    return res.json({ promotion: mapPromotion(result.rows[0]) })
  } catch (error) {
    return next(error)
  }
}

export async function createAdminPromotion(req, res, next) {
  try {
    const parsed = promotionSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: firstValidationMessage(parsed.error) })
    const row = await insertPromotion(parsed.data)
    return res.status(201).json({ promotion: mapPromotion(row) })
  } catch (error) {
    return next(error)
  }
}

export async function updateAdminPromotion(req, res, next) {
  try {
    const parsed = promotionSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: firstValidationMessage(parsed.error) })
    const row = await updatePromotionById(req.params.id, parsed.data)
    if (!row) return res.status(404).json({ message: 'Promotion not found.' })
    return res.json({ promotion: mapPromotion(row) })
  } catch (error) {
    return next(error)
  }
}

export async function deleteAdminPromotion(req, res, next) {
  try {
    const result = await query('DELETE FROM website_promotions WHERE id = $1 RETURNING id', [req.params.id])
    if (!result.rows[0]) return res.status(404).json({ message: 'Promotion not found.' })
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
}

export async function duplicateAdminPromotion(req, res, next) {
  try {
    const existing = await query('SELECT * FROM website_promotions WHERE id = $1', [req.params.id])
    if (!existing.rows[0]) return res.status(404).json({ message: 'Promotion not found.' })
    const source = mapPromotion(existing.rows[0])
    const clone = { ...source, internalName: `${source.internalName} (copy)` }
    const row = await insertPromotion(clone)
    return res.status(201).json({ promotion: mapPromotion(row) })
  } catch (error) {
    return next(error)
  }
}

export async function setAdminPromotionStatus(req, res, next) {
  try {
    const parsed = statusSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Provide a valid status (draft, active, or paused).' })
    const result = await query('UPDATE website_promotions SET status = $1 WHERE id = $2 RETURNING *', [parsed.data.status, req.params.id])
    if (!result.rows[0]) return res.status(404).json({ message: 'Promotion not found.' })
    return res.json({ promotion: mapPromotion(result.rows[0]) })
  } catch (error) {
    return next(error)
  }
}

export async function uploadPromotionImage(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, code: 'FILE_REQUIRED', message: 'No image file was received.' })
    const uploaded = await saveUploadedImage(req.file, { folder: 'promotions', slugPrefix: 'promotion', req })
    return res.status(201).json({ url: uploaded.url, publicId: uploaded.publicId })
  } catch (error) {
    return next(error)
  }
}
