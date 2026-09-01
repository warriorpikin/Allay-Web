import { Router } from 'express'
import { confirmBooking, exportAdminBookings, getAdminBooking, listAdminBookings, updateBookingPaymentStatus, updateBookingStatus } from '../controllers/adminBookingController.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'

const router = Router()

router.use(authenticateAdmin)
router.get('/', listAdminBookings)
router.get('/export.csv', exportAdminBookings)
router.get('/:id', getAdminBooking)
router.patch('/:id/confirm', confirmBooking)
router.patch('/:id/status', updateBookingStatus)
router.patch('/:id/payment-status', updateBookingPaymentStatus)

export default router
