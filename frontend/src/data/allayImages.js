import { imagePaths } from '../utils/imagePaths'

const serviceImagesBySlug = {
  'swedish-massage': imagePaths.services.swedishMassage,
  'deep-tissue-massage': imagePaths.services.deepTissueMassage,
  'aromatherapy-massage': imagePaths.services.aromatherapyMassage,
  'signature-glow-facial': imagePaths.services.glowFacial,
  'classic-facial': imagePaths.services.classicFacial,
  'hydrating-facial': imagePaths.services.hydratingFacial,
  'glow-facial': imagePaths.services.glowFacial,
  'sauna-session': imagePaths.services.saunaSession,
  'headspa-ritual': imagePaths.services.headspaTreatment,
  'headspa-treatment': imagePaths.services.headspaTreatment,
  'classic-manicure': imagePaths.services.classicManicure,
  'classic-pedicure': imagePaths.services.classicPedicure,
  'gel-polish': imagePaths.services.gelPolish,
  'nail-art': imagePaths.services.nailArt,
  'lash-extensions': imagePaths.services.lashExtensions,
  'lash-lift': imagePaths.services.lashLift,
  'lash-lift-tint': imagePaths.services.lashLift,
  'brow-shaping': imagePaths.services.browShaping,
  'brow-shaping-tint': imagePaths.services.browShaping,
  'hair-styling': imagePaths.services.hairStyling,
  braiding: imagePaths.services.hairBraiding,
  'hair-braiding': imagePaths.services.hairBraiding,
  'wig-installation': imagePaths.services.wigInstallation,
  'wig-styling': imagePaths.services.wigStyling,
  'premium-human-hair-wig-consultation': imagePaths.services.wigStyling,
  'private-pilates': imagePaths.services.privatePilates,
  'pilates-class': imagePaths.services.groupPilates,
  'group-pilates': imagePaths.services.groupPilates,
}

const categoryImagesBySlug = {
  all: imagePaths.placeholders.category,
  'allay-spa': imagePaths.categories.spa,
  spa: imagePaths.categories.spa,
  'allay-pilates': imagePaths.categories.pilates,
  pilates: imagePaths.categories.pilates,
  'allay-nail-studio': imagePaths.categories.nailStudio,
  nails: imagePaths.categories.nailStudio,
  'allay-lash-studio': imagePaths.categories.lashStudio,
  lashes: imagePaths.categories.lashStudio,
  'allay-salon': imagePaths.categories.salon,
  salon: imagePaths.categories.salon,
  facials: imagePaths.categories.facials,
  massage: imagePaths.categories.massage,
  sauna: imagePaths.categories.sauna,
  headspa: imagePaths.categories.headspa,
  'hair-and-wigs': imagePaths.categories.wigs,
  wigs: imagePaths.categories.wigs,
  braiding: imagePaths.categories.hairBraiding,
  'hair-braiding': imagePaths.categories.hairBraiding,
}

export function getServiceImage(slug) {
  return serviceImagesBySlug[slug] || imagePaths.placeholders.service
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
