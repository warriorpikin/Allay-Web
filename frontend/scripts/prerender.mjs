#!/usr/bin/env node
// Post-build step: bakes per-route <title>/meta description/canonical/OG/
// Twitter/JSON-LD tags into static HTML snapshots for every public,
// data-driven route (services, categories, memberships) plus the static
// pages, so crawlers and social-share unfurlers see correct metadata
// without executing JS. This is deliberately NOT a full content prerender
// (no headless browser) — it keeps the Vercel build fast and dependency-free
// while covering the actual SEO requirement (metadata in the initial HTML).
// Visible page content still renders via the normal SPA bundle, same as
// today; Googlebot's JS renderer and react-helmet-async on the client keep
// metadata correct during in-app navigation.
//
// Vercel serves matching static files before falling back to the SPA
// rewrite (frontend/vercel.json), so a generated dist/services/<slug>/index.html
// is what a crawler hitting that exact URL receives.
//
// Never fails the build: any error here is logged and swallowed so a
// transient API outage during a build can never break deployment. Run it
// manually (node scripts/prerender.mjs) after a local `vite build` to debug.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')

const SITE_URL = (process.env.VITE_SITE_URL || 'http://localhost:5173').replace(/\/+$/, '')
const API_URL = (process.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '')
const DEFAULT_IMAGE = `${SITE_URL}/images/allay/home/home-hero-main.jpg`

function siteUrl(p = '') {
  return `${SITE_URL}${p.startsWith('/') ? p : `/${p}`}`
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error(`${url} responded with ${response.status}`)
  return response.json()
}

function injectHead(template, { title, description, path: routePath, image = DEFAULT_IMAGE, jsonLdList = [] }) {
  const canonical = siteUrl(routePath)
  let html = template.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
  html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escapeHtml(description)}" />`)

  const tags = [
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    '<meta name="robots" content="index, follow" />',
    '<meta property="og:site_name" content="Allay House" />',
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    ...jsonLdList.filter(Boolean).map((entry) => `<script type="application/ld+json">${JSON.stringify(entry)}</script>`),
  ].join('\n    ')

  return html.replace('</head>', `    ${tags}\n  </head>`)
}

async function writeRoute(template, routePath, headData) {
  const html = injectHead(template, { ...headData, path: routePath })
  const outDir = path.join(distDir, routePath === '/' ? '.' : routePath.replace(/^\//, ''))
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, 'index.html'), html, 'utf8')
}

function organizationJsonLd() {
  return { '@context': 'https://schema.org', '@type': 'Organization', name: 'Allay House', url: siteUrl('/'), logo: siteUrl('/images/brand/allay-logo-brown.svg') }
}

function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.label, item: siteUrl(item.path) })),
  }
}

function serviceJsonLd(service) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: service.name,
    name: service.name,
    description: service.shortDescription || service.description || undefined,
    provider: { '@type': 'HealthAndBeautyBusiness', name: 'Allay House', url: siteUrl('/') },
    url: siteUrl(`/services/${service.slug}`),
    offers: { '@type': 'Offer', priceCurrency: 'NGN', price: service.price ?? service.priceFrom ?? undefined, url: siteUrl(`/services/${service.slug}`) },
  }
}

function membershipJsonLd(membership) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Wellness membership',
    name: membership.name,
    description: membership.description || membership.tagline || undefined,
    provider: { '@type': 'HealthAndBeautyBusiness', name: 'Allay House', url: siteUrl('/') },
    url: siteUrl(`/memberships/${membership.slug}`),
    offers: { '@type': 'Offer', priceCurrency: 'NGN', price: membership.monthlyPrice, url: siteUrl(`/memberships/${membership.slug}`) },
  }
}

