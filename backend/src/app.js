import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { env } from './config/env.js'
import { query } from './config/database.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

import adminAuthRoutes from './routes/adminAuthRoutes.js'
import adminAvailabilityRoutes from './routes/adminAvailabilityRoutes.js'
import adminAnalyticsRoutes from './routes/adminAnalyticsRoutes.js'
import adminBookingRoutes from './routes/adminBookingRoutes.js'
import adminCustomerRoutes from './routes/adminCustomerRoutes.js'
import adminDashboardRoutes from './routes/adminDashboardRoutes.js'
import adminEmailRoutes from './routes/adminEmailRoutes.js'
import adminPromotionRoutes from './routes/adminPromotionRoutes.js'
import adminServiceRoutes from './routes/adminServiceRoutes.js'
import adminSettingsRoutes from './routes/adminSettingsRoutes.js'
import adminTestimonialRoutes from './routes/adminTestimonialRoutes.js'
import adminUploadRoutes from './routes/adminUploadRoutes.js'
import adminUserRoutes from './routes/adminUserRoutes.js'
import adminWaitlistRoutes from './routes/adminWaitlistRoutes.js'

import availabilityRoutes from './routes/availabilityRoutes.js'
import bookingRoutes from './routes/bookingRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import customerAuthRoutes from './routes/customerAuthRoutes.js'
import discountRoutes from './routes/discountRoutes.js'
import promotionRoutes from './routes/promotionRoutes.js'
import serviceRoutes from './routes/serviceRoutes.js'
import settingsRoutes from './routes/settingsRoutes.js'
import testimonialRoutes from './routes/testimonialRoutes.js'
import waitlistRoutes from './routes/waitlistRoutes.js'

const app = express()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.resolve(__dirname, '../../uploads')

/**
 * Convert a URL into a consistent browser origin.
 *
 * Examples:
 * https://www.allayhouse.com/
 * https://www.allayhouse.com/some-path
 *
 * Both become:
 * https://www.allayhouse.com
 */
function normalizeOrigin(value) {
  if (!value || typeof value !== 'string') return ''

  const cleanedValue = value.trim()

  if (!cleanedValue) return ''

  try {
    return new URL(cleanedValue).origin.toLowerCase()
  } catch {
    return cleanedValue.replace(/\/+$/, '').toLowerCase()
  }
}

/**
 * Explicitly trusted frontend origins.
 *
 * Keep both the www and non-www custom domains because browsers consider
 * them different origins.
 */
const configuredOrigins = [
  env.FRONTEND_URL,

  // Allay House production domains
  'https://www.allayhouse.com',
  'https://allayhouse.com',

  // Existing Vercel production domain
  'https://allay-web-frontend.vercel.app',

  // Local development
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

const allowedOrigins = new Set(
  configuredOrigins
    .map(normalizeOrigin)
    .filter(Boolean),
)

const corsOptions = {
  origin(origin, callback) {
    /**
     * Requests made by server-to-server clients, curl, Render health checks
     * and some API tools may not contain an Origin header.
     */
    if (!origin) {
      return callback(null, true)
    }

    const normalizedOrigin = normalizeOrigin(origin)

    if (allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true)
    }

    console.warn('[cors] Blocked origin:', {
      received: origin,
      normalized: normalizedOrigin,
      allowedOrigins: [...allowedOrigins],
    })

    const error = new Error(`CORS blocked origin: ${origin}`)
    error.status = 403
    error.statusCode = 403
    error.code = 'CORS_ORIGIN_BLOCKED'

    return callback(error)
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
  ],

  optionsSuccessStatus: 204,
}

app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use(helmet())
app.use(cors(corsOptions))

app.use(express.json({
  limit: '4mb',
}))

app.use('/uploads', express.static(uploadsDir, {
  fallthrough: true,
  maxAge: env.NODE_ENV === 'production' ? '7d' : 0,
  setHeaders(res) {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  },
}))

/**
 * Health check
 */
app.get('/api/health', async (req, res, next) => {
  try {
    await query('SELECT 1')

    res.json({
      status: 'ok',
      service: 'allay-house-api',
      database: 'connected',
    })
  } catch (error) {
    next(error)
  }
})

/**
 * Admin routes
 */
app.use('/api/admin/auth', adminAuthRoutes)
app.use('/api/admin/availability', adminAvailabilityRoutes)
app.use('/api/admin/analytics', adminAnalyticsRoutes)
app.use('/api/admin/bookings', adminBookingRoutes)
app.use('/api/admin/customers', adminCustomerRoutes)
app.use('/api/admin/dashboard', adminDashboardRoutes)
app.use('/api/admin/emails', adminEmailRoutes)
app.use('/api/admin/promotions', adminPromotionRoutes)
app.use('/api/admin/services', adminServiceRoutes)
app.use('/api/admin/settings', adminSettingsRoutes)
app.use('/api/admin/testimonials', adminTestimonialRoutes)
app.use('/api/admin/uploads', adminUploadRoutes)
app.use('/api/admin/users', adminUserRoutes)
app.use('/api/admin/waitlist', adminWaitlistRoutes)

/**
 * Public and customer routes
 */
app.use('/api/availability', availabilityRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/auth', customerAuthRoutes)
app.use('/api/discount-codes', discountRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/waitlist', waitlistRoutes)

/**
 * These routers already contain their complete endpoint suffixes.
 *
 * Examples:
 * /api/promotions/active
 * /api/testimonials
 * /api/services
 */
app.use('/api', promotionRoutes)
app.use('/api', testimonialRoutes)
app.use('/api', serviceRoutes)

/**
 * Error handlers must remain after all routes.
 */
app.use(notFound)
app.use(errorHandler)

export default app