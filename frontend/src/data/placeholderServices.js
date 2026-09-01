// A small, exact subset of the official August 2026 catalogue. It is used
// only if the live service request fails on the waitlist page, so visitors
// are never offered the retired sample services or prices.
export const placeholderServices = [
  { id: 'official-fallback-01', name: 'Allay House Signature Ritual', slug: 'allay-house-signature-ritual', category: 'Signature Experiences', categorySlug: 'signature-experiences', description: 'Head Spa + Massage + Hammam + Pedicure + Healthy Refreshment', durationMinutes: null, price: 195000 },
  { id: 'official-fallback-02', name: 'Express Head Spa', slug: 'express-head-spa', category: 'Headspa', categorySlug: 'headspa', description: 'Japanese Head Spa at Allay House.', durationMinutes: 30, price: 48000 },
  { id: 'official-fallback-03', name: 'Swedish Massage (60 mins)', slug: 'swedish-massage-60-mins', category: 'Massage', categorySlug: 'massage', description: 'Relaxation massage at Allay House.', durationMinutes: 60, price: 68000 },
  { id: 'official-fallback-04', name: 'Traditional Hammam', slug: 'traditional-hammam', category: 'Body & Beauty', categorySlug: 'body-beauty', description: 'Traditional hammam ritual at Allay House.', durationMinutes: null, price: 75000 },
  { id: 'official-fallback-05', name: 'Traditional Sauna', slug: 'traditional-sauna', category: 'Sauna', categorySlug: 'sauna', description: 'Traditional sauna at Allay House.', durationMinutes: null, price: 30000 },
  { id: 'official-fallback-06', name: 'Lactic Peel', slug: 'lactic-peel', category: 'Facials', categorySlug: 'facials', description: 'Chemical peel at Allay House.', durationMinutes: null, price: 130000 },
  { id: 'official-fallback-07', name: 'Wash & Blow Dry', slug: 'wash-blow-dry', category: 'Allay Salon', categorySlug: 'allay-salon', description: 'Wash and styling at Allay House.', durationMinutes: null, price: 15000 },
  { id: 'official-fallback-08', name: 'Frontal Wig Install', slug: 'frontal-wig-install', category: 'Hair & Wigs', categorySlug: 'hair-wigs', description: 'Wig installation at Allay House.', durationMinutes: null, price: 60000 },
  { id: 'official-fallback-09', name: 'Group Class (Minimum 4 People)', slug: 'group-class-minimum-4-people', category: 'Allay Pilates', categorySlug: 'allay-pilates', description: 'Group reformer Pilates class.', durationMinutes: null, price: 25000 },
  { id: 'official-fallback-10', name: 'Basic Manicure (Nail Prep)', slug: 'basic-manicure-nail-prep', category: 'Allay Nail Studio', categorySlug: 'allay-nail-studio', description: 'Basic manicure and nail preparation.', durationMinutes: null, price: 14500 },
]

export default placeholderServices
