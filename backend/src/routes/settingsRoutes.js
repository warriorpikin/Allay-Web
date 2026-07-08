import { Router } from 'express'
import { getSiteMode } from '../controllers/settingsController.js'

const router = Router()

router.get('/site-mode', getSiteMode)

export default router
