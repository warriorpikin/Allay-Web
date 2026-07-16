import { Router } from 'express'
import {
  getCategoriesSitemap,
  getImagesSitemap,
  getMembershipsSitemap,
  getPagesSitemap,
  getRobotsTxt,
  getServicesSitemap,
  getSitemapIndex,
} from '../controllers/seoController.js'

const router = Router()

// Mounted at the app root (see app.js) so these resolve to /sitemap.xml and
// /robots.txt — the public site proxies www.allayhouse.com/sitemap.xml and
// /robots.txt straight through to this API via a Vercel rewrite, since a
// sitemap/robots file must be served from the same origin as the URLs it
// lists.
router.get('/robots.txt', getRobotsTxt)
router.get('/sitemap.xml', getSitemapIndex)
router.get('/sitemap-pages.xml', getPagesSitemap)
router.get('/sitemap-services.xml', getServicesSitemap)
router.get('/sitemap-categories.xml', getCategoriesSitemap)
router.get('/sitemap-memberships.xml', getMembershipsSitemap)
router.get('/sitemap-images.xml', getImagesSitemap)

export default router
