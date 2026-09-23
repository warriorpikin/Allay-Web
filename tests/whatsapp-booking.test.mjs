import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { clientWhatsAppHandoff, copyText } from '../frontend/src/utils/whatsapp.js'
import {
  bookingWhatsAppMessage, buildBookingConfirmation, canContinueAsWhatsAppRequest,
  hasVariablePrice, persistBookingConfirmation, recordHandoffWithoutWaiting,
  servicePriceLabel, submitBookingForWhatsApp,
} from '../frontend/src/utils/bookingHandoff.js'
import { buildWhatsAppHandoff } from '../backend/src/services/whatsappService.js'
import { settleBookingNotifications } from '../backend/src/utils/settleBookingNotifications.js'

const details = {
  booking: {
    customer: { fullName: 'Test & Example', email: 'booking-test@example.invalid', phone: '+234 800 000 0000' },
    services: [
      { id: 'test-massage', name: 'Massage & Relaxation', price: 35000, durationMinutes: 60 },
      { id: 'test-facial', name: 'Facial', price: 20000, durationMinutes: 30 },
    ],
    date: '2026-10-01', time: '14:30', note: 'Quiet room & gentle pressure.\nThank you 🙏',
  },
  totals: { subtotal: 55000, discount: 5500, total: 49500, totalDuration: 90 },
  discountCode: 'TEST10',
}
const apiError = (status) => ({ response: { status, data: { message: 'Test rejection' } } })

test('exact business number and complete URL-encoded text round-trip', () => {
  const text = 'A & B + 10% #invoice\n₦49,500 🙏'
  const handoff = clientWhatsAppHandoff(text)
  const url = new URL(handoff.url)
  assert.equal(url.origin, 'https://wa.me')
  assert.equal(url.pathname, '/2347012119202')
  assert.equal(url.searchParams.get('text'), text)
  assert.equal(handoff.requiresCopy, false)
})

test('request includes all details and ends with an invoice request', () => {
  const confirmation = buildBookingConfirmation(details)
  const message = confirmation.whatsapp.message
  for (const text of ['Test & Example', 'booking-test@example.invalid', '+234 800 000 0000', 'Massage & Relaxation', 'Facial', '1 October 2026', '14:30 WAT', '90 minutes', '35,000', '20,000', '55,000', '5,500', '49,500', 'TEST10', details.booking.note]) {
    assert.ok(message.includes(text), `Missing ${text}`)
  }
  assert.ok(message.endsWith('Please confirm availability and the final amount, then send me an invoice so I can make payment. Thank you.'))
  assert.equal(new URL(confirmation.whatsapp.url).searchParams.get('text'), message)
})

test('saved requests use authoritative server totals and ignore old/wrong WhatsApp links', async () => {
  const confirmation = await submitBookingForWhatsApp(details, async () => ({
    bookingReference: 'TEST-SAVED', whatsapp: { url: 'https://wa.me/message/OLD' },
    confirmation: { totalAmount: 47000, subtotal: 50000, discountAmount: 3000, emailSent: true },
  }))
  assert.equal(confirmation.reference, 'TEST-SAVED')
  assert.equal(confirmation.saveState, 'saved')
  assert.equal(confirmation.totalAmount, 47000)
  assert.equal(confirmation.emailSent, true)
  assert.match(confirmation.whatsapp.message, /47,000/)
  assert.match(confirmation.whatsapp.message, /BOOKING CODE: TEST-SAVED/)
  assert.equal(new URL(confirmation.whatsapp.url).pathname, '/2347012119202')
})

test('zero totals and discounts from the server are not replaced with local values', () => {
  const confirmation = buildBookingConfirmation({ ...details, response: { confirmation: { reference: 'ZERO', subtotal: 0, discountAmount: 0, totalAmount: 0 } } })
  assert.equal(confirmation.subtotal, 0)
  assert.equal(confirmation.discountAmount, 0)
  assert.equal(confirmation.totalAmount, 0)
})

for (const status of [undefined, 404, 405, 408, 429, 500, 502, 503, 504]) {
  test(`outage ${status ?? 'network/timeout'} opens a request-only handoff without retrying the POST`, async () => {
    let calls = 0
    const confirmation = await submitBookingForWhatsApp(details, async () => {
      calls++
      throw status ? apiError(status) : new Error('Network Error')
    })
    assert.equal(calls, 1)
    assert.equal(confirmation.reference, null)
    assert.equal(confirmation.saveState, 'unverified')
    assert.equal(confirmation.emailSent, false)
    assert.equal(confirmation.priceIsEstimated, true)
    assert.match(confirmation.whatsapp.message, /Website save not verified/)
    assert.match(confirmation.whatsapp.message, /check for an existing request/)
    assert.doesNotMatch(confirmation.whatsapp.message, /BOOKING CODE:/)
  })
}

for (const status of [400, 401, 403, 409, 422]) {
  test(`HTTP ${status} remains a validation/authentication/availability rejection`, async () => {
    const error = apiError(status)
    assert.equal(canContinueAsWhatsAppRequest(error), false)
    await assert.rejects(submitBookingForWhatsApp(details, async () => { throw error }), (actual) => actual === error)
  })
}

