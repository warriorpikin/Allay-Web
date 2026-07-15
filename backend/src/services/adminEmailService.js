import { query } from '../config/database.js'
import { env } from '../config/env.js'
import { renderAdminCampaignEmail } from '../emails/templates/adminCampaignEmail.js'
import { sendEmail } from './emailService.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/
const HEADER_INJECTION_REGEX = /[\r\n]/

export function isValidEmailAddress(value) {
  return EMAIL_REGEX.test(String(value || '').trim())
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function hasHeaderInjection(value) {
  return HEADER_INJECTION_REGEX.test(String(value || ''))
}

export function isSafeHttpsUrl(value) {
  const trimmed = String(value || '').trim()
  if (!/^https:\/\//i.test(trimmed)) return false
  try {
    // eslint-disable-next-line no-new
    new URL(trimmed)
    return true
  } catch {
    return false
  }
}

export function parseManualRecipients(raw = '') {
  return String(raw || '')
    .split(/[,\n]/)
    .map((value) => value.trim())
    .filter(Boolean)
}

export function parseTestRecipients(raw = '') {
  const seen = new Set()
  const invalid = []
  for (const candidate of String(raw || '').split(',').map((value) => value.trim()).filter(Boolean)) {
    const normalized = normalizeEmail(candidate)
    if (!isValidEmailAddress(normalized)) { invalid.push(candidate); continue }
    seen.add(normalized)
  }
  return { recipients: [...seen], invalid }
}

function dedupeRecipients(recipients) {
  const seen = new Map()
  const invalid = []
  for (const recipient of recipients) {
    const email = normalizeEmail(recipient.email)
    if (!email || !isValidEmailAddress(email)) { invalid.push(recipient.email); continue }
    if (!seen.has(email)) seen.set(email, { ...recipient, email })
  }
  return { recipients: [...seen.values()], invalid }
}

/**
 * "Users" = customers who created a password-protected account (mirrors the
 * WHERE clause already used by adminUserController.js). "Customers" (people
 * with a completed booking but no account) are intentionally out of scope —
 * the spec's audience options are users and waitlist members only.
 */
export async function resolveAudience({ audienceType, selectedUserIds = [], selectedWaitlistIds = [], manualEmails = '' }) {
  switch (audienceType) {
    case 'all_users': {
      const result = await query(`SELECT id, full_name AS name, email FROM customers WHERE password_hash IS NOT NULL`)
      return dedupeRecipients(result.rows.map((row) => ({ email: row.email, name: row.name, userId: row.id })))
    }
    case 'all_waitlist': {
      const result = await query(`SELECT id, full_name AS name, email FROM waitlist_entries WHERE status = 'active'`)
      return dedupeRecipients(result.rows.map((row) => ({ email: row.email, name: row.name, waitlistId: row.id })))
    }
    case 'selected_users': {
      if (!selectedUserIds.length) return { recipients: [], invalid: [] }
      const result = await query(`SELECT id, full_name AS name, email FROM customers WHERE id = ANY($1::uuid[]) AND password_hash IS NOT NULL`, [selectedUserIds])
      return dedupeRecipients(result.rows.map((row) => ({ email: row.email, name: row.name, userId: row.id })))
    }
    case 'selected_waitlist': {
      if (!selectedWaitlistIds.length) return { recipients: [], invalid: [] }
      const result = await query(`SELECT id, full_name AS name, email FROM waitlist_entries WHERE id = ANY($1::uuid[])`, [selectedWaitlistIds])
      return dedupeRecipients(result.rows.map((row) => ({ email: row.email, name: row.name, waitlistId: row.id })))
    }
    case 'manual': {
      return dedupeRecipients(parseManualRecipients(manualEmails).map((email) => ({ email, name: '' })))
    }
    default: {
      const error = new Error('Choose a valid audience.')
      error.status = 400
      throw error
    }
  }
}

export async function searchRecipients({ type, search = '', limit = 20 }) {
  const trimmedSearch = search.trim()
  const searchValue = `%${trimmedSearch.toLowerCase()}%`
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50)
  if (type === 'waitlist') {
    const result = await query(
      `SELECT id, full_name AS name, email
       FROM waitlist_entries
       WHERE $1 = '' OR LOWER(full_name) LIKE $2 OR LOWER(email) LIKE $2
       ORDER BY created_at DESC LIMIT $3`,
      [trimmedSearch, searchValue, safeLimit],
    )
    return result.rows
  }
  const result = await query(
    `SELECT id, full_name AS name, email
     FROM customers
     WHERE password_hash IS NOT NULL AND ($1 = '' OR LOWER(full_name) LIKE $2 OR LOWER(email) LIKE $2)
     ORDER BY created_at DESC LIMIT $3`,
    [trimmedSearch, searchValue, safeLimit],
  )
  return result.rows
}

function buildFromAddress(address) {
  if (!address) return undefined
  if (address.includes('<')) return address
  const name = env.RESEND_FROM_NAME || 'Allay House'
  return `${name} <${address}>`
}

// Resolves the Reply-To header (and, for no-reply mode, the From address)
// for an admin campaign. Distinct from the visible mailto: support footer link.
export function resolveReplyBehavior({ replyMode, customReplyTo }) {
  if (replyMode === 'custom') {
    if (!isValidEmailAddress(customReplyTo)) {
      const error = new Error('Enter a valid custom reply-to address.')
      error.status = 400
      throw error
    }
    return { replyTo: normalizeEmail(customReplyTo), from: undefined }
  }
  if (replyMode === 'none') {
    if (!env.EMAIL_NO_REPLY_ADDRESS) {
      const error = new Error('No-reply mode is not available because EMAIL_NO_REPLY_ADDRESS is not configured.')
      error.status = 422
      error.appCode = 'NO_REPLY_NOT_CONFIGURED'
      throw error
    }
    return { replyTo: null, from: buildFromAddress(env.EMAIL_NO_REPLY_ADDRESS) }
  }
  return { replyTo: undefined, from: undefined }
}

export function previewCampaignEmail(payload, sampleRecipientName = 'Jane Doe') {
  return renderAdminCampaignEmail({ ...payload, recipientName: sampleRecipientName })
}

export async function sendTestCampaignEmail({ payload, testAddresses }) {
  const { replyTo, from } = resolveReplyBehavior({ replyMode: payload.replyMode, customReplyTo: payload.replyTo })
  const results = []
  for (const address of testAddresses) {
    const rendered = renderAdminCampaignEmail({ ...payload, recipientName: 'Test Recipient', subject: `[TEST] ${payload.subject}`, isTest: true })
    // eslint-disable-next-line no-await-in-loop
    const result = await sendEmail({
      to: address,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      emailType: `admin_campaign_test_${payload.emailType}`,
      from,
      replyTo,
    })
    results.push({ email: address, sent: result.sent, error: result.error })
  }
  return results
}

function chunkArray(array, size) {
  const chunks = []
  for (let index = 0; index < array.length; index += size) chunks.push(array.slice(index, index + size))
  return chunks
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getCampaignByIdempotencyKey(key) {
  if (!key) return null
  const result = await query('SELECT * FROM email_campaigns WHERE idempotency_key = $1', [key])
  return result.rows[0] || null
}

export async function createCampaignRecord({ payload, recipients, createdBy, idempotencyKey }) {
  const inserted = await query(
    `INSERT INTO email_campaigns (idempotency_key, email_type, subject, preheader, heading, body_text, image_url, image_alt, cta_label, cta_url, audience_type, reply_mode, reply_to, support_enabled, status, total_recipients, created_by, started_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'sending',$15,$16,NOW())
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING *`,
    [
      idempotencyKey || null,
      payload.emailType,
      payload.subject,
      payload.preheader || null,
      payload.heading || null,
      payload.bodyText,
      payload.imageUrl || null,
      payload.imageAlt || null,
      payload.ctaLabel || null,
      payload.ctaUrl || null,
      payload.audienceType,
      payload.replyMode,
      payload.replyMode === 'custom' ? normalizeEmail(payload.replyTo) : null,
      payload.supportEnabled !== false,
      recipients.length,
      createdBy || null,
    ],
  )
  const campaign = inserted.rows[0]
  if (!campaign) return null // idempotency key already used by a prior request

  for (const recipient of recipients) {
    // eslint-disable-next-line no-await-in-loop
    await query(
      `INSERT INTO email_campaign_recipients (campaign_id, recipient_email, recipient_name, user_id, waitlist_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (campaign_id, LOWER(recipient_email)) DO NOTHING`,
      [campaign.id, recipient.email, recipient.name || null, recipient.userId || null, recipient.waitlistId || null],
    )
  }

  return campaign
}

/**
 * Sends a campaign already persisted by createCampaignRecord. Chunks
 * recipients into EMAIL_BATCH_SIZE-sized groups, sends each group
 * concurrently via Promise.allSettled (bounded concurrency = batch size),
 * and waits EMAIL_BATCH_DELAY_MS between groups. One recipient's failure
 * never aborts the rest of the campaign.
 */
export async function sendCampaign({ campaignId, payload, recipients }) {
  const { replyTo, from } = resolveReplyBehavior({ replyMode: payload.replyMode, customReplyTo: payload.replyTo })
  const batches = chunkArray(recipients, env.EMAIL_BATCH_SIZE)
  let sent = 0
  let failed = 0

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index]
    // eslint-disable-next-line no-await-in-loop
    const settled = await Promise.allSettled(batch.map(async (recipient) => {
      const rendered = renderAdminCampaignEmail({ ...payload, recipientName: recipient.name })
      const result = await sendEmail({
        to: recipient.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        emailType: `admin_campaign_${payload.emailType}`,
        from,
        replyTo,
      })
      return { recipient, result }
    }))

    for (const outcome of settled) {
      const { recipient, result } = outcome.value || { recipient: null, result: { sent: false, error: outcome.reason?.message } }
      if (!recipient) continue
      if (result.sent) {
        sent += 1
        // eslint-disable-next-line no-await-in-loop
        await query(
          `UPDATE email_campaign_recipients SET status = 'sent', provider_message_id = $1, sent_at = NOW()
           WHERE campaign_id = $2 AND LOWER(recipient_email) = LOWER($3)`,
          [result.providerMessageId || null, campaignId, recipient.email],
        )
      } else {
        failed += 1
        // eslint-disable-next-line no-await-in-loop
        await query(
          `UPDATE email_campaign_recipients SET status = 'failed', failure_message = $1
           WHERE campaign_id = $2 AND LOWER(recipient_email) = LOWER($3)`,
          [(result.error || 'The email provider rejected the request.').slice(0, 500), campaignId, recipient.email],
        )
      }
    }

    if (index < batches.length - 1) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(env.EMAIL_BATCH_DELAY_MS)
    }
  }

  await query(
    `UPDATE email_campaigns SET status = 'completed', sent_count = $1, failed_count = $2, completed_at = NOW() WHERE id = $3`,
    [sent, failed, campaignId],
  )

  return { sent, failed }
}

export async function listCampaigns() {
  const result = await query(
    `SELECT id, email_type, subject, audience_type, reply_mode, status, total_recipients, sent_count, failed_count, skipped_count, created_at, completed_at
     FROM email_campaigns ORDER BY created_at DESC LIMIT 200`,
  )
  return result.rows
}

export async function getCampaignById(id) {
  const campaign = await query('SELECT * FROM email_campaigns WHERE id = $1', [id])
  if (!campaign.rows[0]) return null
  const recipients = await query(
    `SELECT recipient_email, recipient_name, status, provider_message_id, failure_message, sent_at
     FROM email_campaign_recipients WHERE campaign_id = $1 ORDER BY created_at ASC LIMIT 500`,
    [id],
  )
  return { campaign: campaign.rows[0], recipients: recipients.rows }
}
