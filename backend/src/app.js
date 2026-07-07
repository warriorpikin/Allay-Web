import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.js'
import { query } from './config/database.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import adminAuthRoutes from './routes/adminAuthRoutes.js'
import adminAvailabilityRoutes from './routes/adminAvailabilityRoutes.js'
import adminBookingRoutes from './routes/adminBookingRoutes.js'
import availabilityRoutes from './routes/availabilityRoutes.js'
import bookingRoutes from './routes/bookingRoutes.js'
import serviceRoutes from './routes/serviceRoutes.js'

const app = express()

app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }))
app.use(express.json({ limit: '100kb' }))

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
app.use('/api/availability', availabilityRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api', serviceRoutes)
app.use(notFound)
app.use(errorHandler)

export default app
