import { query } from '../config/database.js'
import { sendWaitlistConfirmationEmail } from './emailService.js'

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
       AND is_active = TRUE`,
    [identifiers],
  )
  return result.rows
}

export async function joinWaitlist({ email, selectedServices = [], fullName, phone, note }) {
  const services = await resolveServices(selectedServices)
  if (!services.length) {
    const error = new Error('Choose at least one active service.')
    error.status = 400
    throw error
  }

  const normalizedEmail = email.trim().toLowerCase()

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

  await sendWaitlistConfirmationEmail({ email: entry.email, services })

  return { entry, services }
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