test('a malformed success response does not invent a saved booking', async () => {
  const confirmation = await submitBookingForWhatsApp(details, async () => ({}))
  assert.equal(confirmation.saveState, 'unverified')
  assert.equal(confirmation.reference, null)
})

test('from, range and option prices retain their qualifiers and units', () => {
  assert.match(servicePriceLabel({ price: 5000, priceIsFrom: true, priceUnitLabel: 'per session' }), /From.*5,000.*per session/)
  assert.match(servicePriceLabel({ price: 5000, priceFrom: 5000, priceTo: 9000 }), /5,000.*9,000/)
  assert.match(servicePriceLabel({ price: 5000, price_options: [5000, 7000] }), /5,000.*7,000.*options/)
  assert.equal(hasVariablePrice([{ price: 5000, priceIsFrom: true }]), true)
  assert.equal(hasVariablePrice([{ price: 5000, price_from: null, price_to: null }]), false)
})

test('blocked browser storage cannot block the handoff', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, get() { throw new Error('SecurityError') } })
  try { assert.equal(persistBookingConfirmation(buildBookingConfirmation(details)), false) }
  finally {
    if (descriptor) Object.defineProperty(globalThis, 'sessionStorage', descriptor)
    else delete globalThis.sessionStorage
  }
})

test('handoff tracking never waits and tolerates rejected, throwing and missing-reference calls', async () => {
  assert.equal(recordHandoffWithoutWaiting('SAVED', () => new Promise(() => {})), undefined)
  assert.doesNotThrow(() => recordHandoffWithoutWaiting('SAVED', () => { throw new Error('tracking down') }))
  assert.doesNotThrow(() => recordHandoffWithoutWaiting('SAVED', async () => { throw new Error('tracking down') }))
  recordHandoffWithoutWaiting(null, () => assert.fail('request-only handoff must not be tracked as a saved booking'))
  await new Promise((resolve) => setImmediate(resolve))
})

test('clipboard failure is a safe optional action', async () => {
  assert.equal(await copyText(''), false)
  // The Node test process has no document or clipboard.
  assert.equal(await copyText('Test message'), false)
})

test('backend message contains the same destination, duration, coupon, notes and invoice request', () => {
  const handoff = buildWhatsAppHandoff({
    booking: {
      booking_reference: 'TEST-BACKEND', customer_name: 'Test Example', customer_email: 'test@example.invalid', customer_phone: '+2348000000000',
      appointment_date: '2026-10-01', start_time: '14:30:00', total_duration_minutes: 90,
      subtotal: 55000, discount_amount: 5500, total_amount: 49500, discount_code: 'TEST10', customer_note: 'Quiet room',
    },
    services: details.booking.services.map((service) => ({ ...service, duration_minutes: service.durationMinutes })),
  })
  assert.equal(new URL(handoff.url).pathname, '/2347012119202')
  assert.equal(new URL(handoff.url).searchParams.get('text'), handoff.message)
  for (const text of ['TEST-BACKEND', '90 minutes', '14:30 WAT', 'TEST10', 'Quiet room', 'send me an invoice']) assert.ok(handoff.message.includes(text))
})

test('post-commit email failure cannot turn a saved booking into an error', async () => {
  let logged = false
  const status = await settleBookingNotifications(async () => { throw new Error('email_logs insert failed') }, {
    timeoutMs: 20, onError: () => { logged = true },
  })
  assert.deepEqual(status, { customer: false, admin: false })
  assert.equal(logged, true)
})

test('a slow email provider cannot block the booking response', async () => {
  const status = await settleBookingNotifications(() => new Promise(() => {}), { timeoutMs: 5 })
  assert.deepEqual(status, { customer: false, admin: false, pending: true })
})

test('successful emails retain their delivery status', async () => {
  const status = await settleBookingNotifications(async () => ({ customer: true, admin: true }), { timeoutMs: 20 })
  assert.deepEqual(status, { customer: true, admin: true })
})

test('a late notification rejection is handled even after the response timeout', async () => {
  let rejectDelivery
  let logged = false
  const status = await settleBookingNotifications(() => new Promise((resolve, reject) => { rejectDelivery = reject }), { timeoutMs: 5, onError: () => { logged = true } })
  assert.equal(status.pending, true)
  rejectDelivery(new Error('late failure'))
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(logged, true)
})

test('UI exposes a real clickable WhatsApp link and no longer awaits tracking or clipboard', () => {
  const booking = readFileSync(new URL('../frontend/src/pages/public/Booking.jsx', import.meta.url), 'utf8')
  const receipt = readFileSync(new URL('../frontend/src/pages/public/BookingSuccess.jsx', import.meta.url), 'utf8')
  assert.doesNotMatch(booking + receipt, /await (markWhatsAppHandoff|prepareWhatsAppHandoff)/)
  assert.match(booking, /window\.location\.assign\(confirmation\.whatsapp\.url\)/)
  assert.match(booking, /if \(submissionInFlight\.current\) return/)
  assert.match(receipt, /href=\{whatsapp\.url\}/)
  assert.match(receipt, /Copy booking message/)
  assert.doesNotMatch(receipt, /Your booking request was received\./)
})
