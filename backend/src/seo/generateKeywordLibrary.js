// Builds backend/src/seo/keywordLibrary.json — a structured SEO keyword
// research library, NOT site content. It is never rendered on any public
// page, never inserted into a meta-keywords tag, and never used to stuff
// copy. Its purpose is to guide which real page titles, descriptions,
// headings and internal links get written, and to record which page each
// search intent should point to.
//
// Run with: node src/seo/generateKeywordLibrary.js  (from backend/)
//
// Combinatorial entries (service/category name x a small set of real search
// modifiers like "price", "near me", "booking") are generated from the same
// catalogue data used everywhere else, so every phrase reflects a real
// Allay House service — nothing invented, nothing nonsensical repeated with
// only punctuation changed.
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { memberships as officialMemberships, newCategories, officialServices } from '../db/seedData/officialCatalogue.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const CITY = 'Lagos'
const COUNTRY = 'Nigeria'

const existingCategories = [
  { name: 'Facials', slug: 'facials' },
  { name: 'Massage', slug: 'massage' },
  { name: 'Sauna', slug: 'sauna' },
  { name: 'Headspa', slug: 'headspa' },
  { name: 'Allay Pilates', slug: 'allay-pilates' },
  { name: 'Allay Lash Studio', slug: 'allay-lash-studio' },
  { name: 'Allay Salon', slug: 'allay-salon' },
  { name: 'Hair & Wigs', slug: 'hair-wigs' },
  { name: 'Allay Nail Studio', slug: 'allay-nail-studio' },
  { name: 'Body & Beauty', slug: 'body-beauty' },
]
const allCategories = [...existingCategories, ...newCategories.map((c) => ({ name: c.name, slug: c.slug }))]

const entries = []
const seenPhrases = new Set()

function add({ phrase, cluster, intent, targetPage, priority = 'secondary', locationModifier = null, relatedService = null, notes = null }) {
  const clean = phrase.trim().replace(/\s+/g, ' ')
  const key = clean.toLowerCase()
  if (seenPhrases.has(key)) return
  seenPhrases.add(key)
  entries.push({ phrase: clean, cluster, intent, targetPage, priority, locationModifier, relatedService, notes })
}

function servicePage(slug) {
  return `/services/${slug}`
}
function categoryPage(slug) {
  return `/services/category/${slug}`
}

// ---------------------------------------------------------------------
// 1. Allay House branded searches
// ---------------------------------------------------------------------
;[
  'Allay House', 'Allay House Lagos', 'Allay House spa', 'Allay House wellness',
  'Allay House booking', 'Allay House prices', 'Allay House price list', 'Allay House services',
  'Allay House contact', 'Allay House phone number', 'Allay House location', 'Allay House address',
  'Allay House opening hours', 'Allay House reviews', 'Allay House Instagram', 'Allay House TikTok',
  'Allay House membership', 'Allay House head spa', 'Allay House Pilates', 'Allay House salon',
  'Allay House nail studio', 'Allay House lash studio', 'Allay House massage', 'Allay House hammam',
  'book Allay House', 'Allay House waitlist', 'Allay House launch', 'Allay House about us',
  'what is Allay House', 'Allay House Lagos Nigeria', 'Allay House sanctuary',
].forEach((phrase) => add({ phrase, cluster: 'Allay House branded searches', intent: 'navigational', targetPage: '/', priority: 'primary' }))

// ---------------------------------------------------------------------
// 2. Brand spelling variations (query-capture only — never used in site
// content/metadata; kept here purely so redirects/copy can anticipate how
// people mistype the brand name when searching).
// ---------------------------------------------------------------------
;[
  'Alley House Lagos', 'Alley House spa', 'Ali House spa Lagos', 'Ali House Lagos',
  'Allay Haus Lagos', 'Allayhouse', 'Allay House Nigeria spa', 'Alley House Nigeria',
  'Allay Hus spa', 'Alle House Lagos', 'Allay Housе spa', 'Alay House Lagos',
  'Allay House spa Nigeria', 'Alley House wellness', 'Ali House wellness Lagos',
].forEach((phrase) => add({
  phrase, cluster: 'Brand spelling variations', intent: 'navigational', targetPage: '/', priority: 'secondary',
  notes: 'Common misspelling of "Allay House" captured for search-intent awareness only — never write this spelling into site content, metadata or structured data.',
}))

