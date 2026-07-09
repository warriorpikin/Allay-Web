import { Router } from 'express'
import {
  createAdminService,
  deleteAdminService,
  listAdminServiceCategories,
  listAdminServices,
  updateAdminService,
} from '../controllers/serviceController.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'

const router = Router()

router.use(authenticateAdmin)
router.get('/', listAdminServices)
router.post('/', createAdminService)
router.patch('/:id', updateAdminService)
router.delete('/:id', deleteAdminService)
router.get('/meta/categories', listAdminServiceCategories)

export default router
