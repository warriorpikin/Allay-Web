export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Keep in sync with backend/src/middleware/imageUpload.js so a file that
// passes client validation can never be rejected by the server as too large.
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

export function validateImageFile(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Image must be a JPG, PNG, or WebP file.'
  if (file.size > MAX_IMAGE_SIZE_BYTES) return 'Image is larger than the 5MB upload limit.'
  return null
}
