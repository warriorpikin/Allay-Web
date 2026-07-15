import { Router } from 'express'
import { getBusinessOverview, getDiagnostics, getOverview, getStatus } from '../controllers/adminAnalyticsController.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'

const router = Router()

router.use(authenticateAdmin)
router.get('/status', getStatus)
router.get('/diagnostics', getDiagnostics)
router.get('/overview', getOverview)
router.get('/business-overview', getBusinessOverview)

export default router
