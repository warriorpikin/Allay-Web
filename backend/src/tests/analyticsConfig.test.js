import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeAnalyticsPrivateKey, normalizeAnalyticsPropertyId } from '../services/analyticsService.js'

test('normalizes GA4 numeric property IDs without double-prefixing', () => {
  assert.deepEqual(normalizeAnalyticsPropertyId('123456789'), {
    raw: '123456789',
    propertyId: '123456789',
    propertyName: 'properties/123456789',
    valid: true,
    numeric: true,
    message: 'GA4_PROPERTY_ID must be a numeric property ID, optionally prefixed with properties/.',
  })

  assert.equal(normalizeAnalyticsPropertyId('properties/123456789').propertyName, 'properties/123456789')
  assert.equal(normalizeAnalyticsPropertyId('G-ABCDEFG123').valid, false)
  assert.equal(normalizeAnalyticsPropertyId('project-id-123').valid, false)
})

test('normalizes escaped and quoted service-account private keys', () => {
  const raw = '"-----BEGIN PRIVATE KEY-----\\nabc123\\n-----END PRIVATE KEY-----\\n"'
  const normalized = normalizeAnalyticsPrivateKey(raw)

  assert.equal(normalized.includes('\\n'), false)
  assert.equal(normalized.includes('\nabc123\n'), true)
  assert.equal(normalized.startsWith('-----BEGIN PRIVATE KEY-----'), true)
  assert.equal(normalized.endsWith('-----END PRIVATE KEY-----'), true)
})
