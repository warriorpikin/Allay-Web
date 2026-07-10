import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_SSL: z.enum(['true', 'false']).default('false'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  RESEND_API_KEY: z.string().optional().default(''),
  EMAIL_FROM: z.string().optional().default('Allay House <hello@allayhouse.com>'),
  ADMIN_EMAIL: z.string().optional().default(''),
  ADMIN_NOTIFICATION_EMAIL: z.string().optional().default(''),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
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

export const env = result.data
