// One-time, idempotent import of the official Allay House catalogue.
//
// Usage:
//   npm run catalogue:import -w backend
//
// Safety:
// - Runs entirely inside one transaction. Any unexpected error rolls the
//   whole import back — nothing is left half-applied.
// - Upserts services/categories/memberships by slug, so running this twice
//   updates existing rows instead of duplicating them.
// - Never hard-deletes a service that is referenced by a booking, waitlist
//   entry, discount code, capacity override, add-on or package row — those
//   are archived (is_active = false) instead, so historical bookings keep
//   working. Only the original 13 seeded services are ever candidates for
//   archive/delete, and only by their known slugs — this script never
//   touches services it doesn't recognise, so re-running it later (after an
//   admin has added unrelated services) is safe.
import { pathToFileURL } from 'node:url'
import { pool } from '../config/database.js'
import {
  legacySeededServiceSlugs,
  memberships,
  newCategories,
  officialServices,
} from '../db/seedData/officialCatalogue.js'

export function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildSeoFields(name, categoryName, shortDescription) {
  const title = `${name} | Allay House`
  const description = shortDescription.length > 157 ? `${shortDescription.slice(0, 154)}...` : shortDescription
  const keywordTerms = new Set([
    name.toLowerCase(),
    `${name} allay house`.toLowerCase(),
    `${name} lagos`.toLowerCase(),
    categoryName ? `${categoryName} lagos`.toLowerCase() : null,
    'allay house',
  ].filter(Boolean))
  return { title, description, keywords: [...keywordTerms].join(', ') }
}

// Tables with a service_id foreign key. A legacy service is only safe to
// hard-delete when none of these reference it.
const SERVICE_REFERENCE_TABLES = [
  ['booking_services', 'service_id'],
  ['booking_items', 'service_id'],
  ['waitlist_selected_services', 'service_id'],
  ['discount_code_services', 'service_id'],
  ['booking_capacity_overrides', 'service_id'],
  ['service_addons', 'service_id'],
  ['service_packages', 'service_id'],
]

export async function isServiceReferenced(client, serviceId) {
  for (const [table, column] of SERVICE_REFERENCE_TABLES) {
    const result = await client.query(`SELECT 1 FROM ${table} WHERE ${column} = $1 LIMIT 1`, [serviceId])
    if (result.rows.length) return true
  }
  return false
}

export function assertNoDuplicateSlugs() {
  const seen = new Map()
  for (const service of officialServices) {
    const slug = slugify(service.name)
    if (!slug) throw new Error(`Service "${service.name}" produced an empty slug.`)
    if (seen.has(slug)) throw new Error(`Duplicate slug "${slug}" for "${service.name}" and "${seen.get(slug)}" — fix officialCatalogue.js before importing.`)
    seen.set(slug, service.name)
  }
}

