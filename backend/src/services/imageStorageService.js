import { cloudinary, hasCloudinaryConfig } from '../config/cloudinary.js'

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

function slugify(value) {
  return String(value || 'image')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'image'
}

export function validateImageFile(file) {
  if (!file) return null
  if (!allowedTypes.has(file.mimetype)) {
    const error = new Error('Unsupported image format. Please choose a JPG, PNG, or WebP image.')
    error.status = 400
    error.appCode = 'INVALID_FILE_TYPE'
    throw error
  }
  if (!file.buffer?.length) {
    const error = new Error('No image file was received.')
    error.status = 400
    error.appCode = 'FILE_REQUIRED'
    throw error
  }
  return file
}

export async function uploadImageBuffer(file, { folder, slugPrefix }) {
  validateImageFile(file)
  if (!file) return null
  if (!hasCloudinaryConfig()) {
    const error = new Error('Cloudinary upload failed because required server credentials are missing.')
    error.status = 503
    error.appCode = 'UPLOAD_CONFIGURATION_ERROR'
    throw error
  }

  const uploadFolder = `allay-house/${slugify(folder)}`
  const publicId = `${slugify(slugPrefix)}-${Date.now()}`

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: uploadFolder,
        public_id: publicId,
        resource_type: 'image',
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          const uploadError = new Error('Cloudinary rejected the uploaded file.')
          uploadError.status = 502
          uploadError.appCode = 'UPLOAD_PROVIDER_ERROR'
          uploadError.cause = error
          reject(uploadError)
          return
        }
        if (!result?.secure_url || !result?.public_id) {
          const uploadError = new Error('Cloudinary uploaded the image but did not return a saved image URL.')
          uploadError.status = 502
          uploadError.appCode = 'UPLOAD_PROVIDER_ERROR'
          reject(uploadError)
          return
        }
        resolve({ url: result.secure_url, publicId: result.public_id, storageKey: result.public_id })
      },
    )
    stream.end(file.buffer)
  })
}

export async function saveUploadedImage(file, options) {
  return uploadImageBuffer(file, options)
}

export async function removeStoredImage(publicId) {
  if (!publicId || !hasCloudinaryConfig()) return
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }).catch((error) => {
    console.error('[cloudinary] Failed to delete replaced image:', error.message)
  })
}
