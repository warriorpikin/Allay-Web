import { Router } from 'express'
import {
  createBlockedPeriod,
  createCapacityOverride,
  deleteBlockedPeriod,
  deleteCapacityOverride,
  listBlockedPeriods,
  listBusinessHours,
  listCapacityOverrides,
  updateBusinessHours,
} from '../controllers/adminAvailabilityController.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'

const router = Router()

router.use(authenticateAdmin)
router.get('/business-hours', listBusinessHours)
router.patch('/business-hours/:id', updateBusinessHours)
router.get('/blocked-periods', listBlockedPeriods)
router.post('/blocked-periods', createBlockedPeriod)
router.delete('/blocked-periods/:id', deleteBlockedPeriod)
router.get('/capacity-overrides', listCapacityOverrides)
router.post('/capacity-overrides', createCapacityOverride)
router.delete('/capacity-overrides/:id', deleteCapacityOverride)

export default router
