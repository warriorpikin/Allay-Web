import { z } from 'zod'
import { query } from '../config/database.js'
import { env } from '../config/env.js'
import { renderWaitlistCouponEmail } from '../emails/templates/waitlistCouponEmail.js'
import { sendWaitlistCouponTestEmail } from '../services/emailService.js'
import { removeStoredImage, saveUploadedImage } from '../services/imageStorageService.js'
import {
  createCampaignRecord,
  getCampaignByIdempotencyKey,
  getCampaignById,
  hasHeaderInjection,
  isSafeHttpsUrl,
  isValidEmailAddress,
  listCampaigns,
  parseTestRecipients,
  previewCampaignEmail,
  resolveAudience,
  resolveReplyBehavior,
  searchRecipients,
  sendCampaign,
  sendTestCampaignEmail,
} from '../services/adminEmailService.js'

const campaignPayloadSchema = z.object({
  emailType: z.enum(['standard', 'announcement', 'promotion', 'coupon']).optional().default('standard'),
  subject: z.string().trim().min(1, 'Please enter a subject.').max(150, 'Subject must be 150 characters or fewer.')
    .refine((value) => !hasHeaderInjection(value), 'Subject contains invalid characters.'),
  preheader: z.string().trim().max(150, 'Preheader must be 150 characters or fewer.').optional().default(''),
  heading: z.string().trim().max(150).optional().default(''),
  bodyText: z.string().trim().min(1, 'Please enter the email body.').max(20000, 'The email body is too long.'),
  imageUrl: z.string().trim().optional().default(''),
  imageAlt: z.string().trim().max(200).optional().default(''),
  ctaLabel: z.string().trim().max(60).optional().default(''),
  ctaUrl: z.string().trim().optional().default(''),
  audienceType: z.enum(['all_users', 'all_waitlist', 'selected_users', 'selected_waitlist', 'manual']),
  selectedUserIds: z.array(z.string()).optional().default([]),
  selectedWaitlistIds: z.array(z.string()).optional().default([]),
  manualEmails: z.string().optional().default(''),
  replyMode: z.enum(['default', 'custom', 'none']).optional().default('default'),
  replyTo: z.string().trim().optional().default(''),
  supportEnabled: z.boolean().optional().default(true),
}).superRefine((data, ctx) => {
  if (Boolean(data.ctaLabel) !== Boolean(data.ctaUrl)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Provide both a button label and a button URL, or leave both blank.', path: ['ctaUrl'] })
  }
  if (data.ctaUrl && !isSafeHttpsUrl(data.ctaUrl)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'The button URL must be an absolute https:// URL.', path: ['ctaUrl'] })
  }
  if (data.replyMode === 'custom' && !isValidEmailAddress(data.replyTo)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid custom reply-to address.', path: ['replyTo'] })
  }
})

function parseFailure(parsed) {
  return parsed.error.issues[0]?.message || 'Enter valid campaign details.'
}

function respondWithAppError(res, error, next) {
  if (error.status) return res.status(error.status).json({ success: false, code: error.appCode || 'REQUEST_ERROR', message: error.message })
  return next(error)
}

export async function getRecipients(req, res, next) {
  try {
    const type = req.query.type === 'waitlist' ? 'waitlist' : 'users'
    const search = String(req.query.search || '')
    const recipients = await searchRecipients({ type, search })
    return res.json({ recipients })
  } catch (error) {
    return next(error)
  }
}

export async function previewCampaign(req, res, next) {
  try {
    const parsed = campaignPayloadSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: parseFailure(parsed) })
    const rendered = previewCampaignEmail(parsed.data, req.body?.sampleRecipientName || 'Jane Doe')
    return res.json({ preview: rendered })
  } catch (error) {
    return respondWithAppError(res, error, next)
  }
}

export async function sendTestCampaign(req, res, next) {
  try {
    const parsed = campaignPayloadSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: parseFailure(parsed) })

    const { recipients, invalid } = parseTestRecipients(req.body?.testAddresses || '')
    if (!recipients.length) return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Enter at least one valid test email address.' })

    const results = await sendTestCampaignEmail({ payload: parsed.data, testAddresses: recipients })
    return res.json({ message: 'Test email run complete.', results, invalidAddresses: invalid })
  } catch (error) {
    return respondWithAppError(res, error, next)
  }
}

