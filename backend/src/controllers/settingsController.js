import { z } from 'zod'
import { getAllSettings, getPublicSiteMode, mergeSetting } from '../services/settingsService.js'

const patchSchemasByKey = {
  launch: z.object({
    mode: z.enum(['prelaunch', 'live']).optional(),
    waitlist_enabled: z.boolean().optional(),
    discount_percentage: z.number().min(0).max(100).nullable().optional(),
    discount_expiry: z.string().nullable().optional(),
  }),
  business: z.object({
    name: z.string().trim().min(2).optional(),
    contactEmail: z.string().trim().email().optional(),
    cancellationPolicy: z.string().trim().max(2000).optional(),
  }),
  booking: z.object({
    paused: z.boolean().optional(),
    allow_reservations: z.boolean().optional(),
    minimum_notice_minutes: z.number().int().min(0).optional(),
  }),
  payment: z.object({
    gateway: z.string().trim().optional(),
    online_enabled: z.boolean().optional(),
  }),
}

export async function getSiteMode(req, res, next) {
  try {
    const mode = await getPublicSiteMode()
    return res.json(mode)
  } catch (error) {
    return next(error)
  }
}

export async function listSettings(req, res, next) {
  try {
    const settings = await getAllSettings()
    return res.json({ settings })
  } catch (error) {
    return next(error)
  }
}

export async function updateSettingKey(req, res, next) {
  try {
    const { key } = req.params
    const schema = patchSchemasByKey[key]
    if (!schema) return res.status(404).json({ message: 'Unknown settings key.' })

    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter valid settings values.' })

    const updated = await mergeSetting(key, parsed.data)
    return res.json({ setting: updated })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message })
    return next(error)
  }
}
