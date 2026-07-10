import { Router } from 'express'
import { validateBookingDiscount } from '../controllers/discountController.js'

const router = Router()

router.post('/validate', validateBookingDiscount)

export default router
