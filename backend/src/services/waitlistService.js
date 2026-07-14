import { query } from '../config/database.js'
import { sendLaunchCouponEmail, sendWaitlistConfirmationEmail } from './emailService.js'
import { getPublicSiteMode } from './settingsService.js'

function candidateIdentifiers(selectedServices = []) {
  const values = selectedServices.flatMap((service) =>
    typeof service === 'string' ? [service] : [service?.id, service?.serviceId, service?.slug],
  ).filter(Boolean)
  return [...new Set(values)]
}

async function resolveServices(selectedServices = []) {
  const identifiers = candidateIdentifiers(selectedServices)
  if (!identifiers.length) return []
  const result = await query(
    `SELECT id, name, slug
     FROM services
     WHERE (id::text = ANY($1) OR slug = ANY($1))
       AND is_active = TRUE
       AND COALESCE(bookable, TRUE) = TRUE`,
    [identifiers],
  )
  return result.rows
}

export async function joinWaitlist({ email, selectedServices = [], fullName, phone, note }) {
  const siteMode = await getPublicSiteMode()
  if (siteMode.waitlistEnabled === false) {
    const error = new Error('Our private waitlist is currently closed. Please watch out for future openings.')
    error.status = 403
    throw error
  }

  const services = await resolveServices(selectedServices)
  if (!services.length) {
    const error = new Error('Choose at least one active service.')
    error.status = 400
    throw error
  }

  const normalizedEmail = email.trim().toLowerCase()
  const existingEntry = await query('SELECT id FROM waitlist_entries WHERE LOWER(email) = LOWER($1) LIMIT 1', [normalizedEmail])
  const isNewEntry = !existingEntry.rows[0]

  const entryResult = await query(
    `INSERT INTO waitlist_entries (email, full_name, phone, note, status, source)
     VALUES ($1, $2, $3, $4, 'active', 'website')
     ON CONFLICT (LOWER(email)) DO UPDATE SET
       full_name = COALESCE(EXCLUDED.full_name, waitlist_entries.full_name),
       phone = COALESCE(EXCLUDED.phone, waitlist_entries.phone),
       note = COALESCE(EXCLUDED.note, waitlist_entries.note),
       status = 'active',
       updated_at = NOW()
     RETURNING id, email, full_name AS "fullName", phone, status, created_at AS "createdAt"`,
    [normalizedEmail, fullName || null, phone || null, note || null],
  )
  const entry = entryResult.rows[0]

  for (const service of services) {
    await query(
      `INSERT INTO waitlist_selected_services (waitlist_entry_id, service_id)
       VALUES ($1, $2)
       ON CONFLICT (waitlist_entry_id, service_id) DO NOTHING`,
      [entry.id, service.id],
    )
  }

  const confirmationEmail = isNewEntry
    ? await sendWaitlistConfirmationEmail({ email: entry.email, services, relatedWaitlistId: entry.id })
    : { sent: false, skipped: true, reason: 'existing_waitlist_entry' }

  return { entry, services, confirmationEmail }
}

export async function listWaitlistEntries() {
  const entries = await query(
    `SELECT w.id, w.email, w.full_name AS "fullName", w.phone, w.note, w.status, w.created_at AS "createdAt",
       COALESCE(json_agg(json_build_object('id', s.id, 'name', s.name, 'slug', s.slug))
         FILTER (WHERE s.id IS NOT NULL), '[]') AS services
     FROM waitlist_entries w
     LEFT JOIN waitlist_selected_services wss ON wss.waitlist_entry_id = w.id
     LEFT JOIN services s ON s.id = wss.service_id
     GROUP BY w.id
     ORDER BY w.created_at DESC
     LIMIT 500`,
  )
  return entries.rows
}

export async function sendCouponEmailsToWaitlist({ ids = [] } = {}) {
  const hasIds = Array.isArray(ids) && ids.length > 0
  const result = await query(
    `SELECT id, email
     FROM waitlist_entries
     WHERE status = 'active'
       AND ($1::boolean = FALSE OR id = ANY($2::uuid[]))
     ORDER BY created_at ASC`,
    [hasIds, hasIds ? ids : []],
  )

  const results = []
  for (const entry of result.rows) {
    const emailResult = await sendLaunchCouponEmail({ email: entry.email, relatedWaitlistId: entry.id })
    results.push({ id: entry.id, email: entry.email, sent: emailResult.sent })
  }

  return {
    total: result.rows.length,
    sent: results.filter((item) => item.sent).length,
    skippedOrFailed: results.filter((item) => !item.sent).length,
    results,
  }
}
