import { Router } from 'express'
import { createWaitlistEntry } from '../controllers/waitlistController.js'

const router = Router()

router.post('/', createWaitlistEntry)

export default router
