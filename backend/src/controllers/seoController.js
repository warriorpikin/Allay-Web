import { env } from '../config/env.js'
import { query } from '../config/database.js'
import { getCached } from '../services/sitemapCacheService.js'

function xmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function siteUrl(path = '') {
  return `${env.PUBLIC_SITE_URL}${path}`
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  let entry = `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n`
  if (lastmod) entry += `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>\n`
  if (changefreq) entry += `    <changefreq>${changefreq}</changefreq>\n`
  if (priority !== undefined) entry += `    <priority>${priority}</priority>\n`
  entry += '  </url>\n'
  return entry
}

function wrapUrlset(entries, extraNamespace = '') {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${extraNamespace}>\n${entries.join('')}</urlset>\n`
}

// Only genuinely indexable, canonical public pages — no admin, auth, account
// or callback routes. The pre-launch waitlist/landing pages are included
// because they currently serve real public content for Allay House.
const STATIC_PAGES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'monthly', priority: '0.6' },
  { path: '/services', changefreq: 'daily', priority: '0.9' },
  { path: '/memberships', changefreq: 'weekly', priority: '0.8' },
  { path: '/landing', changefreq: 'weekly', priority: '0.5' },
  { path: '/waitlist', changefreq: 'weekly', priority: '0.5' },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.2' },
  { path: '/terms-of-use', changefreq: 'yearly', priority: '0.2' },
]

export async function getPagesSitemap(req, res, next) {
  try {
    const xml = await getCached('sitemap-pages', async () => {
      const entries = STATIC_PAGES.map((page) => urlEntry({
        loc: siteUrl(page.path),
        lastmod: new Date(),
        changefreq: page.changefreq,
        priority: page.priority,
      }))
      return wrapUrlset(entries)
    })
    res.type('application/xml').send(xml)
  } catch (error) {
    next(error)
  }
}

export async function getServicesSitemap(req, res, next) {
  try {
    const xml = await getCached('sitemap-services', async () => {
      const result = await query(
        `SELECT slug, updated_at FROM services
         WHERE is_active = TRUE AND COALESCE(bookable, TRUE) = TRUE
         ORDER BY updated_at DESC`,
      )
      const entries = result.rows.map((row) => urlEntry({
        loc: siteUrl(`/services/${row.slug}`),
        lastmod: row.updated_at,
        changefreq: 'weekly',
        priority: '0.7',
      }))
      return wrapUrlset(entries)
    })
    res.type('application/xml').send(xml)
  } catch (error) {
    next(error)
  }
}

export async function getCategoriesSitemap(req, res, next) {
  try {
    const xml = await getCached('sitemap-categories', async () => {
      const result = await query(
        `SELECT slug FROM service_categories WHERE is_active = TRUE ORDER BY display_order ASC`,
      )
      const entries = result.rows.map((row) => urlEntry({
        loc: siteUrl(`/services/category/${row.slug}`),
        changefreq: 'weekly',
        priority: '0.6',
      }))
      return wrapUrlset(entries)
    })
    res.type('application/xml').send(xml)
  } catch (error) {
    next(error)
  }
}

export async function getMembershipsSitemap(req, res, next) {
  try {
    const xml = await getCached('sitemap-memberships', async () => {
      const result = await query(
        `SELECT slug, updated_at FROM memberships WHERE is_active = TRUE ORDER BY display_order ASC`,
      )
      const entries = result.rows.map((row) => urlEntry({
        loc: siteUrl(`/memberships/${row.slug}`),
        lastmod: row.updated_at,
        changefreq: 'monthly',
        priority: '0.7',
      }))
      return wrapUrlset(entries)
    })
    res.type('application/xml').send(xml)
  } catch (error) {
    next(error)
  }
}

// Static hero/brand images already deployed as public assets under
// frontend/public/images — real, stable, crawlable HTTPS paths once served
// from the production domain. Filenames are left untouched here since they
// are already referenced throughout the frontend (renaming would break
// existing <img> references); descriptive titles are supplied separately.
const STATIC_IMAGES = [
  { path: '/images/allay/home/home-hero-main.jpg', title: 'Allay House beauty and wellness home hero' },
  { path: '/images/allay/about/about-hero.jpg', title: 'Allay House about page hero' },
  { path: '/images/allay/contact/contact-hero.jpg', title: 'Allay House contact page hero' },
  { path: '/images/brand/allay-logo-brown.svg', title: 'Allay House logo' },
]

export async function getImagesSitemap(req, res, next) {
  try {
    const xml = await getCached('sitemap-images', async () => {
      const [services, memberships] = await Promise.all([
        query(`SELECT slug, name, image_url FROM services WHERE is_active = TRUE AND image_url IS NOT NULL AND image_url <> ''`),
        query(`SELECT slug, name, image_url FROM memberships WHERE is_active = TRUE AND image_url IS NOT NULL AND image_url <> ''`),
      ])

      const entries = []

      entries.push(
        `  <url>\n    <loc>${xmlEscape(siteUrl('/'))}</loc>\n` +
        STATIC_IMAGES.map((image) => (
          `    <image:image>\n      <image:loc>${xmlEscape(siteUrl(image.path))}</image:loc>\n      <image:title>${xmlEscape(image.title)}</image:title>\n    </image:image>\n`
        )).join('') +
        '  </url>\n',
      )

      for (const row of services.rows) {
        entries.push(
          `  <url>\n    <loc>${xmlEscape(siteUrl(`/services/${row.slug}`))}</loc>\n` +
          `    <image:image>\n      <image:loc>${xmlEscape(row.image_url)}</image:loc>\n      <image:title>${xmlEscape(row.name)}</image:title>\n    </image:image>\n` +
          '  </url>\n',
        )
      }

      for (const row of memberships.rows) {
        entries.push(
          `  <url>\n    <loc>${xmlEscape(siteUrl(`/memberships/${row.slug}`))}</loc>\n` +
          `    <image:image>\n      <image:loc>${xmlEscape(row.image_url)}</image:loc>\n      <image:title>${xmlEscape(row.name)}</image:title>\n    </image:image>\n` +
          '  </url>\n',
        )
      }

      return wrapUrlset(entries, ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"')
    })
    res.type('application/xml').send(xml)
  } catch (error) {
    next(error)
  }
}

export async function getSitemapIndex(req, res, next) {
  try {
    const xml = await getCached('sitemap-index', async () => {
      const sitemapFiles = [
        'sitemap-pages.xml',
        'sitemap-services.xml',
        'sitemap-categories.xml',
        'sitemap-memberships.xml',
        'sitemap-images.xml',
      ]
      const now = new Date().toISOString()
      const entries = sitemapFiles.map((file) => (
        `  <sitemap>\n    <loc>${xmlEscape(siteUrl(`/${file}`))}</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>\n`
      ))
      return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('')}</sitemapindex>\n`
    })
    res.type('application/xml').send(xml)
  } catch (error) {
    next(error)
  }
}

export function getRobotsTxt(req, res) {
  const lines = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /allay-admin',
    'Disallow: /auth/',
    'Disallow: /api/',
    '',
    `Sitemap: ${siteUrl('/sitemap.xml')}`,
    '',
  ]
  res.type('text/plain').send(lines.join('\n'))
}