// ---------------------------------------------------------------------
// 3. Beauty and wellness searches (general)
// ---------------------------------------------------------------------
;[
  'beauty and wellness spa Lagos', 'wellness sanctuary Lagos', 'luxury beauty salon Lagos',
  'best beauty spa in Lagos', 'wellness rituals Lagos', 'self-care spa day Lagos',
  'holistic wellness Lagos', 'beauty and wellness bookings Lagos', 'day spa Lagos Nigeria',
  'wellness center Lagos', 'calm spa experience Lagos', 'beauty rituals Lagos',
  'wellness retreat Lagos', 'quiet spa Lagos', 'premium beauty studio Lagos',
  'all in one beauty and wellness Lagos', 'spa and salon Lagos', 'relaxing spa day Lagos',
  'wellness lifestyle Lagos', 'beauty sanctuary Lagos', 'restorative spa Lagos',
  'wellness experience for women Lagos', 'unwind spa Lagos', 'me time spa Lagos',
  'beauty and wellness membership Lagos', 'wellness studio Victoria Island',
  'wellness studio Lekki', 'calm beauty rituals Lagos', 'sanctuary spa Lagos', 'boutique spa Lagos',
].forEach((phrase) => add({ phrase, cluster: 'Beauty and wellness searches', intent: 'informational', targetPage: '/', priority: 'secondary', locationModifier: CITY }))

// ---------------------------------------------------------------------
// 4. Luxury spa searches
// ---------------------------------------------------------------------
;[
  'luxury spa Lagos', 'luxury spa Nigeria', 'premium spa Lagos', 'high end spa Lagos',
  'exclusive spa Lagos', 'luxury wellness spa Lagos', 'best luxury spa Lagos',
  'private spa Lagos', 'luxury day spa Lagos', 'members only spa Lagos',
  'luxury spa experience Lagos', 'top rated spa Lagos', 'luxury spa membership Lagos',
  'luxury spa and wellness Lagos', 'five star spa Lagos', 'luxury spa Victoria Island',
  'luxury spa Ikoyi', 'luxury spa Lekki', 'luxury couples spa Lagos', 'refined spa Lagos',
  'luxury bridal spa Lagos', 'luxury spa for corporate wellness Lagos', 'luxury spa packages Lagos',
  'quiet luxury spa Lagos', 'understated luxury spa Lagos',
].forEach((phrase) => add({ phrase, cluster: 'Luxury spa searches', intent: 'commercial', targetPage: '/', priority: 'primary', locationModifier: CITY }))

// ---------------------------------------------------------------------
// 5-11: category-anchored clusters generated from the real catalogue
// ---------------------------------------------------------------------
const modifierSets = {
  core: ['price', 'cost', 'booking', 'near me', `in ${CITY}`, 'appointment'],
  short: ['price', 'near me', 'booking'],
}

