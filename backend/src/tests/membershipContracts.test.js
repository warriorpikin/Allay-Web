import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import jwt from 'jsonwebtoken'
import app from '../app.js'
import { env } from '../config/env.js'
import { pool, query } from '../config/database.js'

let server
let baseUrl
let createdId

function authHeaders() {
  const token = jwt.sign({ id: 'membership-contract-test', role: 'admin' }, env.JWT_SECRET, { expiresIn: '10m' })
  return { Authorization: `Bearer ${token}` }
}

before(async () => {
  server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance))
  })
  baseUrl = `http://127.0.0.1:${server.address().port}/api`
})

after(async () => {
  // Hard-delete the test row — the admin API only soft-deactivates
  // memberships (matching the "activate/deactivate" requirement), so tests
  // clean up directly to avoid leaving disabled test rows behind.
  if (createdId) await query('DELETE FROM memberships WHERE id = $1', [createdId])
  await new Promise((resolve) => server.close(resolve))
  await pool.end()
})

function buildForm(fields) {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) form.append(key, value)
  return form
}

test('admin can create a membership and it appears on the public endpoint', async () => {
  const createResponse = await fetch(`${baseUrl}/admin/memberships`, {
    method: 'POST',
    headers: authHeaders(),
    body: buildForm({
      name: 'QA Test Membership',
      tagline: 'For automated testing only.',
      monthlyPrice: '123000',
      description: 'Temporary membership created by an automated test.',
      benefits: JSON.stringify(['Benefit one', 'Benefit two']),
      displayOrder: '999',
      isActive: 'true',
      isFeatured: 'false',
    }),
  })
  assert.equal(createResponse.status, 201)
  const created = await createResponse.json()
  createdId = created.membership.id
  assert.equal(created.membership.monthlyPrice, 123000)
  assert.deepEqual(created.membership.benefits, ['Benefit one', 'Benefit two'])

  const publicResponse = await fetch(`${baseUrl}/memberships/${created.membership.slug}`)
  assert.equal(publicResponse.status, 200)
  const publicData = await publicResponse.json()
  assert.equal(publicData.membership.name, 'QA Test Membership')
})

test('admin can update membership benefits and price', async () => {
  const updateResponse = await fetch(`${baseUrl}/admin/memberships/${createdId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: buildForm({
      name: 'QA Test Membership',
      monthlyPrice: '150000',
      benefits: JSON.stringify(['Updated benefit']),
      displayOrder: '999',
      isActive: 'true',
      isFeatured: 'true',
    }),
  })
  assert.equal(updateResponse.status, 200)
  const updated = await updateResponse.json()
  assert.equal(updated.membership.monthlyPrice, 150000)
  assert.deepEqual(updated.membership.benefits, ['Updated benefit'])
  assert.equal(updated.membership.isFeatured, true)
})

test('deactivating a membership removes it from the public listing', async () => {
  const deactivateResponse = await fetch(`${baseUrl}/admin/memberships/${createdId}`, { method: 'DELETE', headers: authHeaders() })
  assert.equal(deactivateResponse.status, 204)

  const listResponse = await fetch(`${baseUrl}/memberships`)
  const listData = await listResponse.json()
  assert.ok(!listData.memberships.some((membership) => membership.id === createdId))

  const adminListResponse = await fetch(`${baseUrl}/admin/memberships`, { headers: authHeaders() })
  const adminListData = await adminListResponse.json()
  const stillPresent = adminListData.memberships.find((membership) => membership.id === createdId)
  assert.ok(stillPresent, 'deactivated membership should still be visible in the admin list')
  assert.equal(stillPresent.isActive, false)
})
