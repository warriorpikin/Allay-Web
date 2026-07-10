import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from '../config/env.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '../../..')
const uploadRoot = path.resolve(projectRoot, env.LOCAL_UPLOAD_DIR)

const allowedTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
])

function slugify(value) {
  return String(value || 'image')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'image'
}

function publicBaseUrl(req) {
  if (env.PUBLIC_UPLOAD_BASE_URL) return env.PUBLIC_UPLOAD_BASE_URL.replace(/\/+$/, '')
  return `${req.protocol}://${req.get('host')}`
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

export async function saveUploadedImage(file, { folder, slugPrefix, req }) {
  validateImageFile(file)
  if (!file) return null
  if (env.UPLOAD_STORAGE_DRIVER !== 'local') {
    const error = new Error('Image storage is not configured for this environment.')
    error.status = 503
    throw error
  }

  const safeFolder = slugify(folder)
  const extension = allowedTypes.get(file.mimetype)
  const filename = `${slugify(slugPrefix)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`
  const relativeKey = path.posix.join('uploads', safeFolder, filename)
  const absolutePath = path.join(uploadRoot, safeFolder, filename)
  await mkdir(path.dirname(absolutePath), { recursive: true })
  await writeFile(absolutePath, file.buffer)

  return {
    url: `${publicBaseUrl(req)}/${relativeKey}`,
    storageKey: relativeKey,
  }
}

export async function removeStoredImage(storageKey) {
  if (!storageKey || !storageKey.startsWith('uploads/')) return
  const absolutePath = path.resolve(projectRoot, storageKey)
  if (!absolutePath.startsWith(uploadRoot)) return
  await rm(absolutePath, { force: true }).catch(() => {})
}

export { uploadRoot }
