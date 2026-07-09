import { Router } from 'express'
import { getServiceBySlug, listServiceCategories, listServices } from '../controllers/serviceController.js'

const router = Router()

router.get('/services', listServices)
router.get('/services/:slug', getServiceBySlug)
router.get('/service-categories', listServiceCategories)

export default router
