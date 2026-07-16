import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import app from '../app.js'
import { pool } from '../config/database.js'

let server
let baseUrl

before(async () => {
  server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance))
  })
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve) => server.close(resolve))
  await pool.end()
})

test('robots.txt is served with a Sitemap directive', async () => {
  const response = await fetch(`${baseUrl}/robots.txt`)
  assert.equal(response.status, 200)
  const body = await response.text()
  assert.match(body, /Sitemap: .+\/sitemap\.xml/)
  assert.match(body, /Disallow: \/allay-admin/)
})

test('sitemap.xml returns a valid sitemap index referencing every sub-sitemap', async () => {
  const response = await fetch(`${baseUrl}/sitemap.xml`)
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type') || '', /xml/)
  const body = await response.text()
  assert.match(body, /<sitemapindex/)
  for (const file of ['sitemap-pages.xml', 'sitemap-services.xml', 'sitemap-categories.xml', 'sitemap-memberships.xml', 'sitemap-images.xml']) {
    assert.ok(body.includes(file), `sitemap index is missing ${file}`)
  }
})

test('sitemap-services.xml is valid XML and excludes admin/api routes', async () => {
  const response = await fetch(`${baseUrl}/sitemap-services.xml`)
  assert.equal(response.status, 200)
  const body = await response.text()
  assert.match(body, /<urlset/)
  assert.ok(!body.includes('/allay-admin'))
  assert.ok(!body.includes('/api/'))
})

test('sitemap-categories.xml lists active categories as clean canonical URLs', async () => {
  const response = await fetch(`${baseUrl}/sitemap-categories.xml`)
  const body = await response.text()
  assert.match(body, /<loc>.*\/services\/category\//)
})

test('sitemap-images.xml is valid XML with the image namespace', async () => {
  const response = await fetch(`${baseUrl}/sitemap-images.xml`)
  assert.equal(response.status, 200)
  const body = await response.text()
  assert.match(body, /xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1"/)
})
