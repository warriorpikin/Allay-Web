import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { createBooking, recordWhatsAppHandoff } from '../controllers/bookingController.js'
import { optionalCustomerAuth } from '../middleware/optionalCustomerAuth.js'

const router = Router()
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many booking requests. Please wait a little and try again.' },
})

router.post('/', bookingLimiter, optionalCustomerAuth, createBooking)
router.post('/:reference/whatsapp-handoff', recordWhatsAppHandoff)

export default router
