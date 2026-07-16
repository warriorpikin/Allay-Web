# Official Catalogue Replacement + SEO — Implementation Notes

This document covers the catalogue replacement (125 services + 3 memberships)
and the SEO implementation added on top of the existing Allay House codebase.

## Status

- Schema migration `009_official_catalogue_seo.sql` **has been run** against
  the production database (additive only — new nullable columns, the new
  `memberships` table, and the two new categories).
- The catalogue import (`npm run catalogue:import -w backend`) **has not been
  run**. The live public catalogue still shows the original 13 seeded
  services. Running the import is the one remaining step — see
  [Running the import](#running-the-import) below.
- All code (catalogue data, membership system, SEO/sitemap, admin UI, mailto
  contact form) **has been committed and pushed to `origin/main`**
  (commit `e9fc855`), triggering Render (backend) and Vercel (frontend)
  auto-deploys. Nothing was live in production before this push — that was
  the actual cause of `sitemap.xml` returning 404/HTML.
- The catalogue was revised once after the first pass: the official list was
  updated to 125 entries (one additional base "Knotless Braids Without
  Extensions" service) with corrected durations for most services and
  knotless/micro braids re-categorised from Allay Salon to Hair & Wigs. The
  data file, tests, and keyword library were all updated to match.

## A note on "Allay Spa"

One revision of the official catalogue listed a category called "Allay Spa"
for lymphatic drainage / wood therapy / EMSZero / body-contouring services.
**This category does not exist in the database** — the real, existing
category covering that content is **Body & Beauty** (slug `body-beauty`,
one of the original 10 seeded categories). "Allay Spa" only appears as a
stale, unused entry in the frontend's static category-chip list
(`frontend/src/data/serviceCategories.js`), left over from earlier design
work — it was never actually seeded as a database category. Rather than
create a new, duplicate category for a name that was never real, these 12
services stay mapped to Body & Beauty, which was already correct in the
first pass. Flagging this explicitly in case "Allay Spa" was meant as an
intentional rename request rather than a mix-up — that would be a separate,
larger change (renaming a category used by 12 existing services) I did not
make without confirmation.

## Files changed, by area

**Database**
- `backend/src/db/migrations/009_official_catalogue_seo.sql` — new columns on
  `services` (`price_from`, `price_to`, `price_is_from`, `price_unit_label`,
  `short_description`, `service_type`, `is_addon`, `is_couples`,
  `session_count`, `seo_title`, `seo_description`, `seo_keywords`) and
  `service_categories` (`seo_title`, `seo_description`); new `memberships`
  table; inserts the two new categories (`waxing`, `signature-experiences`).
- `backend/src/db/seedData/officialCatalogue.js` — the 125 services, 3
  memberships, and shared member perks as reviewable data (separate from the
  import script's transaction/safety logic).
- `backend/src/scripts/importOfficialCatalogue.js` — the one-time,
  idempotent, transactional import script (see [Safety design](#safety-design)).

**Backend**
- `backend/src/controllers/serviceController.js` — extended payload schema,
  response mapping, and admin `listAdminServices` search/category/status
  filtering + pagination (`?search=&categoryId=&isActive=&page=&limit=`).
- `backend/src/controllers/membershipController.js`,
  `backend/src/routes/membershipRoutes.js`,
  `backend/src/routes/adminMembershipRoutes.js` — new membership CRUD.
- `backend/src/controllers/seoController.js`,
  `backend/src/routes/seoRoutes.js`,
  `backend/src/services/sitemapCacheService.js` — dynamic sitemap/robots.
- `backend/src/config/env.js` — added `env.PUBLIC_SITE_URL` (alias of the
  existing `FRONTEND_URL`, not a new required variable).
- `backend/src/seo/generateKeywordLibrary.js`,
  `backend/src/seo/keywordLibrary.json` — the 1,000+ phrase keyword library.

**Frontend**
- `frontend/src/pages/admin/ServicesManager.jsx` — search/category/status
  filters, pagination, and the full set of new fields (price range, "from"
  flag, unit label, add-on/couples/session, SEO fields).
- `frontend/src/pages/admin/MembershipsManager.jsx` — new membership admin
  page (create/edit/deactivate, benefits, image upload, SEO fields).
- `frontend/src/pages/public/Memberships.jsx`,
  `frontend/src/pages/public/MembershipDetail.jsx` — new public membership
  pages.
- `frontend/src/pages/public/Services.jsx` — added the
  `/services/category/:slug` route for clean, indexable category URLs
  (the existing `/services?category=` query-param filtering still works).
- `frontend/src/components/common/ServiceCard.jsx`,
  `frontend/src/pages/public/ServiceDetail.jsx` — price range/"from"/per-unit
  display via the new shared `formatServicePrice` util, plus
  couples/add-on/session badges.
- `frontend/src/components/common/Seo.jsx`,
  `frontend/src/components/common/Breadcrumbs.jsx`,
  `frontend/src/utils/structuredData.js`, `frontend/src/utils/siteUrl.js` —
  SEO infrastructure (see [How SEO metadata works](#how-seo-metadata-works)).
- `frontend/scripts/prerender.mjs` — postbuild static HTML snapshot generator.
- `frontend/vercel.json` — sitemap/robots proxy rewrites to
  `https://allay-web.onrender.com`.
- `frontend/src/data/serviceCategories.js` — added the Waxing and Signature
  Experiences category chips (existing 10 category chips untouched).
- `frontend/src/pages/public/Contact.jsx` — converted to a `mailto:` flow:
  client-validated name/email/message, encoded subject/body, recipient from
  `VITE_CONTACT_EMAIL` (falls back to `help@allayhouse.con`, kept exactly as
  spelled), clipboard fallback panel. No longer calls the backend
  `sendContactMessage` API (that endpoint/table are untouched and still
  available if you want to wire up an admin inbox later).
- `frontend/.env.example` — added `VITE_CONTACT_EMAIL`.

**Tests**
- `backend/src/tests/officialCatalogue.test.js` — validates the catalogue
  data itself (125 entries, no duplicate slugs, known category slugs,
  spot-checked prices, ranged/"from" pricing, braid category placement, 3
  memberships at the right prices) — no database required.
- `backend/src/tests/seoRoutes.test.js` — sitemap/robots XML validity and
  exclusion of admin/API routes.
- `backend/src/tests/membershipContracts.test.js` — admin create/update/
  deactivate a membership, verified against the public endpoint, with
  automatic cleanup.
- All 37 backend tests pass (20 pre-existing + 17 new), no regressions.
- Contact form manually verified in a real browser (Playwright): empty
  submit shows all three validation errors, invalid email shows a
  field-specific error, valid submit triggers the `mailto:` navigation and
  reveals the copy-fallback panel, form is not cleared, zero console errors.

## Category mapping

All 10 existing categories were reused; only 2 new categories were created
(no existing category could accurately hold these two service groups):

| Official catalogue section | Category used | New? |
|---|---|---|
| Scalp & head-spa (A) | Headspa | reused |
| Hair Lounge — wash/blowdry, wash/style, wig styling, cornrows (B) | Allay Salon | reused |
| Knotless Braids, Micro Braids, Wig Services, Hair Treatments (C, D, E, F) | Hair & Wigs | reused |
| Body Massage, Premium Massage (G, H) | Massage | reused |
| Body Glow & Hammam (I) | Sauna | reused |
| Soft Sculpt Body Treatments (J) | Body & Beauty | reused |
| Facial Rituals, Advanced Facials (K, L) | Facials | reused |
| Nail Enhancements, Nail Care (M, N) | Allay Nail Studio | reused |
| Lashes, Lash Maintenance, Brows (O, P, Q) | Allay Lash Studio | reused |
| Pilates Studio (S) | Allay Pilates | reused |
| Waxing (R) | **Waxing** | **created** |
| Signature Experiences (T) | **Signature Experiences** | **created** |

Monthly memberships are **not** a service category — they're a separate
`memberships` table/entity/admin section, per the requirement.

## Safety design

- The import runs inside a single database transaction. Any unexpected error
  rolls the whole thing back.
- Services/categories/memberships are **upserted by slug**, so running the
  script twice updates existing rows instead of duplicating them.
- Only the **13 originally-seeded services** (by their exact known slugs) are
  ever candidates for archive/delete — the script never touches a service it
  doesn't recognise, so re-running it later (after an admin adds unrelated
  services) is safe.
- For each of those 13, the script checks 7 tables with a `service_id`
  foreign key (`booking_services`, `booking_items`,
  `waitlist_selected_services`, `discount_code_services`,
  `booking_capacity_overrides`, `service_addons`, `service_packages`). If
  referenced anywhere, the service is archived (`is_active = false`), never
  deleted. If unreferenced, it's hard-deleted.
- The script prints a full summary (categories reused/created, services
  created/updated, legacy archived/deleted, memberships created/updated,
  skipped records, final active service count).

## Running the import

**Backup first.** This project has no separate staging database —
`DATABASE_URL` points at the live production Neon database. Before running
the import:

1. In the Neon console, either create a branch (instant, cheap, and the
   easiest rollback path) or take a `pg_dump` export of the `services`,
   `service_categories`, and `memberships` tables.
2. Run the migration if you haven't already: `npm run db:migrate -w backend`
   (safe — additive only, already applied as of this writing).
3. Run the import: `npm run catalogue:import -w backend`
4. Read the printed summary. Expected: 10 categories reused, 2 created, 125
   services created, 0 legacy left un-handled (each of the 13 original
   services either archived or deleted depending on booking history), 3
   memberships created, 0 skipped, 125 total active services.

**Rollback**: because rows are updated in place, there is no automated
"undo" script. If something looks wrong after a real run, restore from the
Neon branch/backup taken in step 1. Re-running the import itself is always
safe (idempotent) but won't undo a bad *edit* to the source data — it will
just re-apply whatever is currently in `officialCatalogue.js`.

## Managing memberships

Admin → **Memberships** (sidebar, crown icon). Create/edit a plan's name,
tagline, monthly price, description, benefits (one per line), display order,
featured flag, image, terms, and SEO title/description. Deactivating a plan
hides it from the public `/memberships` page without deleting it.

There is no self-serve subscription checkout (none exists in the project).
The public "Enquire to join" button on each plan links to
`/contact?membership=<name>`, which pre-fills the existing contact form.

## Uploading service/membership images

Same Cloudinary pipeline as before — open a service or membership in the
admin panel, use "Upload image from device." All 125 imported services and 3
memberships start with **no image** (matches the existing 13-service seed
convention); the `ImagePlaceholder` component already renders a stable
decorative placeholder for services with no image, so nothing breaks or
shifts layout until images are uploaded.

## How SEO metadata works

This is a client-rendered React/Vite SPA (confirmed during investigation —
no SSR, no SSG). Two layers work together:

1. **Runtime**: `react-helmet-async` + a shared `<Seo>` component
   (`frontend/src/components/common/Seo.jsx`) render per-route `<title>`,
   meta description, canonical link, `robots`, Open Graph, and Twitter Card
   tags, plus JSON-LD via `<Breadcrumbs>` and `utils/structuredData.js`. This
   keeps metadata correct during in-app (client-side) navigation and for any
   crawler that executes JS.
2. **Build time**: `frontend/scripts/prerender.mjs` runs automatically after
   `vite build` (via npm's `postbuild` hook) and writes static HTML snapshots
   — `dist/services/<slug>/index.html`, `dist/services/category/<slug>/index.html`,
   `dist/memberships/<slug>/index.html`, plus the static pages — each with
   the correct `<title>`/meta/canonical/OG/JSON-LD already baked in. Vercel
   serves a matching static file before falling back to the SPA rewrite
   (`frontend/vercel.json`), so a crawler hitting `/services/hydrafacial`
   directly gets real metadata without executing JS. This intentionally
   stops short of a full content prerender (no headless browser) to keep the
   Vercel build fast and dependency-free; visible page content still renders
   via the normal SPA bundle. If the API is unreachable at build time, the
   prerender step logs a warning and skips — it never fails the build.

Admin and account pages get `noindex, nofollow` via `<Seo noindex>` on
`AdminLayout`, `AuthLayout`, and `AdminLogin` — in addition to (not instead
of) the `robots.txt` disallow rules, since a login-gated page needs a real
`noindex` tag rather than relying on robots.txt alone.

## Where the keyword library is stored

`backend/src/seo/keywordLibrary.json` (generated by
`backend/src/seo/generateKeywordLibrary.js` — re-run it after editing the
generator). **1,120 unique phrases** across the 40 requested clusters
(branded, misspellings for query-intent awareness only, head-spa, massage,
memberships, bridal, corporate wellness, location/"near me", Nigeria-focused,
question-based long-tail, comparisons, etc.), each with `phrase`, `cluster`,
`intent`, `targetPage`, `priority`, `locationModifier`, `relatedService`, and
`notes`. It is a research/reference file — never rendered on any page, never
inserted into a meta-keywords tag. Use it to guide future page copy, H2/H3
headings, and internal link text.

## How sitemap generation works

The Express backend owns the database, so it generates the sitemap directly
(`backend/src/controllers/seoController.js`), cached in memory for 5 minutes
and explicitly invalidated whenever a service or membership is
created/updated/deleted:

- `/sitemap.xml` — sitemap index
- `/sitemap-pages.xml` — static public pages
- `/sitemap-services.xml` — active, bookable services (`<lastmod>` from
  `updated_at`)
- `/sitemap-categories.xml` — active categories, at their clean
  `/services/category/<slug>` canonical URL
- `/sitemap-memberships.xml` — active memberships
- `/sitemap-images.xml` — static hero/brand images plus any service/
  membership with a real (uploaded) image
- `/robots.txt` — disallows `/allay-admin`, `/auth/`, `/api/`; references
  `/sitemap.xml`

Because `sitemap.xml`/`robots.txt` must be served from the same origin as
the URLs they list (`www.allayhouse.com`), not the API host, `frontend/vercel.json`
proxies those exact paths to the backend at `https://allay-web.onrender.com`
(you filled this in). Note: this is a flat naming scheme
(`/sitemap-services.xml`, etc.), not a `/sitemaps/services.xml` nested
scheme — a later message described the nested form, but since working
sitemap code already existed and was already wired into `vercel.json` under
the flat naming, restructuring it would have meant re-editing the rewrite
you'd just set and duplicating already-working code for no functional
gain. If you specifically want the nested `/sitemaps/*.xml` path structure
for another reason, say so and I'll migrate both the backend routes and the
`vercel.json` rewrites together.

## Production environment variables

- `FRONTEND_URL` (backend, already existed) — set to the real production
  domain, e.g. `https://www.allayhouse.com`. This is also what
  `env.PUBLIC_SITE_URL` (used by the sitemap) resolves from.
- `VITE_SITE_URL` (frontend, already existed) — same real production domain.
  Used for canonical URLs, OG/Twitter image URLs, and JSON-LD.
- `VITE_API_URL` (frontend, already existed) — the backend's public URL.
  Also used by `scripts/prerender.mjs` at build time to fetch live
  categories/services/memberships.
- `VITE_GOOGLE_SITE_VERIFICATION` (frontend, **new**, optional) — Search
  Console's HTML-tag verification code (just the `content` value). Renders a
  `<meta name="google-site-verification">` tag site-wide when set; omitted
  entirely when blank.
- `VITE_CONTACT_EMAIL` (frontend, **new**) — recipient for the contact
  page's `mailto:` form. Falls back to `help@allayhouse.con` in code if
  unset (that exact spelling, per your instruction — not a typo to fix).
  Change the value here, not in `Contact.jsx`, when the real address is
  confirmed.
- Existing Cloudinary variables are unchanged — no new upload configuration
  needed.

## Submitting to Google Search Console

1. Verify the property (Domain or URL-prefix) — the quickest path is the
   HTML-tag method: set `VITE_GOOGLE_SITE_VERIFICATION` and redeploy, then
   click "Verify" in Search Console.
2. Search Console → Sitemaps → submit `https://www.allayhouse.com/sitemap.xml`.
3. To request indexing of a specific new/changed page: Search Console → URL
   Inspection → paste the URL → "Request indexing."

## Testing robots.txt and structured data

- `curl https://www.allayhouse.com/robots.txt` — should return the rules
  above and a `Sitemap:` line. Google's own robots.txt Tester (in Search
  Console, under Settings) is the most reliable check against how Googlebot
  actually parses it.
- Structured data: paste any public page URL into Google's [Rich Results
  Test](https://search.google.com/test/rich-results) or the schema.org
  validator. `utils/structuredData.js` only emits fields backed by real data
  already in this codebase — no invented address, phone, reviews, or ratings.

## Confirming Google can access image URLs

- Service/membership images are Cloudinary `secure_url`s — already public
  HTTPS, not signed/expiring.
- Static hero/brand images are served from `frontend/public/images/...` —
  public by default, not blocked in `robots.txt`.
- `curl -I <image-url>` should return `200`. Google Search Console's URL
  Inspection tool also renders the live page and reports blocked resources
  if any exist.

## Manual steps still required

1. Decide when to run `npm run catalogue:import -w backend` (see
   [Running the import](#running-the-import)) — not run yet, per your
   earlier choice. This is the only step that changes what's publicly
   bookable.
2. Set `VITE_GOOGLE_SITE_VERIFICATION` if/when you verify Search Console.
3. Set `VITE_CONTACT_EMAIL` on Vercel once the real contact address is
   confirmed (currently falls back to the literal `help@allayhouse.con` you
   specified).
4. Upload real images for the 125 services and 3 memberships via the admin
   panel once the import has run.
5. Confirm `FRONTEND_URL` (Render), `VITE_SITE_URL`/`VITE_API_URL`/
   `VITE_CONTACT_EMAIL` (Vercel) are set to the intended production values
   in each hosting provider's environment settings — I only verified these
   locally; Render/Vercel's own env vars are outside what I can see or set.
