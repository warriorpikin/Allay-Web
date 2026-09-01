import { Flower2, Leaf, MoveUpRight, Sparkles } from 'lucide-react'

// Maps a homepage/marketing division (or a legacy category slug) to the real
// service_categories.slug values it aggregates. "Allay Spa" has no row of its
// own in service_categories — it is a marketing umbrella over facials,
// massage, sauna, headspa, and body-beauty. Single source of truth, shared by
// the waitlist category filter and the homepage hero carousel.
export const categoryAliases = {
  'allay-spa': ['signature-experiences', 'facials', 'massage', 'sauna', 'headspa', 'body-beauty'],
  'allay-salon': ['hair-wigs'],
  'advanced-skin-treatments': ['facials'],
  'body-and-beauty': ['body-beauty'],
  'hair-and-wigs': ['hair-wigs'],
}

// The homepage "house" divisions, in display order. Each maps to one or more
// real category slugs via categoryAliases or directly to a matching
// service_categories.slug.
export const houseDivisions = [
  { name: 'Allay Spa', slug: 'allay-spa', tone: 'stone', icon: Leaf, fallbackNote: 'Head spa · massage · hammam · facials' },
  { name: 'Allay Pilates', slug: 'allay-pilates', tone: 'beige', icon: Sparkles, fallbackNote: 'Reformer sessions · memberships · wellness packages' },
  { name: 'Allay Nail Studio', slug: 'allay-nail-studio', tone: 'taupe', icon: Flower2, fallbackNote: 'Manicures · pedicures · enhancements · nail art' },
  { name: 'Allay Salon', slug: 'allay-salon', tone: 'sage', icon: MoveUpRight, fallbackNote: 'Styling · treatments · colour · hair and wigs' },
]

// Render these immediately while the live catalogue refreshes in the
// background. The hero no longer waits for an API round trip before showing
// the approved imagery and current service areas.
export const initialDivisionSlides = houseDivisions.map(({ fallbackNote, ...division }) => ({
  ...division,
  services: [],
  note: fallbackNote,
}))

export function normalizeToken(value = '') {
  return String(value).trim().toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function servicesForDivision(services, divisionSlug) {
  const accepted = new Set([divisionSlug, ...(categoryAliases[divisionSlug] || [])])
  return services.filter((service) => accepted.has(normalizeToken(service.categorySlug || service.category || '')))
}

// Builds the hero-carousel slide list from real, already-active/bookable
// services (as returned by GET /services). Divisions with no matching
// services are dropped rather than shown empty.
export function buildDivisionSlides(services = []) {
  return houseDivisions
    .map((division) => {
      const matched = servicesForDivision(services, division.slug)
      if (!matched.length) return null
      const categoryNames = [...new Set(matched.map((service) => service.category).filter(Boolean))]
      const note = categoryNames.length > 1
        ? categoryNames.slice(0, 4).join(' · ')
        : matched.slice(0, 4).map((service) => service.name).join(' · ')
      const { fallbackNote, ...displayDivision } = division
      return { ...displayDivision, services: matched, note: note || fallbackNote }
    })
    .filter(Boolean)
}
