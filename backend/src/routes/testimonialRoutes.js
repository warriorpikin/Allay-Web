import { Router } from 'express'
import { listTestimonials } from '../controllers/testimonialController.js'

const router = Router()

router.get('/testimonials', listTestimonials)

export default router
