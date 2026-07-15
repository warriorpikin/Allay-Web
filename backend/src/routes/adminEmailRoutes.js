import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  getCampaignHandler,
  getRecipients,
  listCampaignsHandler,
  previewCampaign,
  previewWaitlistCoupon,
  sendCampaignHandler,
  sendTestCampaign,
  testWaitlistCoupon,
  uploadCampaignImage,
} from '../controllers/adminEmailController.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'
import { handleImageUploadError, imageUpload } from '../middleware/imageUpload.js'

const router = Router()

// Sending endpoints get their own limiter (separate from the login limiter) so a
// mis-clicked or scripted burst of sends can't exhaust a shared bucket used elsewhere.
const sendLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, code: 'RATE_LIMITED', message: 'Too many send attempts. Please wait and try again.' } })

router.use(authenticateAdmin)
router.get('/recipients', getRecipients)
router.post('/preview', previewCampaign)
router.post('/test', sendLimiter, sendTestCampaign)
router.post('/send', sendLimiter, sendCampaignHandler)
router.post('/preview-waitlist-coupon', previewWaitlistCoupon)
router.post('/test-waitlist-coupon', sendLimiter, testWaitlistCoupon)
router.post('/upload-image', imageUpload.single('image'), handleImageUploadError, uploadCampaignImage)
router.get('/campaigns', listCampaignsHandler)
router.get('/campaigns/:id', getCampaignHandler)

export default router
