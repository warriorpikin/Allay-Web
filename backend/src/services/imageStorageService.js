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
    const error = new Error('Please choose a valid JPG, PNG, or WebP image.')
    error.status = 400
    throw error
  }
  if (!file.buffer?.length) {
    const error = new Error('The selected image could not be read. Please choose another image.')
    error.status = 400
    throw error
  }
  return file
}

export async function uploadImageBuffer(file, { folder, slugPrefix }) {
  validateImageFile(file)
  if (!file) return null
  if (!hasCloudinaryConfig()) {
    const error = new Error('Image storage is not configured. Add Cloudinary credentials on the backend.')
    error.status = 503
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
          const uploadError = new Error('The image could not be uploaded. Please try another image.')
          uploadError.status = 502
          uploadError.cause = error
          reject(uploadError)
          return
        }
        if (!result?.secure_url || !result?.public_id) {
          const uploadError = new Error('The image upload did not return a saved image URL.')
          uploadError.status = 502
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
