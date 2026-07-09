import { Router } from 'express'
import { listWaitlist, sendWaitlistCoupons } from '../controllers/waitlistController.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'

const router = Router()

router.use(authenticateAdmin)
router.get('/', listWaitlist)
router.post('/send-coupons', sendWaitlistCoupons)

export default router
