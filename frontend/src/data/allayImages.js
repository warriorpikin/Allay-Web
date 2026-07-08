// Drop image files into src/assets/allay/{hero,services,backgrounds}/ and they appear here
// automatically, keyed by filename (without extension). Missing files simply resolve to
// `undefined` so ImagePlaceholder falls back to its gradient art — nothing breaks.
const heroModules = import.meta.glob('../assets/allay/hero/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' })
const serviceModules = import.meta.glob('../assets/allay/services/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' })
const backgroundModules = import.meta.glob('../assets/allay/backgrounds/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' })

function keyByFilename(modules) {
  const map = {}
  for (const [path, url] of Object.entries(modules)) {
    const filename = path.split('/').pop().replace(/\.[^.]+$/, '')
    map[filename] = url
  }
  return map
}

const heroImagesByFilename = keyByFilename(heroModules)
const serviceImagesByFilename = keyByFilename(serviceModules)
const backgroundImagesByFilename = keyByFilename(backgroundModules)

// Ordered by filename — drop home-hero-1.jpg, home-hero-2.jpg, etc. to populate this.
export const heroImages = Object.keys(heroImagesByFilename).sort().map((key) => heroImagesByFilename[key])

// Looks up a dropped-in image by service or category slug (e.g. "signature-glow-facial" or "allay-spa").
// Returns undefined when no matching file has been added yet.
export function getServiceImage(slug) {
  return slug ? serviceImagesByFilename[slug] : undefined
}

export const backgroundImages = {
  booking: backgroundImagesByFilename['booking-bg'],
  waitlist: backgroundImagesByFilename['waitlist-bg'],
}
