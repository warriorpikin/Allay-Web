import { Router } from 'express'
import {
  createAdminTestimonial,
  deleteAdminTestimonial,
  listAdminTestimonials,
  updateAdminTestimonial,
} from '../controllers/testimonialController.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'
import { handleImageUploadError, imageUpload } from '../middleware/imageUpload.js'

const router = Router()

router.use(authenticateAdmin)
router.get('/', listAdminTestimonials)
router.post('/', imageUpload.single('image'), handleImageUploadError, createAdminTestimonial)
router.patch('/:id', imageUpload.single('image'), handleImageUploadError, updateAdminTestimonial)
router.delete('/:id', deleteAdminTestimonial)

export default router
