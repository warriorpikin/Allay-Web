import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { loginCustomer, signupCustomer } from '../controllers/customerAuthController.js'

const router = Router()
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Too many account attempts. Please wait and try again.' } })

router.post('/signup', authLimiter, signupCustomer)
router.post('/login', authLimiter, loginCustomer)

export default router
