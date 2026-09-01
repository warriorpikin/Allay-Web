import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assertNoDuplicateSlugs } from '../scripts/importOfficialCatalogue.js'
import { catalogueCategories, memberships, officialServices } from '../db/seedData/officialCatalogue.js'

const KNOWN_CATEGORY_SLUGS = new Set(catalogueCategories.map((category) => category.slug))

test('official August 2026 catalogue contains exactly 384 bookable entries', () => {
  assert.equal(officialServices.length, 384)
})

test('official catalogue has no duplicate slugs', () => {
  assert.doesNotThrow(() => assertNoDuplicateSlugs())
})

test('every service references a supplied catalogue category', () => {
  const unknown = officialServices.filter((service) => !KNOWN_CATEGORY_SLUGS.has(service.categorySlug))
  assert.deepEqual(unknown.map((service) => service.name), [])
})

test('every service has a positive price and internal scheduling duration', () => {
  const invalid = officialServices.filter((service) => !(service.price > 0) || !(service.duration > 0))
  assert.deepEqual(invalid.map((service) => service.name), [])
})

test('advertised durations are only shown when supplied explicitly', () => {
  const express = officialServices.find((service) => service.name === 'Express Head Spa')
  const swedish90 = officialServices.find((service) => service.name === 'Swedish Massage (90 mins)')
  const deepTissue = officialServices.find((service) => service.name === 'Deep Tissue Massage')
  assert.equal(express.durationLabel, '30 mins')
  assert.equal(swedish90.durationLabel, '90 mins')
  assert.equal(deepTissue.durationLabel, null)
})

test('spot-check prices across every supplied price-list division', () => {
  const byName = new Map(officialServices.map((service) => [service.name, service]))
  const expected = {
    'Allay House Signature Ritual': 195000,
    'Express Head Spa': 48000,
    'Swedish Massage (60 mins)': 68000,
    'Traditional Hammam': 75000,
    'EMS ZeroSculpt': 98000,
    'Melanostop Peel': 160000,
    'Microneedling (Pigmentation)': 225000,
    'Wash & Blow Dry': 15000,
    'Balayage': 135000,
    'Frontal Wig Install': 60000,
    'Knotless Braids — Waist Length': 90000,
    'Group Class (Minimum 4 People)': 25000,
    'Allay Reset': 180000,
    'Russian Manicure + BIAB (Extensions)': 54500,
    'Therapeutic (Chinese) Pedicure': 46000,
    'Bridal Nail Experience': 85000,
  }
  for (const [name, price] of Object.entries(expected)) {
    assert.ok(byName.has(name), `missing expected service "${name}"`)
    assert.equal(byName.get(name).price, price, `price mismatch for "${name}"`)
  }
})

test('ranged, from, per-unit, and multi-option prices are preserved', () => {
  const byName = new Map(officialServices.map((service) => [service.name, service]))
  assert.equal(byName.get('Private Pilates Session').priceFrom, 65000)
  assert.equal(byName.get('Private Pilates Session').priceTo, 75000)
  assert.equal(byName.get('Bridal Hair Styling').priceIsFrom, true)
  assert.equal(byName.get('Corporate Wellness Experience').priceUnitLabel, 'per person')
  assert.deepEqual(byName.get('Goddess Braids — Bob Length').priceOptions, [48000, 35000, 30000])
  assert.deepEqual(byName.get('Knotless Braids — Bob Length').priceOptions, [45000, 42000, 26000])
})

test('duplicate display names keep separate stable slugs', () => {
  const duplicates = ['Hair Analysis', 'Scalp Massage', 'Nail Trimming']
    .flatMap((name) => officialServices.filter((service) => service.name === name))
  assert.equal(duplicates.length, 6)
  assert.equal(new Set(duplicates.map((service) => service.slug)).size, 6)
})

test('the three existing lifestyle memberships are retained', () => {
  assert.equal(memberships.length, 3)
  const bySlug = new Map(memberships.map((membership) => [membership.slug, membership]))
  assert.equal(bySlug.get('the-reset').monthlyPrice, 250000)
  assert.equal(bySlug.get('the-ritual').monthlyPrice, 480000)
  assert.equal(bySlug.get('the-sanctuary').monthlyPrice, 850000)
})
