import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.js'
import { query } from './config/database.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import adminAuthRoutes from './routes/adminAuthRoutes.js'
import adminAvailabilityRoutes from './routes/adminAvailabilityRoutes.js'
import adminBookingRoutes from './routes/adminBookingRoutes.js'
import adminDashboardRoutes from './routes/adminDashboardRoutes.js'
import adminServiceRoutes from './routes/adminServiceRoutes.js'
import adminSettingsRoutes from './routes/adminSettingsRoutes.js'
import adminTestimonialRoutes from './routes/adminTestimonialRoutes.js'
import adminWaitlistRoutes from './routes/adminWaitlistRoutes.js'
import availabilityRoutes from './routes/availabilityRoutes.js'
import bookingRoutes from './routes/bookingRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import serviceRoutes from './routes/serviceRoutes.js'
import settingsRoutes from './routes/settingsRoutes.js'
import testimonialRoutes from './routes/testimonialRoutes.js'
import waitlistRoutes from './routes/waitlistRoutes.js'

const app = express()
const allowedOrigins = new Set([
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean))

app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true)
    return callback(new Error(`CORS blocked origin: ${origin}`))
  },
  credentials: true,
}))
app.use(express.json({ limit: '4mb' }))

app.get('/api/health', async (req, res, next) => {
  try {
    await query('SELECT 1')
    res.json({ status: 'ok', service: 'allay-house-api', database: 'connected' })
  } catch (error) {
    next(error)
  }
})

app.use('/api/admin/auth', adminAuthRoutes)
app.use('/api/admin/availability', adminAvailabilityRoutes)
app.use('/api/admin/bookings', adminBookingRoutes)
app.use('/api/admin/dashboard', adminDashboardRoutes)
app.use('/api/admin/services', adminServiceRoutes)
app.use('/api/admin/settings', adminSettingsRoutes)
app.use('/api/admin/testimonials', adminTestimonialRoutes)
app.use('/api/admin/waitlist', adminWaitlistRoutes)
app.use('/api/availability', availabilityRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api', testimonialRoutes)
app.use('/api/waitlist', waitlistRoutes)
app.use('/api', serviceRoutes)
app.use(notFound)
app.use(errorHandler)

export default app
