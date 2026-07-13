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
})

const result = schema.safeParse(process.env)
if (!result.success) {
  console.error('Invalid environment configuration:', result.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = {
  ...result.data,
  EMAIL_FROM: result.data.RESEND_FROM_EMAIL || result.data.EMAIL_FROM || 'Allay House <hello@allayhouse.com>',
}
