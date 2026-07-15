import { Router } from 'express'
import { getEligiblePromotions } from '../controllers/promotionController.js'

const router = Router()

router.get('/promotions/active', getEligiblePromotions)

export default router