export async function sendCampaignHandler(req, res, next) {
  try {
    const parsed = campaignPayloadSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: parseFailure(parsed) })

    const idempotencyKey = String(req.body?.idempotencyKey || '').trim().slice(0, 120) || null
    if (idempotencyKey) {
      const existing = await getCampaignByIdempotencyKey(idempotencyKey)
      if (existing) return res.status(200).json({ message: 'This campaign was already submitted.', duplicate: true, campaignId: existing.id, status: existing.status, totalRecipients: existing.total_recipients, sent: existing.sent_count, failed: existing.failed_count })
    }

    // Throws early (before touching the audience or the database) if no-reply mode is misconfigured.
    resolveReplyBehavior({ replyMode: parsed.data.replyMode, customReplyTo: parsed.data.replyTo })

    const { recipients, invalid } = await resolveAudience(parsed.data)
    if (!recipients.length) return res.status(400).json({ success: false, code: 'NO_RECIPIENTS', message: 'No valid recipients were found for this audience.' })
    if (recipients.length > env.EMAIL_MAX_RECIPIENTS_PER_CAMPAIGN) {
      return res.status(413).json({ success: false, code: 'RECIPIENT_LIMIT_EXCEEDED', message: `This campaign exceeds the configured recipient limit of ${env.EMAIL_MAX_RECIPIENTS_PER_CAMPAIGN}.` })
    }

    const campaign = await createCampaignRecord({ payload: parsed.data, recipients, createdBy: req.admin?.sub, idempotencyKey })
    if (!campaign) return res.status(409).json({ success: false, code: 'DUPLICATE_SUBMISSION', message: 'This campaign was already submitted.' })

    const outcome = await sendCampaign({ campaignId: campaign.id, payload: parsed.data, recipients })
    return res.status(201).json({
      message: 'Campaign send completed.',
      campaignId: campaign.id,
      totalRecipients: recipients.length,
      sent: outcome.sent,
      failed: outcome.failed,
      skippedInvalid: invalid.length,
    })
  } catch (error) {
    return respondWithAppError(res, error, next)
  }
}

export async function listCampaignsHandler(req, res, next) {
  try {
    const campaigns = await listCampaigns()
    return res.json({ campaigns })
  } catch (error) {
    return next(error)
  }
}

export async function getCampaignHandler(req, res, next) {
  try {
    const result = await getCampaignById(req.params.id)
    if (!result) return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Campaign not found.' })
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}

export async function uploadCampaignImage(req, res, next) {
  let uploadedImage = null
  try {
    if (!req.file) return res.status(400).json({ success: false, code: 'FILE_REQUIRED', message: 'No image file was received.' })
    uploadedImage = await saveUploadedImage(req.file, { folder: 'admin-emails', slugPrefix: 'campaign' })
    return res.status(201).json({ url: uploadedImage.url, publicId: uploadedImage.publicId })
  } catch (error) {
    if (uploadedImage?.publicId) await removeStoredImage(uploadedImage.publicId)
    return respondWithAppError(res, error, next)
  }
}

const DEFAULT_SAMPLE_SERVICES = [
  { name: 'Signature Glow Facial', price: 20000 },
  { name: 'Sauna Session', price: 15000 },
]

async function resolveWaitlistCouponSampleData(waitlistEntryId) {
  let fullName = 'Jane Doe'
  let services = []
  if (waitlistEntryId) {
    const entryResult = await query('SELECT full_name AS "fullName" FROM waitlist_entries WHERE id = $1', [waitlistEntryId])
    if (entryResult.rows[0]) {
      fullName = entryResult.rows[0].fullName || fullName
      const servicesResult = await query(
        `SELECT s.name, s.price
         FROM waitlist_selected_services wss
         JOIN services s ON s.id = wss.service_id
         WHERE wss.waitlist_entry_id = $1
         ORDER BY s.display_order ASC, s.name ASC`,
        [waitlistEntryId],
      )
      services = servicesResult.rows
    }
  }
  if (!services.length) services = DEFAULT_SAMPLE_SERVICES
  return { fullName, services }
}

// Renders the exact production waitlist-coupon template with sample or
// selected-waitlist-member data. Never sends anything and never creates a coupon.
export async function previewWaitlistCoupon(req, res, next) {
  try {
    const { fullName, services } = await resolveWaitlistCouponSampleData(req.body?.waitlistEntryId || null)
    const rendered = renderWaitlistCouponEmail({
      fullName,
      couponCode: 'TEST-ALLAY-15',
      discountType: env.WAITLIST_LAUNCH_DISCOUNT_TYPE,
      discountValue: env.WAITLIST_LAUNCH_DISCOUNT_VALUE,
      services,
      isTest: true,
    })
    return res.json({ preview: rendered })
  } catch (error) {
    return respondWithAppError(res, error, next)
  }
}

export async function testWaitlistCoupon(req, res, next) {
  try {
    const { recipients, invalid } = parseTestRecipients(env.WAITLIST_COUPON_TEST_RECIPIENTS)
    if (!recipients.length) {
      return res.status(422).json({ success: false, code: 'TEST_RECIPIENTS_NOT_CONFIGURED', message: 'No coupon test recipients are configured. Set WAITLIST_COUPON_TEST_RECIPIENTS and try again.' })
    }

    const { fullName, services } = await resolveWaitlistCouponSampleData(req.body?.waitlistEntryId || null)

    const results = []
    for (const to of recipients) {
      // eslint-disable-next-line no-await-in-loop
      const result = await sendWaitlistCouponTestEmail({ to, fullName, services })
      results.push({ email: to, sent: result.sent })
    }

    return res.json({ message: 'Waitlist coupon test run complete.', results, invalidConfiguredAddresses: invalid })
  } catch (error) {
    return respondWithAppError(res, error, next)
  }
}
