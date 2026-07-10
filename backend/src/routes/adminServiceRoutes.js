import { Router } from 'express'
import {
  createAdminService,
  deleteAdminService,
  listAdminServiceCategories,
  listAdminServices,
  updateAdminService,
} from '../controllers/serviceController.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'
import { handleImageUploadError, imageUpload } from '../middleware/imageUpload.js'

const router = Router()

router.use(authenticateAdmin)
router.get('/', listAdminServices)
router.post('/', imageUpload.single('image'), handleImageUploadError, createAdminService)
router.patch('/:id', imageUpload.single('image'), handleImageUploadError, updateAdminService)
router.delete('/:id', deleteAdminService)
router.get('/meta/categories', listAdminServiceCategories)

export default router
