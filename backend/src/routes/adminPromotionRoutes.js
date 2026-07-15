import { Router } from 'express'
import {
  createAdminPromotion,
  deleteAdminPromotion,
  duplicateAdminPromotion,
  getAdminPromotion,
  listAdminPromotions,
  setAdminPromotionStatus,
  updateAdminPromotion,
  uploadPromotionImage,
} from '../controllers/promotionController.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'
import { handleImageUploadError, imageUpload } from '../middleware/imageUpload.js'

const router = Router()

router.use(authenticateAdmin)
router.get('/', listAdminPromotions)
router.get('/:id', getAdminPromotion)
router.post('/', createAdminPromotion)
router.patch('/:id', updateAdminPromotion)
router.delete('/:id', deleteAdminPromotion)
router.post('/:id/duplicate', duplicateAdminPromotion)
router.patch('/:id/status', setAdminPromotionStatus)
router.post('/upload-image', imageUpload.single('image'), handleImageUploadError, uploadPromotionImage)

export default router
