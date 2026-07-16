import { Helmet } from 'react-helmet-async'
import { getSiteUrl } from '../../utils/siteUrl'

const DEFAULT_TITLE = 'Allay House | Beauty, Wellness & Movement'
const DEFAULT_DESCRIPTION = 'Allay House is a refined sanctuary for beauty, wellness, and movement in Lagos, Nigeria — head spa, massage, hammam, facials, nails, lashes, and reformer Pilates.'
const DEFAULT_IMAGE = '/images/allay/home/home-hero-main.jpg'

// Per-page head/meta management for the SPA. Renders into <head> on the
// client; the postbuild prerender step (scripts/prerender.mjs) additionally
// bakes the same tags into the static HTML shipped for each public route so
// crawlers and social-share unfurlers see correct metadata without running
// JS. Keep this component's output deterministic from props alone so both
// paths stay in sync.
export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image = DEFAULT_IMAGE,
  noindex = false,
  type = 'website',
  jsonLd,
}) {
  const resolvedTitle = title || DEFAULT_TITLE
  const canonicalPath = path ?? (typeof window !== 'undefined' ? window.location.pathname : '/')
  const canonical = getSiteUrl(canonicalPath)
  const imageUrl = /^https?:/i.test(image) ? image : getSiteUrl(image)
  const jsonLdList = (Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []).filter(Boolean)

  return <Helmet>
    <title>{resolvedTitle}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />

    <meta property="og:site_name" content="Allay House" />
    <meta property="og:title" content={resolvedTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content={type} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={imageUrl} />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={resolvedTitle} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={imageUrl} />

    {jsonLdList.map((entry, index) => (
      <script key={index} type="application/ld+json">{JSON.stringify(entry)}</script>
    ))}
  </Helmet>
}

export { DEFAULT_DESCRIPTION, DEFAULT_IMAGE, DEFAULT_TITLE }
