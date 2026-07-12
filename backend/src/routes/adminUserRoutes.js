import { Router } from 'express'
import { listAdminUsers } from '../controllers/adminUserController.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'

const router = Router()

router.use(authenticateAdmin)
router.get('/', listAdminUsers)

export default router
