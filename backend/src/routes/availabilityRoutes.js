import { Router } from 'express'
import { checkPreferredAvailability, listAvailabilityDays, listAvailabilityTimes } from '../controllers/availabilityController.js'

const router = Router()

router.get('/days', listAvailabilityDays)
router.get('/times', listAvailabilityTimes)
router.post('/check', checkPreferredAvailability)

export default router
