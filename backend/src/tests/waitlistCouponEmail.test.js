import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderWaitlistCouponEmail } from '../emails/templates/waitlistCouponEmail.js'

test('escapes the customer name and displays it in both HTML and text', () => {
  const rendered = renderWaitlistCouponEmail({
    fullName: '<script>alert(1)</script>',
    couponCode: 'ALLAY-TEST1',
    discountType: 'percent',
    discountValue: 15,
    services: [],
  })
  assert.doesNotMatch(rendered.html, /<script>alert/)
  assert.match(rendered.html, /&lt;script&gt;/)
  assert.match(rendered.text, /<script>alert\(1\)<\/script>/) // plain text is not HTML-escaped
})

test('coupon code appears as selectable text in HTML and plain text', () => {
  const rendered = renderWaitlistCouponEmail({
    fullName: 'Jane Doe',
    couponCode: 'ALLAY-ABC123',
    discountType: 'percent',
    discountValue: 15,
    services: [],
  })
  assert.match(rendered.html, /ALLAY-ABC123/)
  assert.match(rendered.html, /user-select:all/)
  assert.match(rendered.text, /ALLAY-ABC123/)
})

test('lists every selected service with a correctly calculated discounted price', () => {
  const rendered = renderWaitlistCouponEmail({
    fullName: 'Jane Doe',
    couponCode: 'ALLAY-ABC123',
    discountType: 'percent',
    discountValue: 20,
    services: [
      { name: 'Allay House Signature Ritual', price: 195000 },
      { name: 'Traditional Sauna', price: 30000 },
    ],
  })
  assert.match(rendered.html, /Allay House Signature Ritual/)
  assert.match(rendered.html, /Traditional Sauna/)
  // 195000 * 0.8 = 156000, 30000 * 0.8 = 24000
  assert.match(rendered.html, /156,000/)
  assert.match(rendered.html, /24,000/)
  assert.match(rendered.text, /Allay House Signature Ritual/)
  assert.match(rendered.text, /Traditional Sauna/)
})

test('a service with no price shows the name and discount without inventing a price', () => {
  const rendered = renderWaitlistCouponEmail({
    fullName: 'Jane Doe',
    couponCode: 'ALLAY-ABC123',
    discountType: 'percent',
    discountValue: 15,
    services: [{ name: 'Bridal Party Nail Package', price: 0 }],
  })
  assert.match(rendered.html, /Bridal Party Nail Package/)
  assert.match(rendered.html, /Price available on request/)
})

test('discount percentage is driven by the passed-in configuration, not hardcoded', () => {
  const rendered = renderWaitlistCouponEmail({
    fullName: 'Jane Doe',
    couponCode: 'ALLAY-ABC123',
    discountType: 'percent',
    discountValue: 42,
    services: [],
  })
  assert.match(rendered.html, /42% off/)
  assert.doesNotMatch(rendered.html, /15% off/)
})

test('missing services array does not crash rendering', () => {
  assert.doesNotThrow(() => renderWaitlistCouponEmail({ fullName: 'Jane Doe', couponCode: 'ALLAY-ABC123' }))
})

test('test emails are clearly marked and do not claim to be a real coupon', () => {
  const rendered = renderWaitlistCouponEmail({
    fullName: 'Jane Doe',
    couponCode: 'TEST-ALLAY-15',
    discountType: 'percent',
    discountValue: 15,
    services: [],
    isTest: true,
  })
  assert.match(rendered.subject, /^\[TEST\]/)
  assert.match(rendered.html, /Test email/)
  assert.match(rendered.text, /TEST EMAIL/)
})
