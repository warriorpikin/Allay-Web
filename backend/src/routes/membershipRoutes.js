import { Router } from 'express'
import { getMembershipBySlug, listMemberships } from '../controllers/membershipController.js'

const router = Router()

router.get('/memberships', listMemberships)
router.get('/memberships/:slug', getMembershipBySlug)

export default router