function addCategoryCluster({ categorySlug, clusterName, hand = [], targetOverride = null, priority = 'secondary', modifiers = 'short' }) {
  const category = allCategories.find((c) => c.slug === categorySlug)
  const target = targetOverride || categoryPage(categorySlug)
  hand.forEach((phrase) => add({ phrase, cluster: clusterName, intent: 'informational', targetPage: target, priority, relatedService: categorySlug }))
  const servicesInCategory = officialServices.filter((s) => s.categorySlug === categorySlug)
  for (const service of servicesInCategory) {
    for (const modifier of modifierSets[modifiers]) {
      const intent = modifier === 'booking' ? 'transactional' : modifier === 'price' || modifier === 'cost' ? 'commercial' : 'transactional'
      add({
        phrase: `${service.name} ${modifier}`,
        cluster: clusterName,
        intent,
        targetPage: servicePage(service.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')),
        priority: 'secondary',
        locationModifier: modifier.includes(CITY) ? CITY : null,
        relatedService: service.name,
      })
    }
  }
}

addCategoryCluster({
  categorySlug: 'headspa', clusterName: 'Head-spa searches', priority: 'primary', modifiers: 'core',
  hand: [
    'head spa Lagos', 'head spa treatment Lagos', 'what is a head spa', 'scalp spa Lagos',
    'head spa near me', 'best head spa Lagos', 'head spa benefits', 'head spa for hair growth Lagos',
    'head spa steam treatment Lagos', 'head spa massage Lagos', 'head spa couples Lagos',
    'head spa membership Lagos', 'relaxing head spa Lagos',
  ],
})

;[
  'Japanese head spa Lagos', 'Japanese head spa Nigeria', 'what is a Japanese head spa',
  'Japanese head spa near me', 'Japanese head spa benefits', 'Japanese head spa treatment Lagos',
  'Japanese scalp massage Lagos', 'signature Japanese head spa', 'best Japanese head spa Lagos',
  'Japanese head spa price Lagos',
].forEach((phrase) => add({ phrase, cluster: 'Japanese head-spa searches', intent: 'commercial', targetPage: servicePage('signature-japanese-head-spa'), priority: 'primary', locationModifier: CITY, relatedService: 'Signature Japanese Head Spa' }))

;[
  'scalp treatment Lagos', 'scalp treatment for hair growth Lagos', 'scalp detox Lagos',
  'scalp analysis Lagos', 'dry scalp treatment Lagos', 'scalp care Lagos',
  'LED scalp therapy Lagos', 'scalp massage Lagos', 'best scalp treatment Lagos',
  'scalp treatment near me',
].forEach((phrase) => add({ phrase, cluster: 'Scalp-treatment searches', intent: 'informational', targetPage: categoryPage('headspa'), priority: 'secondary', locationModifier: CITY }))

addCategoryCluster({
  categorySlug: 'hair-wigs', clusterName: 'Natural-hair searches', priority: 'secondary',
  hand: [
    'natural hair treatment Lagos', 'natural hair care Lagos', 'deep conditioning treatment Lagos',
    'protein treatment for natural hair Lagos', 'bond repair treatment Lagos', 'hair treatment salon Lagos',
    'natural hair salon Lagos', 'moisture treatment for natural hair Lagos',
  ],
})

addCategoryCluster({
  categorySlug: 'allay-salon', clusterName: 'Hair-styling searches', priority: 'secondary',
  hand: [
    'hair salon Lagos', 'wash and blowdry Lagos', 'hair styling salon Lagos', 'hair salon near me Lagos',
    'wash and style Lagos', 'silk press Lagos', 'hair salon Victoria Island', 'hair salon Lekki',
  ],
})

;[
  'braiding salon Lagos', 'knotless braids Lagos', 'micro braids Lagos', 'braiding near me Lagos',
  'knotless braids price Lagos', 'micro braids price Lagos', 'best braiding salon Lagos',
  'protective braiding styles Lagos', 'shoulder length knotless braids Lagos', 'long knotless braids Lagos',
  'cornrows Lagos', 'cornrow styling Lagos', 'braiding salon Victoria Island', 'braiding salon Lekki',
  'how much are knotless braids in Lagos',
].forEach((phrase) => add({ phrase, cluster: 'Braiding searches', intent: 'commercial', targetPage: categoryPage('allay-salon'), priority: 'primary', locationModifier: CITY }))

;[
  'wig install Lagos', 'seamless wig install Lagos', 'wig installation near me Lagos',
  'wig styling Lagos', 'wig refresh Lagos', 'custom wig coloring Lagos', 'wig consultation Lagos',
  'human hair wig Lagos', 'wig salon Lagos', 'best wig salon Lagos', 'wig install price Lagos',
  'natural looking wig install Lagos',
].forEach((phrase) => add({ phrase, cluster: 'Wig-service searches', intent: 'commercial', targetPage: categoryPage('hair-wigs'), priority: 'secondary', locationModifier: CITY }))

// ---------------------------------------------------------------------
// 12-13: massage & couples massage
// ---------------------------------------------------------------------
addCategoryCluster({
  categorySlug: 'massage', clusterName: 'Massage searches', priority: 'primary', modifiers: 'core',
  hand: [
    'massage spa Lagos', 'best massage in Lagos', 'deep tissue massage Lagos', 'Swedish massage Lagos',
    'hot stone massage Lagos', 'aromatherapy massage Lagos', 'massage therapist Lagos',
    'massage near me Lagos', 'full body massage Lagos', 'massage for back pain Lagos',
    'massage spa Victoria Island', 'massage spa Lekki', 'stress relief massage Lagos',
  ],
})

;[
  'couples massage Lagos', 'couples massage near me', 'couples spa day Lagos', 'massage for two Lagos',
  'romantic massage Lagos', 'hot stone massage for two Lagos', 'four hands massage Lagos',
  'best couples massage Lagos', 'couples massage price Lagos', 'anniversary spa massage Lagos',
].forEach((phrase) => add({ phrase, cluster: 'Couples-massage searches', intent: 'commercial', targetPage: servicePage('couples-massage'), priority: 'primary', locationModifier: CITY, relatedService: 'Couples Massage' }))

// ---------------------------------------------------------------------
// 14-15: hammam
// ---------------------------------------------------------------------
addCategoryCluster({
  categorySlug: 'sauna', clusterName: 'Hammam searches', priority: 'primary',
  hand: [
    'hammam Lagos', 'traditional hammam Lagos', 'hammam spa near me', 'body scrub and hammam Lagos',
    'hammam and massage package Lagos', 'best hammam in Lagos', 'hammam experience Lagos',
    'brightening hammam Lagos',
  ],
})

;[
  'Moroccan hammam Lagos', 'deluxe Moroccan hammam Lagos', 'Moroccan hammam near me',
  'Moroccan black soap treatment Lagos', 'authentic Moroccan hammam Lagos', 'Moroccan spa ritual Lagos',
  'Moroccan hammam price Lagos', 'what is a Moroccan hammam',
].forEach((phrase) => add({ phrase, cluster: 'Moroccan-hammam searches', intent: 'commercial', targetPage: servicePage('deluxe-moroccan-hammam'), priority: 'secondary', locationModifier: CITY, relatedService: 'Deluxe Moroccan Hammam' }))

;[
  'body scrub Lagos', 'coffee body scrub Lagos', 'body polish Lagos', 'exfoliating body treatment Lagos',
  'glow body treatment Lagos', 'detox body wrap Lagos', 'brightening body treatment Lagos',
  'body scrub near me Lagos', 'best body scrub Lagos', 'body scrub spa Lagos',
].forEach((phrase) => add({ phrase, cluster: 'Body-scrub searches', intent: 'commercial', targetPage: categoryPage('sauna'), priority: 'secondary', locationModifier: CITY }))

// ---------------------------------------------------------------------
// 17-19: body contouring, lymphatic drainage, wood therapy
// ---------------------------------------------------------------------
addCategoryCluster({
  categorySlug: 'body-beauty', clusterName: 'Body-contouring searches', priority: 'primary',
  hand: [
    'body contouring Lagos', 'non invasive body contouring Lagos', 'body sculpting Lagos',
    'waist snatching treatment Lagos', 'body contouring near me Lagos', 'EMSZero Lagos',
    'muscle stimulation body treatment Lagos', 'body contouring package Lagos', 'sculpt and tone Lagos',
    'body contouring price Lagos',
  ],
})

;[
  'lymphatic drainage massage Lagos', 'lymphatic drainage near me', 'full body lymphatic drainage Lagos',
  'lymphatic drainage benefits', 'lymphatic drainage and steam therapy Lagos', 'lymphatic drainage price Lagos',
  'lymphatic drainage massage spa Lagos', 'what is lymphatic drainage massage',
].forEach((phrase) => add({ phrase, cluster: 'Lymphatic-drainage searches', intent: 'informational', targetPage: servicePage('full-body-lymphatic-drainage'), priority: 'secondary', locationModifier: CITY, relatedService: 'Full Body Lymphatic Drainage' }))

;[
  'wood therapy Lagos', 'wood therapy near me', 'wood therapy body sculpting Lagos',
  'wood therapy and vacuum therapy Lagos', 'what is wood therapy', 'wood therapy price Lagos',
  'full body wood therapy Lagos', 'wood therapy benefits',
].forEach((phrase) => add({ phrase, cluster: 'Wood-therapy searches', intent: 'informational', targetPage: servicePage('full-body-wood-therapy'), priority: 'secondary', locationModifier: CITY, relatedService: 'Full Body Wood Therapy' }))

// ---------------------------------------------------------------------
// 20-21: facials & hydrafacial
// ---------------------------------------------------------------------
addCategoryCluster({
  categorySlug: 'facials', clusterName: 'Facial searches', priority: 'primary', modifiers: 'core',
  hand: [
    'facial spa Lagos', 'best facial in Lagos', 'hydrating facial Lagos', 'deep cleansing facial Lagos',
    'facial near me Lagos', 'facial for glowing skin Lagos', 'oxygen facial Lagos',
    'hydra jelly facial Lagos', 'facial treatment Lagos', 'anti aging facial Lagos', 'acne facial Lagos',
    'facial spa Victoria Island',
  ],
})

;[
  'Hydrafacial Lagos', 'Hydrafacial near me', 'Hydrafacial price Lagos', 'what is a Hydrafacial',
  'Hydrafacial benefits', 'best Hydrafacial in Lagos', 'Hydrafacial treatment Lagos', 'Hydrafacial vs facial',
].forEach((phrase) => add({ phrase, cluster: 'Hydrafacial searches', intent: 'commercial', targetPage: servicePage('hydrafacial'), priority: 'primary', locationModifier: CITY, relatedService: 'Hydrafacial' }))

// ---------------------------------------------------------------------
// 22-25: nails
// ---------------------------------------------------------------------
addCategoryCluster({
  categorySlug: 'allay-nail-studio', clusterName: 'Nail-studio searches', priority: 'primary', modifiers: 'core',
  hand: [
    'nail studio Lagos', 'best nail studio Lagos', 'nail salon near me Lagos', 'nail salon Victoria Island',
    'nail salon Lekki', 'manicure and pedicure Lagos', 'gel polish Lagos', 'nail art Lagos',
  ],
})

;[
  'acrylic nails Lagos', 'acrylic full set Lagos', 'acrylic nails near me', 'acrylic nails price Lagos',
  'best acrylic nails Lagos', 'French acrylic nails Lagos', 'long acrylic nails Lagos',
  'short acrylic nails Lagos', 'acrylic nail art Lagos',
].forEach((phrase) => add({ phrase, cluster: 'Acrylic-nail searches', intent: 'commercial', targetPage: categoryPage('allay-nail-studio'), priority: 'secondary', locationModifier: CITY }))

;[
  'BIAB nails Lagos', 'BIAB overlay Lagos', 'BIAB extensions Lagos', 'builder gel nails Lagos',
  'what is BIAB nails', 'BIAB infill Lagos', 'BIAB vs acrylic nails', 'BIAB nails near me',
].forEach((phrase) => add({ phrase, cluster: 'BIAB nail searches', intent: 'informational', targetPage: categoryPage('allay-nail-studio'), priority: 'secondary', locationModifier: CITY }))

;[
  'pedicure Lagos', 'best pedicure in Lagos', 'jelly pedicure Lagos', 'pedicure near me Lagos',
  'pedicure and manicure Lagos', 'luxury pedicure Lagos', 'pedicure spa Lagos', 'pedicure price Lagos',
  'gel pedicure Lagos', 'spa pedicure Lagos',
].forEach((phrase) => add({ phrase, cluster: 'Pedicure searches', intent: 'commercial', targetPage: servicePage('pedicure'), priority: 'primary', locationModifier: CITY, relatedService: 'Pedicure' }))

// ---------------------------------------------------------------------
// 26-27: lashes & brows
// ---------------------------------------------------------------------
addCategoryCluster({
  categorySlug: 'allay-lash-studio', clusterName: 'Lash searches', priority: 'primary',
  hand: [
    'lash studio Lagos', 'lash extensions Lagos', 'classic lashes Lagos', 'volume lashes Lagos',
    'hybrid lashes Lagos', 'best lash studio Lagos', 'lash extensions near me Lagos', 'mega volume lashes Lagos',
    'wispy lashes Lagos', 'lash refill Lagos',
  ],
})

;[
  'brow shaping Lagos', 'brow lamination Lagos', 'brow tint Lagos', 'eyebrow shaping near me Lagos',
  'brow lamination and tint Lagos', 'best brow studio Lagos', 'brow lamination price Lagos',
  'natural brow shaping Lagos',
].forEach((phrase) => add({ phrase, cluster: 'Brow searches', intent: 'commercial', targetPage: categoryPage('allay-lash-studio'), priority: 'secondary', locationModifier: CITY }))

// ---------------------------------------------------------------------
// 28: waxing
// ---------------------------------------------------------------------
addCategoryCluster({
  categorySlug: 'waxing', clusterName: 'Waxing searches', priority: 'primary',
  hand: [
    'waxing salon Lagos', 'Brazilian wax Lagos', 'full body wax Lagos', 'waxing near me Lagos',
    'best waxing salon Lagos', 'underarm wax Lagos', 'leg wax Lagos', 'eyebrow wax Lagos',
    'waxing spa Lagos', 'Brazilian wax price Lagos',
  ],
})

// ---------------------------------------------------------------------
// 29-30: pilates
// ---------------------------------------------------------------------
addCategoryCluster({
  categorySlug: 'allay-pilates', clusterName: 'Pilates searches', priority: 'primary',
  hand: [
    'Pilates studio Lagos', 'Pilates classes Lagos', 'Pilates near me Lagos', 'group Pilates class Lagos',
    'private Pilates session Lagos', 'best Pilates studio Lagos', 'Pilates for beginners Lagos',
    'Pilates studio Victoria Island', 'Pilates studio Lekki',
  ],
})

;[
  'reformer Pilates Lagos', 'reformer Pilates classes Lagos', 'reformer Pilates near me',
  'reformer Pilates monthly package Lagos', 'reformer Pilates price Lagos', 'what is reformer Pilates',
  'reformer Pilates vs mat Pilates', 'unlimited reformer Pilates Lagos', 'reformer Pilates for beginners Lagos',
  'best reformer Pilates studio Lagos',
].forEach((phrase) => add({ phrase, cluster: 'Reformer-Pilates searches', intent: 'commercial', targetPage: categoryPage('allay-pilates'), priority: 'primary', locationModifier: CITY }))

// ---------------------------------------------------------------------
// 31-34: memberships, bridal, corporate, packages
// ---------------------------------------------------------------------
;[
  'wellness membership Lagos', 'spa membership Lagos', 'monthly spa membership Lagos',
  'beauty membership Lagos', 'best wellness membership Lagos', 'spa subscription Lagos',
  'wellness membership plans Lagos', 'monthly wellness plan Lagos', 'join a spa membership Lagos',
  'unlimited Pilates membership Lagos', 'wellness membership benefits', 'spa membership price Lagos',
  'membership with priority booking Lagos', 'the Reset membership Allay House', 'the Ritual membership Allay House',
  'the Sanctuary membership Allay House',
].forEach((phrase) => add({ phrase, cluster: 'Wellness-membership searches', intent: 'commercial', targetPage: '/memberships', priority: 'primary', locationModifier: CITY }))

;[
  'bridal spa package Lagos', 'bridal glow experience Lagos', 'bridal beauty prep Lagos',
  'wedding day spa package Lagos', 'bridal wellness package Lagos', 'bride to be spa day Lagos',
  'pre wedding spa Lagos', 'bridal party spa Lagos', 'bridal glam prep spa Lagos', 'bridal skin prep Lagos',
  'wedding morning spa package Lagos', 'bridal spa near me',
].forEach((phrase) => add({ phrase, cluster: 'Bridal wellness searches', intent: 'commercial', targetPage: servicePage('bridal-glow-experience'), priority: 'primary', locationModifier: CITY, relatedService: 'Bridal Glow Experience' }))

;[
  'corporate wellness Lagos', 'corporate wellness retreat Lagos', 'office wellness day Lagos',
  'team wellness experience Lagos', 'corporate wellness package Lagos', 'workplace wellness Lagos',
  'corporate spa day Lagos', 'corporate wellness Pilates Lagos', 'corporate wellness talk Lagos',
  'team building wellness Lagos', 'corporate wellness per person Lagos',
].forEach((phrase) => add({ phrase, cluster: 'Corporate wellness searches', intent: 'commercial', targetPage: servicePage('corporate-wellness-retreat'), priority: 'primary', locationModifier: CITY, relatedService: 'Corporate Wellness Retreat' }))

;[
  'spa day package Lagos', 'full day spa package Lagos', 'signature spa experience Lagos',
  'spa package deals Lagos', 'full day wellness reset Lagos', 'spa package for two Lagos',
  'best spa packages Lagos', 'spa day near me Lagos', 'all inclusive spa day Lagos',
  'spa and Pilates package Lagos',
].forEach((phrase) => add({ phrase, cluster: 'Spa package searches', intent: 'commercial', targetPage: servicePage('allay-house-full-day-reset'), priority: 'primary', locationModifier: CITY, relatedService: 'Allay House Full Day Reset' }))

// ---------------------------------------------------------------------
// 35-36: price-intent & booking-intent (category-wide)
// ---------------------------------------------------------------------
for (const category of allCategories) {
  add({ phrase: `${category.name} price list Lagos`, cluster: 'Price-intent searches', intent: 'commercial', targetPage: categoryPage(category.slug), priority: 'secondary', locationModifier: CITY, relatedService: category.slug })
  add({ phrase: `how much does ${category.name.toLowerCase()} cost in Lagos`, cluster: 'Price-intent searches', intent: 'commercial', targetPage: categoryPage(category.slug), priority: 'secondary', locationModifier: CITY, relatedService: category.slug })
  add({ phrase: `book ${category.name.toLowerCase()} Lagos`, cluster: 'Booking-intent searches', intent: 'transactional', targetPage: categoryPage(category.slug), priority: 'secondary', locationModifier: CITY, relatedService: category.slug })
  add({ phrase: `${category.name.toLowerCase()} appointment Lagos`, cluster: 'Booking-intent searches', intent: 'transactional', targetPage: categoryPage(category.slug), priority: 'secondary', locationModifier: CITY, relatedService: category.slug })
}
;[
  'book a spa appointment online Lagos', 'how to book Allay House', 'online spa booking Lagos',
  'same day spa appointment Lagos', 'spa booking app Lagos', 'weekend spa appointment Lagos',
].forEach((phrase) => add({ phrase, cluster: 'Booking-intent searches', intent: 'transactional', targetPage: '/book', priority: 'primary', locationModifier: CITY }))

// ---------------------------------------------------------------------
// 37-38: location-based & "near me"
// ---------------------------------------------------------------------
const neighbourhoods = ['Victoria Island', 'Ikoyi', 'Lekki', 'Ikeja']
for (const category of allCategories) {
  for (const area of neighbourhoods) {
    add({ phrase: `${category.name.toLowerCase()} ${area}`, cluster: 'Location-based searches', intent: 'commercial', targetPage: categoryPage(category.slug), priority: 'secondary', locationModifier: area, relatedService: category.slug })
  }
  add({ phrase: `${category.name.toLowerCase()} near me`, cluster: '"Near me" searches', intent: 'transactional', targetPage: categoryPage(category.slug), priority: 'primary', locationModifier: 'near me', relatedService: category.slug })
}

// ---------------------------------------------------------------------
// 39: question-based long-tail
// ---------------------------------------------------------------------
;[
  'what is a head spa treatment', 'what is included in a bridal spa package',
  'how long does a Brazilian wax take', 'how much is a full day spa experience in Lagos',
  'what should I wear to a Pilates class', 'how often should I get a head spa treatment',
  'what is the difference between classic and volume lashes', 'how long do BIAB nails last',
  'what is wood therapy used for', 'how much does a reformer Pilates membership cost in Lagos',
  'what happens during a hammam treatment', 'how do I choose a spa membership plan',
  'what is a hydra jelly facial', 'how long does a knotless braid appointment take',
  'what to expect at a Moroccan hammam', 'how much is a wig install in Lagos',
  'what is EMSZero body contouring', 'how do I prepare for a facial appointment',
  'what is included in a corporate wellness retreat', 'how far in advance should I book bridal spa services',
  'is Hydrafacial safe for sensitive skin', 'what is a lymphatic drainage massage good for',
  'how much should I tip at a spa in Lagos', 'what is the best spa membership for beginners',
  'how do reformer Pilates classes work', 'what is the difference between BIAB and acrylic nails',
  'how long does a full set of acrylics take', 'what is a soft sculpt body treatment',
  'how many sessions do I need for body contouring', 'what is included in the Allay House Full Day Reset',
].forEach((phrase) => add({ phrase, cluster: 'Question-based long-tail searches', intent: 'informational', targetPage: '/services', priority: 'secondary' }))

// ---------------------------------------------------------------------
// 40: comparison and informational
// ---------------------------------------------------------------------
;[
  'Hydrafacial vs regular facial', 'reformer Pilates vs mat Pilates', 'BIAB vs acrylic nails',
  'classic vs volume lashes', 'knotless braids vs box braids', 'Swedish massage vs deep tissue massage',
  'hammam vs sauna', 'wood therapy vs lymphatic drainage massage', 'gel polish vs regular polish',
  'micro braids vs knotless braids', 'head spa vs regular hair wash', 'spa membership vs pay per visit',
  'BIAB overlay vs BIAB extensions', 'hot stone massage vs deep tissue massage',
  'Moroccan hammam vs traditional hammam', 'wig install vs natural hair styling',
  'the Reset vs the Ritual membership Allay House', 'the Ritual vs the Sanctuary membership Allay House',
  'single Pilates class vs monthly package', 'EMSZero vs wood therapy',
].forEach((phrase) => add({ phrase, cluster: 'Comparison and informational searches', intent: 'informational', targetPage: '/services', priority: 'secondary' }))

// ---------------------------------------------------------------------
// Membership-specific and signature-experience direct phrases
// ---------------------------------------------------------------------
for (const membership of officialMemberships) {
  add({ phrase: `${membership.name} Allay House price`, cluster: 'Wellness-membership searches', intent: 'commercial', targetPage: `/memberships/${membership.slug}`, priority: 'primary', relatedService: membership.name })
  add({ phrase: `${membership.name} Allay House benefits`, cluster: 'Wellness-membership searches', intent: 'informational', targetPage: `/memberships/${membership.slug}`, priority: 'secondary', relatedService: membership.name })
  add({ phrase: `join ${membership.name} Allay House`, cluster: 'Wellness-membership searches', intent: 'transactional', targetPage: `/memberships/${membership.slug}`, priority: 'primary', relatedService: membership.name })
}

// ---------------------------------------------------------------------
// Nigeria-focused queries (naira pricing, national booking intent)
// ---------------------------------------------------------------------
;[
  'luxury spa Nigeria', 'best spa in Nigeria', 'spa prices in naira Lagos', 'wellness spa Nigeria prices',
  'beauty and wellness bookings Nigeria', 'luxury wellness services Nigeria', 'spa membership Nigeria',
  'Nigerian spa naira price list', 'top wellness brand Nigeria', 'best beauty and wellness spa Nigeria',
  'spa treatment prices Nigeria naira', 'Lagos Nigeria spa and wellness', 'reformer Pilates Nigeria',
  'head spa Nigeria', 'Hydrafacial Nigeria price', 'bridal spa Nigeria', 'corporate wellness Nigeria',
  'luxury nail studio Nigeria', 'wellness membership naira price', 'best hammam Nigeria',
  'Allay House naira price list', 'spa gift voucher Nigeria', 'wellness retreat Nigeria',
  'beauty salon Nigeria prices', 'day spa Nigeria', 'Pilates studio Nigeria',
].forEach((phrase) => add({ phrase, cluster: 'Nigeria-focused queries', intent: 'commercial', targetPage: '/', priority: 'secondary', locationModifier: COUNTRY }))

writeFileSync(
  path.resolve(__dirname, 'keywordLibrary.json'),
  JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalPhrases: entries.length,
    location: { city: CITY, country: COUNTRY },
    entries,
  }, null, 2),
)

console.log(`Wrote ${entries.length} unique keyword phrases to backend/src/seo/keywordLibrary.json`)
