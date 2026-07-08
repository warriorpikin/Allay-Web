import { Router } from 'express'
import { listSettings, updateSettingKey } from '../controllers/settingsController.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'

const router = Router()

router.use(authenticateAdmin)
router.get('/', listSettings)
router.patch('/:key', updateSettingKey)

export default router
