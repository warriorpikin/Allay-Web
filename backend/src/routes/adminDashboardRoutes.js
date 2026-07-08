import { Router } from 'express'
import { getSummary } from '../controllers/dashboardController.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'

const router = Router()

router.use(authenticateAdmin)
router.get('/summary', getSummary)

export default router
