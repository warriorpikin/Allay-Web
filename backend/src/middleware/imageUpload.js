import multer from 'multer'

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5_000_000, files: 1 },
  fileFilter(req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new Error('Please choose a valid JPG, PNG, or WebP image.'))
    }
    return callback(null, true)
  },
})

export function handleImageUploadError(error, req, res, next) {
  if (!error) return next()
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'The selected image is too large. Please choose an image under 5MB.' })
  }
  return res.status(400).json({ message: error.message || 'The image upload failed. Please try another image.' })
}
