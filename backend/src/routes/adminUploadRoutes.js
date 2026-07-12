import { Router } from 'express'
import { getUploadDiagnostics, testUploadDiagnostics } from '../controllers/adminUploadController.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'
import { handleImageUploadError, imageUpload } from '../middleware/imageUpload.js'

const router = Router()

router.use(authenticateAdmin)
router.get('/diagnostics', getUploadDiagnostics)
router.post('/diagnostics', imageUpload.single('image'), handleImageUploadError, testUploadDiagnostics)

export default router
