import { Router } from 'express'
import {
  createAdminMembership,
  deleteAdminMembership,
  listAdminMemberships,
  updateAdminMembership,
} from '../controllers/membershipController.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'
import { handleImageUploadError, imageUpload } from '../middleware/imageUpload.js'

const router = Router()

router.use(authenticateAdmin)
router.get('/', listAdminMemberships)
router.post('/', imageUpload.single('image'), handleImageUploadError, createAdminMembership)
router.patch('/:id', imageUpload.single('image'), handleImageUploadError, updateAdminMembership)
router.delete('/:id', deleteAdminMembership)

export default router
