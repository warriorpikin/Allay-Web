import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import jwt from 'jsonwebtoken'
import app from '../app.js'
import { env } from '../config/env.js'
import { pool, query } from '../config/database.js'
import { hasCloudinaryConfig } from '../config/cloudinary.js'

const pngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8BQz0AEYBxVSFIAE9YDAp3fbp8AAAAASUVORK5CYII=',
  'base64',
)

let server
let baseUrl

function authHeaders() {
  const token = jwt.sign({ id: 'image-contract-test', role: 'admin' }, env.JWT_SECRET, { expiresIn: '10m' })
  return { Authorization: `Bearer ${token}` }
}

function appendServiceFields(form, fields = {}) {
  const payload = {
    categoryId: fields.categoryId,
    name: fields.name,
    slug: fields.slug,
    description: fields.description || 'Temporary upload contract service.',
    durationMinutes: '30',
    price: '1000',
    imageUrl: fields.imageUrl || '',
    isActive: 'true',
    bookable: 'true',
    isDiscountEligible: 'true',
    simultaneousCapacity: '1',
    displayOrder: '999',
  }
  for (const [key, value] of Object.entries(payload)) form.append(key, value)
}

function appendTestimonialFields(form, fields = {}) {
  const payload = {
    customerName: fields.customerName,
    customerRole: 'Contract test',
    profileImageUrl: fields.profileImageUrl || '',
    testimonialText: fields.testimonialText || 'A temporary testimonial used to verify image upload contracts.',
    rating: '5',
    isActive: 'true',
    displayOrder: '999',
  }
  for (const [key, value] of Object.entries(payload)) form.append(key, value)
}

function addPng(form, filename) {
  form.append('image', new Blob([pngBuffer], { type: 'image/png' }), filename)
}

async function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, options)
}

before(async () => {
  server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance))
  })
  baseUrl = `http://127.0.0.1:${server.address().port}/api`
})

after(async () => {
  await new Promise((resolve) => server.close(resolve))
  await pool.end()
})

test('service image update succeeds on first multipart update and persists image_storage_key', async (t) => {
  if (!hasCloudinaryConfig()) t.skip('Cloudinary credentials are not configured.')

  const category = await query('SELECT id FROM service_categories ORDER BY display_order ASC, name ASC LIMIT 1')
  if (!category.rows[0]) t.skip('No service category exists to attach the temporary service.')

  const slug = `contract-service-${Date.now()}`
  let serviceId
  let updateRequestCount = 0
  try {
    const createForm = new FormData()
    appendServiceFields(createForm, { categoryId: category.rows[0].id, name: 'Contract Upload Service', slug })
    const createResponse = await request('/admin/services', { method: 'POST', headers: authHeaders(), body: createForm })
    assert.equal(createResponse.status, 201)
    const created = await createResponse.json()
    serviceId = created.service.id

    const updateForm = new FormData()
    appendServiceFields(updateForm, { categoryId: category.rows[0].id, name: 'Contract Upload Service', slug })
    addPng(updateForm, 'service-contract.png')
    updateRequestCount += 1
    const updateResponse = await request(`/admin/services/${serviceId}`, { method: 'PATCH', headers: authHeaders(), body: updateForm })
    assert.equal(updateResponse.status, 200)
    const updated = await updateResponse.json()

    assert.equal(updateRequestCount, 1)
    assert.match(updated.service.imageUrl, /^https:\/\/res.cloudinary.com\//)
    assert.match(updated.service.imagePublicId, /^allay-house\/services\//)

    const stored = await query('SELECT image_url, image_storage_key FROM services WHERE id = $1', [serviceId])
    assert.equal(stored.rows[0].image_url, updated.service.imageUrl)
    assert.equal(stored.rows[0].image_storage_key, updated.service.imagePublicId)

    const publicResponse = await request(`/services/${slug}`)
    assert.equal(publicResponse.status, 200)
    const publicData = await publicResponse.json()
    assert.equal(publicData.service.imageUrl, updated.service.imageUrl)

    t.diagnostic(`service upload/update statuses: create=201 update=200 public=200 updateRequests=${updateRequestCount}`)
    t.diagnostic('service payload shape: multipart fields plus image file; no blob/data URL persisted')
    t.diagnostic('service response shape: { service: { imageUrl, imagePublicId, ... } }')
  } finally {
    if (serviceId) await request(`/admin/services/${serviceId}`, { method: 'DELETE', headers: authHeaders() })
  }
})

test('testimonial image update succeeds on first multipart update and persists profile_image_storage_key', async (t) => {
  if (!hasCloudinaryConfig()) t.skip('Cloudinary credentials are not configured.')

  const name = `Contract Testimonial ${Date.now()}`
  let testimonialId
  let updateRequestCount = 0
  try {
    const createForm = new FormData()
    appendTestimonialFields(createForm, { customerName: name })
    const createResponse = await request('/admin/testimonials', { method: 'POST', headers: authHeaders(), body: createForm })
    assert.equal(createResponse.status, 201)
    const created = await createResponse.json()
    testimonialId = created.testimonial.id

    const updateForm = new FormData()
    appendTestimonialFields(updateForm, { customerName: name })
    addPng(updateForm, 'testimonial-contract.png')
    updateRequestCount += 1
    const updateResponse = await request(`/admin/testimonials/${testimonialId}`, { method: 'PATCH', headers: authHeaders(), body: updateForm })
    assert.equal(updateResponse.status, 200)
    const updated = await updateResponse.json()

    assert.equal(updateRequestCount, 1)
    assert.match(updated.testimonial.profileImageUrl, /^https:\/\/res.cloudinary.com\//)
    assert.match(updated.testimonial.imagePublicId, /^allay-house\/testimonials\//)

    const stored = await query('SELECT profile_image_url, profile_image_storage_key FROM testimonials WHERE id = $1', [testimonialId])
    assert.equal(stored.rows[0].profile_image_url, updated.testimonial.profileImageUrl)
    assert.equal(stored.rows[0].profile_image_storage_key, updated.testimonial.imagePublicId)

    const publicResponse = await request('/testimonials')
    assert.equal(publicResponse.status, 200)
    const publicData = await publicResponse.json()
    const publicTestimonial = publicData.testimonials.find((item) => item.id === testimonialId)
    assert.equal(publicTestimonial.profileImageUrl, updated.testimonial.profileImageUrl)

    t.diagnostic(`testimonial upload/update statuses: create=201 update=200 public=200 updateRequests=${updateRequestCount}`)
    t.diagnostic('testimonial payload shape: multipart fields plus image file; no blob/data URL persisted')
    t.diagnostic('testimonial response shape: { testimonial: { profileImageUrl, imagePublicId, ... } }')
  } finally {
    if (testimonialId) await request(`/admin/testimonials/${testimonialId}`, { method: 'DELETE', headers: authHeaders() })
  }
})
