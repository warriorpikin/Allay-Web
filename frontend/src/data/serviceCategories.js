export const serviceCategories = [
  { id: 'spa', name: 'Allay Spa', slug: 'allay-spa', categorySlugs: ['signature-experiences', 'headspa', 'massage', 'body-beauty', 'sauna', 'facials'], description: 'Every spa, skin, massage, hammam, sauna, and head-spa ritual.' },
  { id: 'signature', name: 'Signature Experiences', slug: 'signature-experiences', description: 'Complete rituals for individuals, couples, friends, brides, and teams.' },
  { id: 'headspa', name: 'Japanese Head Spa', slug: 'headspa', description: 'Scalp rituals, analysis, hydration, LED therapy, and massage add-ons.' },
  { id: 'massage', name: 'Massage', slug: 'massage', description: 'Relaxation, therapeutic, couples, and premium massage rituals.' },
  { id: 'body-beauty', name: 'Hammam & Body', slug: 'body-beauty', description: 'Hammam rituals and focused body-sculpting programmes.' },
  { id: 'sauna', name: 'Sauna & Steam', slug: 'sauna', description: 'Traditional sauna, steam, cold shower, and massage rituals.' },
  { id: 'facials', name: 'Facials & Skin', slug: 'facials', description: 'Specialist facials, chemical peels, and microneedling.' },
  { id: 'pilates', name: 'Allay Pilates', slug: 'allay-pilates', description: 'Group, private, duet, membership, and wellness sessions.' },
  { id: 'salon', name: 'Allay Salon', slug: 'allay-salon', description: 'Wash, styling, treatments, and colour services.' },
  { id: 'hair-wigs', name: 'Hair & Wigs', slug: 'hair-wigs', description: 'Wigs, sew-ins, braids, natural hair, locs, and take-outs.' },
  { id: 'nails', name: 'Allay Nail Studio', slug: 'allay-nail-studio', description: 'Manicures, pedicures, extensions, repairs, and nail art.' },
]

export function categoryMatchesService(category, service) {
  if (!category) return true
  const accepted = category.categorySlugs || [category.slug]
  return accepted.includes(service.categorySlug)
}

export default serviceCategories
