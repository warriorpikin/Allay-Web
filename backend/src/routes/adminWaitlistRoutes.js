import { Router } from 'express'
import { listWaitlist } from '../controllers/waitlistController.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'

const router = Router()

router.use(authenticateAdmin)
router.get('/', listWaitlist)

export default router
