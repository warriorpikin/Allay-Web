import { Router } from 'express'
import {
  createAdminTestimonial,
  deleteAdminTestimonial,
  listAdminTestimonials,
  updateAdminTestimonial,
} from '../controllers/testimonialController.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'

const router = Router()

router.use(authenticateAdmin)
router.get('/', listAdminTestimonials)
router.post('/', createAdminTestimonial)
router.patch('/:id', updateAdminTestimonial)
router.delete('/:id', deleteAdminTestimonial)

export default router
