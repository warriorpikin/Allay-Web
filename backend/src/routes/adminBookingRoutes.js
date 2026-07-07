import { Router } from 'express'
import { getAdminBooking, listAdminBookings, updateBookingPaymentStatus, updateBookingStatus } from '../controllers/adminBookingController.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'

const router = Router()

router.use(authenticateAdmin)
router.get('/', listAdminBookings)
router.get('/:id', getAdminBooking)
router.patch('/:id/status', updateBookingStatus)
router.patch('/:id/payment-status', updateBookingPaymentStatus)

export default router
