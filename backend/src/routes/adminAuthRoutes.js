import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { login, profile } from '../controllers/adminAuthController.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'

const router = Router()
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Too many sign-in attempts. Please wait and try again.' } })

router.post('/login', loginLimiter, login)
router.get('/me', authenticateAdmin, profile)

export default router

