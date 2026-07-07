import { Router } from 'express'
import { listServiceCategories, listServices } from '../controllers/serviceController.js'

const router = Router()

router.get('/services', listServices)
router.get('/service-categories', listServiceCategories)

export default router
