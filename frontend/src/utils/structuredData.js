import { siteSocialLinks } from '../data/socialLinks'
import { formatServicePrice } from './formatServicePrice'
import { getSiteUrl } from './siteUrl'

const BRAND_NAME = 'Allay House'
const LOGO_PATH = '/images/brand/allay-logo-brown.svg'

// Only real details already present elsewhere in this codebase (Contact
// page copy, siteSocialLinks.js) are used here — no invented address,
// reviews, ratings or awards.
export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND_NAME,
    url: getSiteUrl('/'),
    logo: getSiteUrl(LOGO_PATH),
    sameAs: [siteSocialLinks.instagram.url, siteSocialLinks.tiktok.url, siteSocialLinks.googleMaps.url],
  }
}

export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND_NAME,
    url: getSiteUrl('/'),
  }
}

// Matches the hours already shown publicly on the Contact page
// ("Lagos, Nigeria / Monday-Saturday / 9am-7pm") rather than inventing new
// figures.
export function buildLocalBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    name: BRAND_NAME,
    url: getSiteUrl('/'),
    logo: getSiteUrl(LOGO_PATH),
    image: getSiteUrl('/images/allay/home/home-hero-main.jpg'),
    sameAs: [siteSocialLinks.instagram.url, siteSocialLinks.tiktok.url, siteSocialLinks.googleMaps.url],
    address: { '@type': 'PostalAddress', addressLocality: 'Lagos', addressCountry: 'NG' },
    hasMap: siteSocialLinks.googleMaps.url,
    contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', email: 'hello@allayhouse.com' },
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '09:00', closes: '19:00' },
    ],
  }
}

export function buildBreadcrumbJsonLd(items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: getSiteUrl(item.path),
    })),
  }
}

export function buildServiceJsonLd(service) {
  if (!service) return null
  const image = service.imageUrl || service.image
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: service.name,
    name: service.name,
    description: service.shortDescription || service.description || undefined,
    provider: { '@type': 'HealthAndBeautyBusiness', name: BRAND_NAME, url: getSiteUrl('/') },
    areaServed: { '@type': 'City', name: 'Lagos' },
    url: getSiteUrl(`/services/${service.slug}`),
    ...(image ? { image: { '@type': 'ImageObject', url: image, name: `${service.name} at Allay House` } } : {}),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'NGN',
      price: service.price ?? service.priceFrom ?? undefined,
      description: formatServicePrice(service),
      availability: service.bookable === false ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      url: getSiteUrl(`/services/${service.slug}`),
    },
  }
}

export function buildMembershipJsonLd(membership) {
  if (!membership) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Wellness membership',
    name: membership.name,
    description: membership.description || membership.tagline || undefined,
    provider: { '@type': 'HealthAndBeautyBusiness', name: BRAND_NAME, url: getSiteUrl('/') },
    url: getSiteUrl(`/memberships/${membership.slug}`),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'NGN',
      price: membership.monthlyPrice,
      priceSpecification: { '@type': 'UnitPriceSpecification', price: membership.monthlyPrice, priceCurrency: 'NGN', unitText: 'MONTH' },
      url: getSiteUrl(`/memberships/${membership.slug}`),
    },
  }
}
