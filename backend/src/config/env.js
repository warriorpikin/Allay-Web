import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

function cleanEnvString(value) {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  const quoted = (trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))
  return quoted ? trimmed.slice(1, -1).trim() : trimmed
}

const envString = (validator = z.string()) => z.preprocess(cleanEnvString, validator)
const optionalEnvString = z.preprocess((value) => cleanEnvString(value) || '', z.string().optional().default(''))

function resolveEmailFrom(data) {
  if (data.EMAIL_FROM) return data.EMAIL_FROM
  if (!data.RESEND_FROM_EMAIL) return 'Allay House <hello@allayhouse.com>'
  if (!data.RESEND_FROM_NAME || data.RESEND_FROM_EMAIL.includes('<')) return data.RESEND_FROM_EMAIL
  return `${data.RESEND_FROM_NAME} <${data.RESEND_FROM_EMAIL}>`
}

function trimTrailingSlash(value = '') {
  return String(value || '').replace(/\/+$/, '')
}

// EMAIL_DEFAULT_REPLY_TO is the modern name for this setting; RESEND_REPLY_TO
// is the pre-existing variable already wired into sendViaResend, so it stays
// the fallback rather than requiring every deployment to add a new var.
function resolveDefaultReplyTo(data) {
  return data.EMAIL_DEFAULT_REPLY_TO || data.RESEND_REPLY_TO || ''
}

// PUBLIC_SITE_URL duplicates FRONTEND_URL (already used throughout emailService.js),
// so FRONTEND_URL remains the single source of truth for the public site origin.
function resolveServicesUrl(data) {
  return data.ALLAY_SERVICES_URL || `${trimTrailingSlash(data.FRONTEND_URL)}/services`
}

function resolveEmailBackgroundUrl(data) {
  return data.ALLAY_EMAIL_BACKGROUND_URL || `${trimTrailingSlash(data.FRONTEND_URL)}/images/allay-house-hero.png`
}

function resolveEmailLogoUrl(data) {
  return data.ALLAY_EMAIL_LOGO_URL || `${trimTrailingSlash(data.FRONTEND_URL)}/images/brand/allay-logo-brown.svg`
}

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  FRONTEND_URL: envString(z.string().url()).default('http://localhost:5173'),
  DATABASE_URL: envString(z.string().min(1, 'DATABASE_URL is required')),
  DATABASE_SSL: z.enum(['true', 'false']).default('false'),
  JWT_SECRET: envString(z.string().min(32, 'JWT_SECRET must be at least 32 characters')),
  JWT_EXPIRES_IN: envString().default('8h'),
  RESEND_API_KEY: optionalEnvString,
  RESEND_FROM_EMAIL: optionalEnvString,
  RESEND_FROM_NAME: optionalEnvString,
  RESEND_REPLY_TO: optionalEnvString,
  EMAIL_FROM: optionalEnvString,
  ADMIN_EMAIL: optionalEnvString,
  ADMIN_NOTIFICATION_EMAIL: optionalEnvString,
  CLOUDINARY_CLOUD_NAME: optionalEnvString,
  CLOUDINARY_API_KEY: optionalEnvString,
  CLOUDINARY_API_SECRET: optionalEnvString,
  GA4_PROPERTY_ID: optionalEnvString,
  GA4_SERVICE_ACCOUNT_BASE64: optionalEnvString,
  GA4_CLIENT_EMAIL: optionalEnvString,
  GA4_PRIVATE_KEY: optionalEnvString,
  GA4_ANALYTICS_ENABLED: z.enum(['true', 'false']).optional().default('true'),
  GA4_CACHE_TTL_SECONDS: z.coerce.number().int().positive().optional().default(600),
  GA4_REALTIME_CACHE_TTL_SECONDS: z.coerce.number().int().positive().optional().default(60),
  PAYSTACK_PUBLIC_KEY: optionalEnvString,
  PAYSTACK_SECRET_KEY: optionalEnvString,
  PAYSTACK_WEBHOOK_SECRET: optionalEnvString,
  WAITLIST_LAUNCH_COUPON_CODE: z.string().optional().default('ALLAYEARLY'),
  WAITLIST_LAUNCH_DISCOUNT_TYPE: z.enum(['percent', 'fixed']).optional().default('percent'),
  WAITLIST_LAUNCH_DISCOUNT_VALUE: z.coerce.number().optional().default(15),
  UPLOAD_STORAGE_DRIVER: z.enum(['cloudinary']).optional().default('cloudinary'),

  // Outgoing-email footer/reply configuration. EMAIL_DEFAULT_REPLY_TO and
  // PUBLIC_SITE_URL intentionally fall back to the pre-existing RESEND_REPLY_TO
  // and FRONTEND_URL values above rather than duplicating them.
  EMAIL_DEFAULT_REPLY_TO: optionalEnvString,
  EMAIL_SUPPORT_ADDRESS: optionalEnvString,
  EMAIL_NO_REPLY_ADDRESS: optionalEnvString,
  ALLAY_SERVICES_URL: optionalEnvString,
  ALLAY_EMAIL_BACKGROUND_URL: optionalEnvString,
  ALLAY_EMAIL_LOGO_URL: optionalEnvString,

  // Comma-separated allow-list for waitlist coupon *test* sends only. Never used for real sends.
  WAITLIST_COUPON_TEST_RECIPIENTS: optionalEnvString,

  // Controlled bulk-sending limits for the admin campaign composer.
  EMAIL_BATCH_SIZE: z.coerce.number().int().positive().optional().default(25),
  EMAIL_BATCH_DELAY_MS: z.coerce.number().int().min(0).optional().default(1000),
  EMAIL_MAX_RECIPIENTS_PER_CAMPAIGN: z.coerce.number().int().positive().optional().default(1000),
})

const result = schema.safeParse(process.env)
if (!result.success) {
  console.error('Invalid environment configuration:', result.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = {
  ...result.data,
  EMAIL_FROM: resolveEmailFrom(result.data),
  EMAIL_DEFAULT_REPLY_TO: resolveDefaultReplyTo(result.data),
  ALLAY_SERVICES_URL: resolveServicesUrl(result.data),
  ALLAY_EMAIL_BACKGROUND_URL: resolveEmailBackgroundUrl(result.data),
  ALLAY_EMAIL_LOGO_URL: resolveEmailLogoUrl(result.data),
  // Canonical public site origin used by sitemap/robots/structured-data
  // generation (seoRoutes.js). FRONTEND_URL is already the project's single
  // source of truth for the public site origin, so this is an alias, not a
  // second variable to keep in sync — set FRONTEND_URL to the real production
  // domain (e.g. https://www.allayhouse.com) in the production environment.
  PUBLIC_SITE_URL: trimTrailingSlash(result.data.FRONTEND_URL),
}
