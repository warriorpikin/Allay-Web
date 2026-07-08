import { query } from '../config/database.js'

const KNOWN_KEYS = new Set(['business', 'booking', 'launch', 'payment'])

export async function getAllSettings() {
  const result = await query('SELECT key, value, updated_at AS "updatedAt" FROM settings ORDER BY key ASC')
  return result.rows
}

export async function getSetting(key) {
  const result = await query('SELECT key, value FROM settings WHERE key = $1', [key])
  return result.rows[0] || null
}

export async function getPublicSiteMode() {
  const launch = await getSetting('launch')
  const mode = launch?.value?.mode === 'live' ? 'live' : 'prelaunch'
  return { mode, waitlistEnabled: launch?.value?.waitlist_enabled !== false }
}

export async function mergeSetting(key, patch) {
  if (!KNOWN_KEYS.has(key)) {
    const error = new Error('Unknown settings key.')
    error.status = 404
    throw error
  }
  const result = await query(
    `INSERT INTO settings (key, value)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = settings.value || EXCLUDED.value, updated_at = NOW()
     RETURNING key, value, updated_at AS "updatedAt"`,
    [key, JSON.stringify(patch)],
  )
  return result.rows[0]
}
