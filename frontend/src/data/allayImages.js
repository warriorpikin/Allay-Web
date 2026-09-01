import { imagePaths } from '../utils/imagePaths'

const categoryImagesBySlug = {
  all: imagePaths.placeholders.category,
  'allay-spa': imagePaths.categories.spa,
  spa: imagePaths.categories.spa,
  'allay-pilates': imagePaths.categories.pilates,
  pilates: imagePaths.categories.pilates,
  'allay-nail-studio': imagePaths.categories.nailStudio,
  nails: imagePaths.categories.nailStudio,
  'allay-salon': imagePaths.categories.salon,
  salon: imagePaths.categories.salon,
  facials: imagePaths.categories.facials,
  'advanced-skin-treatments': imagePaths.categories.advancedSkinTreatment,
  'advanced-skin-treatment': imagePaths.categories.advancedSkinTreatment,
  'advanced-skin': imagePaths.categories.advancedSkinTreatment,
  'body-and-beauty': imagePaths.categories.bodyBeauty,
  'body-beauty': imagePaths.categories.bodyBeauty,
  massage: imagePaths.categories.massage,
  sauna: imagePaths.categories.sauna,
  headspa: imagePaths.categories.headspa,
  'hair-and-wigs': imagePaths.categories.wigs,
  wigs: imagePaths.categories.wigs,
  braiding: imagePaths.categories.hairBraiding,
  'hair-braiding': imagePaths.categories.hairBraiding,
}

export function getCategoryImage(slug) {
  return categoryImagesBySlug[slug] || imagePaths.placeholders.category
}

export const heroImages = [
  imagePaths.home.heroMain,
  imagePaths.home.heroSecondary,
  imagePaths.home.heroDetail,
]

export const backgroundImages = {
  booking: imagePaths.booking.hero,
  waitlist: imagePaths.waitlist.hero,
  auth: imagePaths.auth.side,
  adminLogin: imagePaths.auth.adminLoginBg,
}