export async function run() {
  assertNoDuplicateSlugs()

  const summary = {
    categoriesCreated: 0,
    categoriesReused: 0,
    legacyArchived: 0,
    legacyDeleted: 0,
    legacyAlreadyHandled: 0,
    servicesCreated: 0,
    servicesUpdated: 0,
    signatureExperiencesCreated: 0,
    signatureExperiencesUpdated: 0,
    membershipsCreated: 0,
    membershipsUpdated: 0,
    skipped: [],
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Ensure the two new categories exist (safe even if migration 009
    // already created them — ON CONFLICT-equivalent existence check).
    for (const category of newCategories) {
      const existing = await client.query('SELECT id FROM service_categories WHERE slug = $1', [category.slug])
      if (!existing.rows[0]) {
        await client.query(
          `INSERT INTO service_categories (name, slug, description, display_order, is_active)
           VALUES ($1, $2, $3, $4, TRUE)`,
          [category.name, category.slug, category.description, category.displayOrder],
        )
        summary.categoriesCreated += 1
      }
    }

    const categoryRows = (await client.query('SELECT id, slug, name FROM service_categories')).rows
    const categoryIdBySlug = new Map(categoryRows.map((row) => [row.slug, row.id]))
    const categoryNameBySlug = new Map(categoryRows.map((row) => [row.slug, row.name]))

    const distinctServiceCategorySlugs = new Set(officialServices.map((service) => service.categorySlug))
    summary.categoriesReused = [...distinctServiceCategorySlugs].filter((slug) => !newCategories.some((c) => c.slug === slug)).length

    // 2. Upsert the 124 official catalogue services by slug.
    for (const service of officialServices) {
      const categoryId = categoryIdBySlug.get(service.categorySlug)
      if (!categoryId) {
        throw new Error(`Unknown category slug "${service.categorySlug}" for service "${service.name}" — aborting import.`)
      }

      const slug = slugify(service.name)
      const categoryName = categoryNameBySlug.get(service.categorySlug)
      const seo = buildSeoFields(service.name, categoryName, service.short)
      const isSignature = service.categorySlug === 'signature-experiences'

      const existing = await client.query('SELECT id FROM services WHERE slug = $1', [slug])

      if (existing.rows[0]) {
        await client.query(
          `UPDATE services SET
            category_id = $1, name = $2, description = $3, short_description = $4, duration_minutes = $5,
            price = $6, price_from = $7, price_to = $8, price_is_from = $9, price_unit_label = $10,
            service_type = $11, is_addon = $12, is_couples = $13, session_count = $14,
            seo_title = $15, seo_description = $16, seo_keywords = $17,
            display_order = $18, is_active = TRUE, bookable = TRUE, simultaneous_capacity = COALESCE(simultaneous_capacity, 7)
           WHERE id = $19`,
          [
            categoryId, service.name, service.description, service.short, service.duration,
            service.price, service.priceFrom, service.priceTo, service.priceIsFrom, service.priceUnitLabel,
            service.serviceType, service.isAddon, service.isCouples, service.sessionCount,
            seo.title, seo.description, seo.keywords,
            service.order, existing.rows[0].id,
          ],
        )
        summary.servicesUpdated += 1
        if (isSignature) summary.signatureExperiencesUpdated += 1
      } else {
        await client.query(
          `INSERT INTO services (
            category_id, name, slug, description, short_description, duration_minutes,
            price, price_from, price_to, price_is_from, price_unit_label,
            service_type, is_addon, is_couples, session_count,
            seo_title, seo_description, seo_keywords,
            display_order, is_active, bookable, is_discount_eligible, simultaneous_capacity
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, TRUE, TRUE, TRUE, 7
          )`,
          [
            categoryId, service.name, slug, service.description, service.short, service.duration,
            service.price, service.priceFrom, service.priceTo, service.priceIsFrom, service.priceUnitLabel,
            service.serviceType, service.isAddon, service.isCouples, service.sessionCount,
            seo.title, seo.description, seo.keywords,
            service.order,
          ],
        )
        summary.servicesCreated += 1
        if (isSignature) summary.signatureExperiencesCreated += 1
      }
    }

    // 3. Retire the 13 originally-seeded services — archive if referenced by
    // booking/waitlist/discount/capacity history, otherwise hard-delete.
    for (const slug of legacySeededServiceSlugs) {
      const existing = await client.query('SELECT id, is_active FROM services WHERE slug = $1', [slug])
      if (!existing.rows[0]) {
        summary.legacyAlreadyHandled += 1
        continue
      }
      const { id, is_active: isActive } = existing.rows[0]
      const referenced = await isServiceReferenced(client, id)
      if (referenced) {
        if (isActive) {
          await client.query('UPDATE services SET is_active = FALSE, bookable = FALSE WHERE id = $1', [id])
          summary.legacyArchived += 1
        } else {
          summary.legacyAlreadyHandled += 1
        }
      } else {
        await client.query('DELETE FROM services WHERE id = $1', [id])
        summary.legacyDeleted += 1
      }
    }

    // 4. Upsert the three membership plans by slug.
    for (const membership of memberships) {
      const seo = buildSeoFields(membership.name, 'Memberships', membership.tagline || membership.description)
      const existing = await client.query('SELECT id FROM memberships WHERE slug = $1', [membership.slug])
      const benefitsJson = JSON.stringify(membership.benefits)

      if (existing.rows[0]) {
        await client.query(
          `UPDATE memberships SET
            name = $1, tagline = $2, monthly_price = $3, description = $4, benefits = $5::jsonb,
            display_order = $6, is_featured = $7, terms = $8, seo_title = $9, seo_description = $10, is_active = TRUE
           WHERE id = $11`,
          [
            membership.name, membership.tagline, membership.monthlyPrice, membership.description, benefitsJson,
            membership.displayOrder, membership.isFeatured, membership.terms, seo.title, seo.description,
            existing.rows[0].id,
          ],
        )
        summary.membershipsUpdated += 1
      } else {
        await client.query(
          `INSERT INTO memberships (
            name, slug, tagline, monthly_price, description, benefits, display_order, is_featured, terms,
            seo_title, seo_description, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, TRUE)`,
          [
            membership.name, membership.slug, membership.tagline, membership.monthlyPrice, membership.description,
            benefitsJson, membership.displayOrder, membership.isFeatured, membership.terms, seo.title, seo.description,
          ],
        )
        summary.membershipsCreated += 1
      }
    }

    const totalActive = await client.query('SELECT COUNT(*)::int AS count FROM services WHERE is_active = TRUE')
    summary.totalActiveServices = totalActive.rows[0].count

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Import failed — transaction rolled back. No changes were saved.')
    console.error(error)
    process.exitCode = 1
    return summary
  } finally {
    client.release()
  }

  return summary
}

function printSummary(summary) {
  console.log('\nOfficial Allay House catalogue import — summary')
  console.log('================================================')
  console.log(`Categories reused:              ${summary.categoriesReused}`)
  console.log(`Categories created:              ${summary.categoriesCreated}`)
  console.log(`Services created:                ${summary.servicesCreated}`)
  console.log(`Services updated:                ${summary.servicesUpdated}`)
  console.log(`  of which signature experiences created: ${summary.signatureExperiencesCreated}`)
  console.log(`  of which signature experiences updated: ${summary.signatureExperiencesUpdated}`)
  console.log(`Legacy services archived:        ${summary.legacyArchived}`)
  console.log(`Legacy services deleted:         ${summary.legacyDeleted}`)
  console.log(`Legacy services already handled: ${summary.legacyAlreadyHandled}`)
  console.log(`Memberships created:             ${summary.membershipsCreated}`)
  console.log(`Memberships updated:             ${summary.membershipsUpdated}`)
  console.log(`Skipped or invalid records:      ${summary.skipped.length}`)
  if (summary.skipped.length) console.log(summary.skipped)
  console.log(`Total active services now:       ${summary.totalActiveServices ?? 'unknown (import failed)'}`)
  console.log('================================================\n')
}

// Only auto-run when this file is executed directly (`node
// src/scripts/importOfficialCatalogue.js` / `npm run catalogue:import`) —
// never when imported as a module (e.g. by tests), since import() side
// effects here would mean simply loading this file for its exported helpers
// runs the real import against the live database.
const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isDirectRun) {
  run()
    .then((summary) => {
      printSummary(summary)
    })
    .catch((error) => {
      console.error(error)
      process.exitCode = 1
    })
    .finally(() => pool.end())
}
