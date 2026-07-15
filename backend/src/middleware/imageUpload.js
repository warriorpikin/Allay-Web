import multer from 'multer'

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

// Matches frontend/src/utils/imageValidation.js MAX_IMAGE_SIZE_BYTES so a file
// that passes client-side validation is never rejected here as too large.
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: 1 },
  fileFilter(req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error('Unsupported image format. Please choose a JPG, PNG, or WebP image.')
      error.status = 415
      error.appCode = 'INVALID_FILE_TYPE'
      return callback(error)
    }
    return callback(null, true)
  },
})

export function handleImageUploadError(error, req, res, next) {
  if (!error) return next()
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, code: 'FILE_TOO_LARGE', message: 'Image exceeds the maximum upload size of 5MB.' })
  }
  return res.status(error.status || 400).json({ success: false, code: error.appCode || 'UPLOAD_FAILED', message: error.message || 'The image upload failed. Please try another image.' })
}