async function run() {
  const template = await readFile(path.join(distDir, 'index.html'), 'utf8')

  await writeRoute(template, '/', {
    title: 'Allay House | Beauty, Wellness & Movement in Lagos',
    description: 'Allay House is a refined sanctuary for beauty, wellness, and movement in Lagos, Nigeria — head spa, massage, hammam, facials, nails, lashes, waxing, and reformer Pilates.',
    jsonLdList: [organizationJsonLd()],
  })

  const staticPages = [
    { path: '/about', title: 'About Allay House | Beauty, Wellness & Movement', description: 'Allay House is a Lagos sanctuary bringing beauty treatments, spa rituals, and restorative movement into one considered experience.' },
    { path: '/contact', title: 'Contact Allay House | Beauty, Wellness & Movement in Lagos', description: 'Get in touch with Allay House in Lagos, Nigeria — questions, collaborations, or help choosing your first treatment.' },
    { path: '/services', title: 'Beauty & Wellness Services | Allay House', description: 'Explore every Allay House treatment — head spa, massage, hammam, facials, nails, lashes, waxing, and reformer Pilates — and book online.' },
    { path: '/memberships', title: 'Beauty and Wellness Memberships | Allay House', description: 'Join an Allay House membership for a monthly rhythm of head spa, massage, hammam, Pilates, and beauty rituals — with priority booking and member pricing.' },
    { path: '/privacy-policy', title: 'Privacy Policy | Allay House', description: 'How Allay House collects, uses, and protects your personal information.' },
    { path: '/terms-of-use', title: 'Terms of Use | Allay House', description: 'Terms for using the Allay House website and booking services.' },
    { path: '/landing', title: 'Allay House | Beauty, Wellness & Movement in Lagos', description: 'Allay House is opening in Lagos — a refined sanctuary for beauty, wellness, and movement. Join the waitlist for early access.' },
    { path: '/waitlist', title: 'Join the Allay House Waitlist | Beauty & Wellness in Lagos', description: 'Join the private Allay House waitlist for early access and launch offers on beauty, wellness, and movement services in Lagos.' },
  ]
  for (const page of staticPages) await writeRoute(template, page.path, page)

  const [categoriesData, servicesData, membershipsData] = await Promise.all([
    fetchJson(`${API_URL}/service-categories`).catch(() => ({ categories: [] })),
    fetchJson(`${API_URL}/services`).catch(() => ({ services: [] })),
    fetchJson(`${API_URL}/memberships`).catch(() => ({ memberships: [] })),
  ])

  for (const category of categoriesData.categories || []) {
    await writeRoute(template, `/services/category/${category.slug}`, {
      title: `${category.name} | Allay House`,
      description: category.seoDescription || `${category.description || ''} Book ${category.name.toLowerCase()} at Allay House in Lagos.`.trim(),
      jsonLdList: [breadcrumbJsonLd([{ label: 'Home', path: '/' }, { label: 'Services', path: '/services' }, { label: category.name, path: `/services/category/${category.slug}` }])],
    })
  }

  for (const service of servicesData.services || []) {
    await writeRoute(template, `/services/${service.slug}`, {
      title: service.seoTitle || `${service.name} | Allay House`,
      description: service.seoDescription || service.shortDescription || service.description || `${service.name} at Allay House.`,
      image: service.imageUrl || DEFAULT_IMAGE,
      jsonLdList: [
        serviceJsonLd(service),
        breadcrumbJsonLd([{ label: 'Home', path: '/' }, { label: 'Services', path: '/services' }, { label: service.category, path: `/services/category/${service.categorySlug || ''}` }, { label: service.name, path: `/services/${service.slug}` }]),
      ],
    })
  }

  for (const membership of membershipsData.memberships || []) {
    await writeRoute(template, `/memberships/${membership.slug}`, {
      title: membership.seoTitle || `${membership.name} Membership | Allay House`,
      description: membership.seoDescription || membership.description || membership.tagline || `${membership.name} membership at Allay House.`,
      image: membership.imageUrl || DEFAULT_IMAGE,
      jsonLdList: [
        membershipJsonLd(membership),
        breadcrumbJsonLd([{ label: 'Home', path: '/' }, { label: 'Memberships', path: '/memberships' }, { label: membership.name, path: `/memberships/${membership.slug}` }]),
      ],
    })
  }

  const total = 1 + staticPages.length + (categoriesData.categories?.length || 0) + (servicesData.services?.length || 0) + (membershipsData.memberships?.length || 0)
  console.log(`Prerendered ${total} static HTML snapshots for SEO metadata.`)
}

run().catch((error) => {
  console.warn('[prerender] Skipped or partially failed — this does not fail the build.')
  console.warn(error.message || error)
})
