import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import app from '../app.js'
import { pool } from '../config/database.js'
import { isValidPhoneNumber } from '../utils/phoneValidation.js'

let server
let baseUrl

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

async function postWaitlist(body) {
  const response = await fetch(`${baseUrl}/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { status: response.status, body: await response.json() }
}

const validSubmission = {
  fullName: 'Jane Doe',
  email: 'jane.doe@example.com',
  phone: '+234 803 123 4567',
  selectedServices: ['some-service-slug'],
}

test('phone number validator accepts Nigerian and international formats', () => {
  assert.equal(isValidPhoneNumber('0803 123 4567'), true)
  assert.equal(isValidPhoneNumber('+234 803 123 4567'), true)
  assert.equal(isValidPhoneNumber('+1 (415) 555-2671'), true)
  assert.equal(isValidPhoneNumber('12345'), false)
  assert.equal(isValidPhoneNumber(''), false)
  assert.equal(isValidPhoneNumber('abc-defg-hij'), false)
})

test('rejects an empty full name', async () => {
  const { status, body } = await postWaitlist({ ...validSubmission, fullName: '' })
  assert.equal(status, 400)
  assert.match(body.message, /full name/i)
})

test('rejects a spaces-only full name', async () => {
  const { status, body } = await postWaitlist({ ...validSubmission, fullName: '     ' })
  assert.equal(status, 400)
  assert.match(body.message, /full name/i)
})

test('rejects an empty phone number', async () => {
  const { status, body } = await postWaitlist({ ...validSubmission, phone: '' })
  assert.equal(status, 400)
  assert.match(body.message, /phone number/i)
})

test('rejects an invalid phone number', async () => {
  const { status, body } = await postWaitlist({ ...validSubmission, phone: 'not-a-number' })
  assert.equal(status, 400)
  assert.match(body.message, /phone number/i)
})

test('rejects a missing email address', async () => {
  const { status, body } = await postWaitlist({ ...validSubmission, email: '' })
  assert.equal(status, 400)
  assert.match(body.message, /email/i)
})

test('rejects an invalid email address', async () => {
  const { status, body } = await postWaitlist({ ...validSubmission, email: 'not-an-email' })
  assert.equal(status, 400)
  assert.match(body.message, /email/i)
})

test('rejects a submission with no selected services', async () => {
  const { status, body } = await postWaitlist({ ...validSubmission, selectedServices: [] })
  assert.equal(status, 400)
  assert.match(body.message, /service/i)
})
