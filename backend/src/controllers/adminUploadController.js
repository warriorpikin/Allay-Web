import { getCloudinaryConfigStatus } from '../config/cloudinary.js'
import { removeStoredImage, saveUploadedImage } from '../services/imageStorageService.js'

export function getUploadDiagnostics(req, res) {
  return res.json({
    cloudinary: getCloudinaryConfigStatus(),
    uploadField: 'image',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSizeMb: 5,
  })
}

export async function testUploadDiagnostics(req, res, next) {
  let uploadedImage = null
  try {
    if (!req.file) return res.status(400).json({ success: false, code: 'FILE_REQUIRED', message: 'No image file was received.' })

    uploadedImage = await saveUploadedImage(req.file, {
      folder: 'diagnostics',
      slugPrefix: 'admin-upload-test',
      req,
    })

    await removeStoredImage(uploadedImage.publicId)

    return res.json({
      message: 'Cloudinary diagnostic upload succeeded.',
      receivedFile: true,
      mimeType: req.file.mimetype,
      size: req.file.size,
      cloudinary: getCloudinaryConfigStatus(),
      upload: {
        secureUrl: Boolean(uploadedImage.url),
        publicId: Boolean(uploadedImage.publicId),
      },
    })
  } catch (error) {
    if (uploadedImage?.publicId) await removeStoredImage(uploadedImage.publicId)
    return next(error)
  }
}
