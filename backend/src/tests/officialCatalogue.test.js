import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assertNoDuplicateSlugs, slugify } from '../scripts/importOfficialCatalogue.js'
import { legacySeededServiceSlugs, memberships, newCategories, officialServices } from '../db/seedData/officialCatalogue.js'

// Pure data-level validation — no database connection required. Catches
// transcription errors in officialCatalogue.js (wrong price, wrong count,
// duplicate slug, unknown category) before anyone ever runs the import.

const KNOWN_CATEGORY_SLUGS = new Set([
  'facials', 'massage', 'sauna', 'headspa', 'allay-pilates', 'allay-lash-studio',
  'allay-salon', 'hair-wigs', 'allay-nail-studio', 'body-beauty',
  ...newCategories.map((c) => c.slug),
])

test('official catalogue contains exactly 125 entries', () => {
  assert.equal(officialServices.length, 125)
})

test('official catalogue has no duplicate slugs', () => {
  assert.doesNotThrow(() => assertNoDuplicateSlugs())
})

test('every service references a known category slug', () => {
  const unknown = officialServices.filter((service) => !KNOWN_CATEGORY_SLUGS.has(service.categorySlug))
  assert.deepEqual(unknown.map((s) => s.name), [])
})

test('every service has a positive price and duration', () => {
  const invalid = officialServices.filter((service) => !(service.price > 0) || !(service.duration > 0))
  assert.deepEqual(invalid.map((s) => s.name), [])
})

test('new categories are exactly Waxing and Signature Experiences', () => {
  assert.deepEqual(newCategories.map((c) => c.slug).sort(), ['signature-experiences', 'waxing'])
})

test('legacy seeded slugs list has exactly the 13 originally-seeded services', () => {
  assert.equal(legacySeededServiceSlugs.length, 13)
  assert.equal(new Set(legacySeededServiceSlugs).size, 13)
})

test('spot-check official prices match the supplied catalogue', () => {
  const bySlug = new Map(officialServices.map((service) => [slugify(service.name), service]))
  const expected = {
    'express-head-spa': 45000,
    'signature-japanese-head-spa': 70000,
    'deluxe-head-spa-steam-shoulder-massage': 105000,
    'couples-head-spa-experience': 215000,
    'knotless-braids-without-extensions': 70000,
    'seamless-wig-install': 45000,
    'custom-wig-coloring': 195000,
    'hydrafacial': 122000,
    'brazilian-wax': 26000,
    'full-body-wax': 97000,
    'allay-house-full-day-reset': 250000,
    'bridal-glow-experience': 320000,
    'corporate-wellness-retreat': 150000,
  }
  for (const [slug, price] of Object.entries(expected)) {
    assert.ok(bySlug.has(slug), `missing expected service with slug "${slug}"`)
    assert.equal(bySlug.get(slug).price, price, `price mismatch for "${slug}"`)
  }
})

test('knotless and micro braids are categorised under Hair & Wigs, not Allay Salon', () => {
  const braidNames = [
    'Knotless Braids Without Extensions', 'Knotless Braids - Shoulder Length', 'Knotless Braids - Mid Back Length',
    'Knotless Braids - Long Length', 'Knotless Braids - Extra Long Length',
    'Micro Braids - Shoulder Length', 'Micro Braids - Mid Back Length', 'Micro Braids - Long Length', 'Micro Braids - Extra Long Length',
  ]
  const byName = new Map(officialServices.map((service) => [service.name, service]))
  for (const name of braidNames) {
    assert.ok(byName.has(name), `missing expected service "${name}"`)
    assert.equal(byName.get(name).categorySlug, 'hair-wigs', `"${name}" should be categorised under hair-wigs`)
  }
})

test('ranged and "from" pricing is preserved for known examples', () => {
  const bySlug = new Map(officialServices.map((service) => [slugify(service.name), service]))
  const seamlessWig = bySlug.get('seamless-wig-install')
  assert.equal(seamlessWig.priceFrom, 45000)
  assert.equal(seamlessWig.priceTo, 80000)

  const cornrows = bySlug.get('cornrows')
  assert.equal(cornrows.priceIsFrom, true)
  assert.equal(cornrows.priceFrom, 15000)

  const corporateWellness = bySlug.get('corporate-wellness-retreat')
  assert.equal(corporateWellness.priceUnitLabel, 'per person')
})

test('official catalogue defines exactly 3 memberships with the supplied prices', () => {
  assert.equal(memberships.length, 3)
  const bySlug = new Map(memberships.map((m) => [m.slug, m]))
  assert.equal(bySlug.get('the-reset').monthlyPrice, 250000)
  assert.equal(bySlug.get('the-ritual').monthlyPrice, 480000)
  assert.equal(bySlug.get('the-sanctuary').monthlyPrice, 850000)
})
