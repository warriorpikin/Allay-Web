# Allay House — Image Generation Index

This index is the working list for generating every image currently missing from the Allay House frontend. It was compiled by cross-referencing `frontend/public/images/allay/` on disk against `frontend/src/utils/imagePaths.js`, `frontend/src/data/allayImages.js`, and every page/component that consumes those paths, as of 2026-07-10.

## Verified counts (filesystem, 2026-07-10)

- **63** `.txt` placeholder files under `frontend/public/images/allay/` (confirmed via direct recursive listing)
- **3** real, already-generated images: `home/home-hero-main.png`, `home/home-texture.png`, `home/home-wellness-section.png`
- **66** total image slots defined in `IMAGE_MANIFEST.md` (63 pending + 3 generated)

### Why this differs from the earlier "62 generated images" target

The manifest defines 66 total image slots. Of those, 3 have already been generated and swapped in as real PNGs (`home-hero-main.png`, `home-texture.png`, `home-wellness-section.png` — see the `## home` section of `IMAGE_MANIFEST.md`, and the commit that changed those three rows from `<file>.jpg.txt` to `generated`). That leaves **66 − 3 = 63** placeholders still outstanding, which matches the `.txt` count on disk exactly.

An earlier report cited "62" as the target. That number does not reconcile with either the manifest (66 rows) or the filesystem (63 `.txt` + 3 `.png` = 66 files). The most likely explanation is a simple off-by-one undercount in that earlier report — possibly one placeholder (e.g. `favicon.png.txt` or `home-experience-section.jpg.txt`) was missed when it was tallied by hand. No `.txt` file, manifest row, or code reference was found anywhere in this repository that supports a total of 62. The verified, current figures are **63 outstanding placeholders** and **3 already-generated images**, for **66 total** — this document and the accompanying manifest reflect that.

## How to use this index

Each numbered entry below corresponds to exactly one `.txt` placeholder. Generate the image using the prompt provided, save it under the **Intended final output path**, then delete the matching `.txt` file. Do not rename the `.txt` file itself into an image — it must be replaced by a newly generated binary image file.

---

## Brand

### 1. allay-logo-dark.png.txt
- **Placeholder file:** `frontend/public/images/allay/brand/allay-logo-dark.png.txt`
- **Intended final filename:** `allay-logo-dark.png`
- **Intended output path:** `frontend/public/images/allay/brand/allay-logo-dark.png`
- **Used in:** `Logo` component (`frontend/src/components/common/Logo.jsx`), rendered as `<Logo dark />` in `Footer` (`frontend/src/components/layout/Footer.jsx`)
- **Section/service represented:** Primary wordmark, dark variant, for use on light backgrounds
- **Required aspect ratio:** ~8:3 landscape (horizontal wordmark lockup)
- **Recommended dimensions:** 800x300px, transparent background, PNG
- **Full image-generation prompt:** "A minimalist wordmark logo reading 'ALLAY HOUSE' in a refined modern serif typeface, dark charcoal/near-black color, on a fully transparent background. Clean horizontal lockup, generous letter spacing, no icon or ornament, no drop shadow, vector-flat, suitable for a luxury beauty and wellness brand in Lagos, Nigeria."
- **Alt text:** `""` (decorative — code sets `alt=""` and `aria-hidden="true"`; brand name is conveyed by the adjacent `<span className="logo__fallback">ALLAY HOUSE</span>` text)
- **Above the fold:** No (only rendered in the site `Footer`)
- **Loading:** Lazy

### 2. allay-logo-light.png.txt
- **Placeholder file:** `frontend/public/images/allay/brand/allay-logo-light.png.txt`
- **Intended final filename:** `allay-logo-light.png`
- **Intended output path:** `frontend/public/images/allay/brand/allay-logo-light.png`
- **Used in:** `Logo` component, default (non-`dark`) variant — rendered in `Navbar` (`frontend/src/components/layout/Navbar.jsx`), `AuthLayout` header, and `Waitlist` page header
- **Section/service represented:** Primary wordmark, light variant, for use on dark/colored backgrounds
- **Required aspect ratio:** ~8:3 landscape (horizontal wordmark lockup)
- **Recommended dimensions:** 800x300px, transparent background, PNG
- **Full image-generation prompt:** "A minimalist wordmark logo reading 'ALLAY HOUSE' in a refined modern serif typeface, warm off-white/cream color, on a fully transparent background. Clean horizontal lockup, generous letter spacing, no icon or ornament, no drop shadow, vector-flat, suitable for a luxury beauty and wellness brand in Lagos, Nigeria."
- **Alt text:** `""` (decorative — code sets `alt=""` and `aria-hidden="true"`)
- **Above the fold:** Yes (site header/navbar on every public page)
- **Loading:** Eager

### 3. allay-mark.png.txt
- **Placeholder file:** `frontend/public/images/allay/brand/allay-mark.png.txt`
- **Intended final filename:** `allay-mark.png`
- **Intended output path:** `frontend/public/images/allay/brand/allay-mark.png`
- **Used in:** Not yet rendered anywhere in the app; defined at `imagePaths.brand.mark` (`frontend/src/utils/imagePaths.js`) as a reserved brand asset
- **Section/service represented:** Standalone brand mark/icon (no wordmark)
- **Required aspect ratio:** 1:1 square
- **Recommended dimensions:** 512x512px, transparent background, PNG
- **Full image-generation prompt:** "A minimalist geometric monogram icon combining the letters 'A' and 'H' into a single elegant mark, warm sage-green or stone color, on a fully transparent background. Flat vector style, symmetrical, no wordmark or text, suitable as a standalone app icon or social avatar for a luxury beauty and wellness brand."
- **Alt text:** `"Allay House brand mark"`
- **Above the fold:** Not applicable (not currently wired into any layout)
- **Loading:** Lazy (recommend `loading="lazy"` if/when adopted, since it's not a first-paint element)

### 4. favicon.png.txt
- **Placeholder file:** `frontend/public/images/allay/brand/favicon.png.txt`
- **Intended final filename:** `favicon.png`
- **Intended output path:** `frontend/public/images/allay/brand/favicon.png`
- **Used in:** `<link rel="icon">` in `frontend/index.html`
- **Section/service represented:** Browser tab / bookmark icon
- **Required aspect ratio:** 1:1 square
- **Recommended dimensions:** 512x512px, PNG (browser will downscale as needed)
- **Full image-generation prompt:** "A minimalist geometric monogram icon combining the letters 'A' and 'H' into a single mark, warm sage-green on a solid cream or white circular/square background (not transparent, must be legible at 16x16px), flat vector style, high contrast, suitable as a browser favicon for a luxury beauty and wellness brand."
- **Alt text:** Not applicable (favicons have no `alt` attribute; browser tab icon only)
- **Above the fold:** Not applicable (browser chrome, not page content)
- **Loading:** Eager (fetched directly by the browser via the `<link>` tag; cannot be deferred)

---

## Home (remaining placeholders)

### 5. home-hero-secondary.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/home/home-hero-secondary.jpg.txt`
- **Intended final filename:** `home-hero-secondary.jpg`
- **Intended output path:** `frontend/public/images/allay/home/home-hero-secondary.jpg`
- **Used in:** Defined at `imagePaths.home.heroSecondary` and included in the `heroImages` array (`frontend/src/data/allayImages.js`); not yet rendered in `Home.jsx` — reserved for a future hero rotation/variant
- **Section/service represented:** Homepage hero, secondary/alternate image
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1800x1200px (or 1600x1000px), JPG
- **Full image-generation prompt:** "Editorial lifestyle photograph of a serene spa treatment room at Allay House, a modern beauty and wellness house in Lagos, Nigeria. Warm neutral palette of sage green, mauve, stone, and cream, soft diffused natural daylight through sheer curtains, a low daybed with folded linen towels, minimalist arched doorway in the background, shallow depth of field, calm and unhurried mood, photorealistic, no people, no visible text or logos."
- **Alt text:** `"A softly lit corner of the Allay House treatment space"`
- **Above the fold:** Yes if activated (same hero position as `home-hero-main.png`)
- **Loading:** Eager (if placed in the hero rotation)

### 6. home-hero-detail.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/home/home-hero-detail.jpg.txt`
- **Intended final filename:** `home-hero-detail.jpg`
- **Intended output path:** `frontend/public/images/allay/home/home-hero-detail.jpg`
- **Used in:** Defined at `imagePaths.home.heroDetail` and included in `heroImages` (`frontend/src/data/allayImages.js`); not yet rendered — reserved homepage detail image
- **Section/service represented:** Homepage hero, close-up detail shot
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1800x1200px (or 1600x1000px), JPG
- **Full image-generation prompt:** "Close-up editorial detail photograph for Allay House, a modern beauty and wellness house in Lagos, Nigeria. Focus on textured natural elements: a folded cream linen towel, a small ceramic bowl with dried botanicals, and a sprig of eucalyptus on warm stone/travertine surface. Soft directional natural light, shallow depth of field, warm neutral palette of sage, mauve, stone, and cream, photorealistic, no people, no visible text or logos."
- **Alt text:** `"Close-up detail of an Allay House ritual setting"`
- **Above the fold:** Yes if activated (same hero position as `home-hero-main.png`)
- **Loading:** Eager (if placed in the hero rotation)

### 7. home-experience-section.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/home/home-experience-section.jpg.txt`
- **Intended final filename:** `home-experience-section.jpg`
- **Intended output path:** `frontend/public/images/allay/home/home-experience-section.jpg`
- **Used in:** Defined at `imagePaths.home.experienceSection` (`frontend/src/utils/imagePaths.js`); not yet rendered — reserved for the homepage experience/ritual section
- **Section/service represented:** Homepage "ritual" section, below the wellness-section image
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1800x1200px (or 1600x1000px), JPG
- **Full image-generation prompt:** "Editorial lifestyle photograph of a relaxed Black/African woman receiving a calming facial or scalp massage at Allay House, a modern beauty and wellness house in Lagos, Nigeria. Warm neutral palette of sage green, mauve, stone, and cream, soft natural window light, minimalist treatment room, therapist's hands visible mid-treatment, candid and unposed feel, shallow depth of field, photorealistic, no visible text or logos."
- **Alt text:** `"A guest experiencing an Allay House ritual"`
- **Above the fold:** No (homepage "ritual" section sits well below the hero)
- **Loading:** Lazy

---

## Categories

### 8. category-spa.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/categories/category-spa.jpg.txt`
- **Intended final filename:** `category-spa.jpg`
- **Intended output path:** `frontend/public/images/allay/categories/category-spa.jpg`
- **Used in:** `getCategoryImage('allay-spa' / 'spa')` (`frontend/src/data/allayImages.js`) — rendered as a CSS `--card-image` background on the "Allay Spa" division card in `Home.jsx` and the matching category filter card in `Services.jsx`
- **Section/service represented:** Allay Spa division (massage / facials / sauna)
- **Required aspect ratio:** 4:3 landscape
- **Recommended dimensions:** 1200x900px, JPG
- **Full image-generation prompt:** "Editorial photograph of a tranquil spa treatment room at Allay House in Lagos, Nigeria. A massage table dressed in cream linen, warm sage-green accent wall, soft candlelight-style ambient lighting, a small tray with massage oils and folded towels. Warm neutral palette, shallow depth of field, calm high-end spa aesthetic, photorealistic, no people, no visible text or logos."
- **Alt text:** `"Allay Spa treatment room"`
- **Above the fold:** No (division grid is the third section on the homepage; category grid sits below the page header on the Services page)
- **Loading:** Lazy

### 9. category-pilates.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/categories/category-pilates.jpg.txt`
- **Intended final filename:** `category-pilates.jpg`
- **Intended output path:** `frontend/public/images/allay/categories/category-pilates.jpg`
- **Used in:** `getCategoryImage('allay-pilates' / 'pilates')` — division card in `Home.jsx`, category filter card in `Services.jsx`
- **Section/service represented:** Allay Pilates division (movement / strength / balance)
- **Required aspect ratio:** 4:3 landscape
- **Recommended dimensions:** 1200x900px, JPG
- **Full image-generation prompt:** "Editorial photograph of a minimalist Pilates studio at Allay House in Lagos, Nigeria. A single reformer machine in warm stone and taupe tones, natural light streaming through large windows, neutral floor mats stacked nearby. Calm, uncluttered, boutique-fitness aesthetic, warm neutral palette, shallow depth of field, photorealistic, no people, no visible text or logos."
- **Alt text:** `"Allay Pilates studio"`
- **Above the fold:** No
- **Loading:** Lazy

### 10. category-nail-studio.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/categories/category-nail-studio.jpg.txt`
- **Intended final filename:** `category-nail-studio.jpg`
- **Intended output path:** `frontend/public/images/allay/categories/category-nail-studio.jpg`
- **Used in:** `getCategoryImage('allay-nail-studio' / 'nails')` — division card in `Home.jsx` ("Nail & Lash Studios"), category filter card in `Services.jsx`
- **Section/service represented:** Allay Nail Studio
- **Required aspect ratio:** 4:3 landscape
- **Recommended dimensions:** 1200x900px, JPG
- **Full image-generation prompt:** "Editorial photograph of an elegant nail studio manicure station at Allay House in Lagos, Nigeria. Warm stone countertop, neat rows of neutral nail polish bottles, a soft cream manicure cushion, natural side light. Minimalist, refined, warm neutral palette, shallow depth of field, photorealistic, no people, no visible text or logos."
- **Alt text:** `"Allay Nail Studio manicure station"`
- **Above the fold:** No
- **Loading:** Lazy

### 11. category-lash-studio.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/categories/category-lash-studio.jpg.txt`
- **Intended final filename:** `category-lash-studio.jpg`
- **Intended output path:** `frontend/public/images/allay/categories/category-lash-studio.jpg`
- **Used in:** `getCategoryImage('allay-lash-studio' / 'lashes')` — division card in `Home.jsx` ("Nail & Lash Studios"), category filter card in `Services.jsx`
- **Section/service represented:** Allay Lash Studio (lashes / brows)
- **Required aspect ratio:** 4:3 landscape
- **Recommended dimensions:** 1200x900px, JPG
- **Full image-generation prompt:** "Editorial photograph of a lash studio treatment chair at Allay House in Lagos, Nigeria, reclined and dressed with a cream throw, a ring light and small tray of lash tools nearby, mauve accent wall. Warm neutral palette, soft diffused light, shallow depth of field, photorealistic, no people, no visible text or logos."
- **Alt text:** `"Allay Lash Studio treatment chair"`
- **Above the fold:** No
- **Loading:** Lazy

### 12. category-salon.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/categories/category-salon.jpg.txt`
- **Intended final filename:** `category-salon.jpg`
- **Intended output path:** `frontend/public/images/allay/categories/category-salon.jpg`
- **Used in:** `getCategoryImage('allay-salon' / 'salon')` — division card in `Home.jsx` ("Allay Salon"), category filter card in `Services.jsx`
- **Section/service represented:** Allay Salon (hair / braiding / headspa)
- **Required aspect ratio:** 4:3 landscape
- **Recommended dimensions:** 1200x900px, JPG
- **Full image-generation prompt:** "Editorial photograph of a minimalist hair salon styling station at Allay House in Lagos, Nigeria. A round mirror in a brass frame, a stone-top counter with styling tools neatly arranged, a cream salon chair, warm natural light. Refined, uncluttered, warm neutral palette, shallow depth of field, photorealistic, no people, no visible text or logos."
- **Alt text:** `"Allay Salon hair styling chair"`
- **Above the fold:** No
- **Loading:** Lazy

### 13. category-facials.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/categories/category-facials.jpg.txt`
- **Intended final filename:** `category-facials.jpg`
- **Intended output path:** `frontend/public/images/allay/categories/category-facials.jpg`
- **Used in:** `getCategoryImage('facials')` — category filter card in `Services.jsx`
- **Section/service represented:** Facials category
- **Required aspect ratio:** 4:3 landscape
- **Recommended dimensions:** 1200x900px, JPG
- **Full image-generation prompt:** "Editorial photograph of a facial treatment room at Allay House in Lagos, Nigeria. A treatment bed with cream linen, a small trolley with skincare products and a jade roller, soft warm lighting, sage-green accent wall. Calm, clinical-but-warm spa aesthetic, shallow depth of field, photorealistic, no people, no visible text or logos."
- **Alt text:** `"Facial treatment room at Allay House"`
- **Above the fold:** No
- **Loading:** Lazy

### 14. category-massage.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/categories/category-massage.jpg.txt`
- **Intended final filename:** `category-massage.jpg`
- **Intended output path:** `frontend/public/images/allay/categories/category-massage.jpg`
- **Used in:** `getCategoryImage('massage')` — category filter card in `Services.jsx`
- **Section/service represented:** Massage category
- **Required aspect ratio:** 4:3 landscape
- **Recommended dimensions:** 1200x900px, JPG
- **Full image-generation prompt:** "Editorial photograph of a massage treatment room at Allay House in Lagos, Nigeria. A massage table with a face cradle, stacked warm towels, a small bowl of massage oil, dim warm ambient lighting, stone and taupe tones. Calm, restorative spa mood, shallow depth of field, photorealistic, no people, no visible text or logos."
- **Alt text:** `"Massage treatment room at Allay House"`
- **Above the fold:** No
- **Loading:** Lazy

### 15. category-sauna.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/categories/category-sauna.jpg.txt`
- **Intended final filename:** `category-sauna.jpg`
- **Intended output path:** `frontend/public/images/allay/categories/category-sauna.jpg`
- **Used in:** `getCategoryImage('sauna')` — category filter card in `Services.jsx`
- **Section/service represented:** Sauna category
- **Required aspect ratio:** 4:3 landscape
- **Recommended dimensions:** 1200x900px, JPG
- **Full image-generation prompt:** "Editorial photograph of a private sauna room at Allay House in Lagos, Nigeria. Warm cedar wood benches, soft glowing light, a folded towel and small water carafe on the bench, gentle steam haze in the air. Warm, quiet, intimate mood, shallow depth of field, photorealistic, no people, no visible text or logos."
- **Alt text:** `"Private sauna room at Allay House"`
- **Above the fold:** No
- **Loading:** Lazy

### 16. category-headspa.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/categories/category-headspa.jpg.txt`
- **Intended final filename:** `category-headspa.jpg`
- **Intended output path:** `frontend/public/images/allay/categories/category-headspa.jpg`
- **Used in:** `getCategoryImage('headspa')` — category filter card in `Services.jsx`
- **Section/service represented:** Headspa category
- **Required aspect ratio:** 4:3 landscape
- **Recommended dimensions:** 1200x900px, JPG
- **Full image-generation prompt:** "Editorial photograph of a headspa ritual station at Allay House in Lagos, Nigeria. A reclined ceramic shampoo basin, warm towels folded nearby, soft steam, sage-green and cream tones, gentle natural light. Serene, sensory spa mood, shallow depth of field, photorealistic, no people, no visible text or logos."
- **Alt text:** `"Headspa ritual station at Allay House"`
- **Above the fold:** No
- **Loading:** Lazy

### 17. category-hair-braiding.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/categories/category-hair-braiding.jpg.txt`
- **Intended final filename:** `category-hair-braiding.jpg`
- **Intended output path:** `frontend/public/images/allay/categories/category-hair-braiding.jpg`
- **Used in:** `getCategoryImage('braiding' / 'hair-braiding')` — category filter card in `Services.jsx`
- **Section/service represented:** Hair braiding category
- **Required aspect ratio:** 4:3 landscape
- **Recommended dimensions:** 1200x900px, JPG
- **Full image-generation prompt:** "Editorial photograph of a hair braiding station at Allay House in Lagos, Nigeria. A styling chair facing a stone-top counter, neatly organized braiding hair extensions and combs, warm natural light, taupe and cream tones. Refined salon aesthetic, shallow depth of field, photorealistic, no people, no visible text or logos."
- **Alt text:** `"Hair braiding station at Allay House"`
- **Above the fold:** No
- **Loading:** Lazy

### 18. category-wigs.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/categories/category-wigs.jpg.txt`
- **Intended final filename:** `category-wigs.jpg`
- **Intended output path:** `frontend/public/images/allay/categories/category-wigs.jpg`
- **Used in:** `getCategoryImage('hair-and-wigs' / 'wigs')` — division card in `Home.jsx` ("Allay Salon" grouping), category filter card in `Services.jsx`
- **Section/service represented:** Hair & Wigs category
- **Required aspect ratio:** 4:3 landscape
- **Recommended dimensions:** 1200x900px, JPG
- **Full image-generation prompt:** "Editorial photograph of a wig styling station at Allay House in Lagos, Nigeria. A mannequin head displaying a premium human-hair wig on a stone counter, styling tools neatly arranged, warm natural light, cream and stone tones. Boutique, refined mood, shallow depth of field, photorealistic, no visible text or logos."
- **Alt text:** `"Wig styling station at Allay House"`
- **Above the fold:** No
- **Loading:** Lazy

---

## About

### 19. about-hero.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/about/about-hero.jpg.txt`
- **Intended final filename:** `about-hero.jpg`
- **Intended output path:** `frontend/public/images/allay/about/about-hero.jpg`
- **Used in:** `PageHero` component on the `About` page (`frontend/src/pages/public/About.jsx`), `image={imagePaths.about.hero}`
- **Section/service represented:** About page hero
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1800x1200px (or 1600x1000px), JPG
- **Full image-generation prompt:** "Editorial architectural interior photograph of the Allay House lobby/reception in Lagos, Nigeria. Warm neutral palette of sage green, mauve, stone, and cream, an arched doorway, minimalist furniture, a small arrangement of dried botanicals, soft natural daylight. Calm, considered, high-end wellness-house atmosphere, photorealistic, no people, no visible text or logos."
- **Alt text:** `"Allay House interior"` (already specified in code as `imageAlt="Allay House interior"`)
- **Above the fold:** Yes (page hero, first section on the About page)
- **Loading:** Eager

### 20. about-interior.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/about/about-interior.jpg.txt`
- **Intended final filename:** `about-interior.jpg`
- **Intended output path:** `frontend/public/images/allay/about/about-interior.jpg`
- **Used in:** Defined at `imagePaths.about.interior`; not yet rendered — reserved for a future About page interior section
- **Section/service represented:** About page, interior/architecture detail
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1800x1200px (or 1600x1000px), JPG
- **Full image-generation prompt:** "Editorial interior photograph of a corridor inside Allay House in Lagos, Nigeria, with an arched doorway leading to a treatment room, warm stone flooring, sage-green wall accents, soft natural light casting gentle shadows. Minimalist, architectural, warm neutral palette, photorealistic, no people, no visible text or logos."
- **Alt text:** `"Interior corridor at Allay House"`
- **Above the fold:** No (reserved section, would sit below the hero/prose section)
- **Loading:** Lazy

### 21. about-care.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/about/about-care.jpg.txt`
- **Intended final filename:** `about-care.jpg`
- **Intended output path:** `frontend/public/images/allay/about/about-care.jpg`
- **Used in:** Defined at `imagePaths.about.care`; not yet rendered — reserved for a future About page "care" section
- **Section/service represented:** About page, care/philosophy section
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1800x1200px (or 1600x1000px), JPG
- **Full image-generation prompt:** "Editorial photograph of a therapist's hands gently arranging warm towels and skincare tools on a tray at Allay House in Lagos, Nigeria. Close, intimate framing, warm neutral palette of sage, mauve, and cream, soft natural light. Conveys attentive, unhurried care, shallow depth of field, photorealistic, no faces, no visible text or logos."
- **Alt text:** `"Attentive care at Allay House"`
- **Above the fold:** No
- **Loading:** Lazy

### 22. about-brand-story.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/about/about-brand-story.jpg.txt`
- **Intended final filename:** `about-brand-story.jpg`
- **Intended output path:** `frontend/public/images/allay/about/about-brand-story.jpg`
- **Used in:** Defined at `imagePaths.about.brandStory`; not yet rendered — reserved for a future About page brand-story section
- **Section/service represented:** About page, brand story/founder section
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1800x1200px (or 1600x1000px), JPG
- **Full image-generation prompt:** "Editorial lifestyle photograph representing the founding story of Allay House, a beauty and wellness house in Lagos, Nigeria. A quiet moment in a softly lit design studio or early-stage interior space, warm neutral palette, a mood board with fabric swatches in sage, mauve, and cream, natural light. Reflective, aspirational tone, photorealistic, no visible text or logos."
- **Alt text:** `"The story behind Allay House"`
- **Above the fold:** No
- **Loading:** Lazy

---

## Contact

### 23. contact-hero.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/contact/contact-hero.jpg.txt`
- **Intended final filename:** `contact-hero.jpg`
- **Intended output path:** `frontend/public/images/allay/contact/contact-hero.jpg`
- **Used in:** `PageHero` component on the `Contact` page (`frontend/src/pages/public/Contact.jsx`), `image={imagePaths.contact.hero}`
- **Section/service represented:** Contact page hero
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1800x1200px (or 1600x1000px), JPG
- **Full image-generation prompt:** "Editorial photograph of a warm, welcoming reception desk at Allay House in Lagos, Nigeria. A stone counter with a small vase of dried flowers, a guest book, soft natural light through sheer curtains, sage-green and cream tones. Inviting, calm, high-end wellness-house mood, photorealistic, no people, no visible text or logos."
- **Alt text:** `"A warm Allay House welcome"` (already specified in code as `imageAlt="A warm Allay House welcome"`)
- **Above the fold:** Yes (page hero, first section on the Contact page)
- **Loading:** Eager

### 24. contact-location.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/contact/contact-location.jpg.txt`
- **Intended final filename:** `contact-location.jpg`
- **Intended output path:** `frontend/public/images/allay/contact/contact-location.jpg`
- **Used in:** Defined at `imagePaths.contact.location`; not yet rendered — reserved for a future Contact page location section
- **Section/service represented:** Contact page, location/exterior section
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1800x1200px (or 1600x1000px), JPG
- **Full image-generation prompt:** "Editorial architectural photograph of the exterior entrance of Allay House in Lagos, Nigeria: a minimalist storefront with a discreet signage plaque area (left blank, no text rendered), warm stone facade, potted greenery by the entrance, soft daylight. Upscale, understated, photorealistic, no visible text or logos."
- **Alt text:** `"Allay House exterior entrance"`
- **Above the fold:** No
- **Loading:** Lazy

### 25. contact-interior.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/contact/contact-interior.jpg.txt`
- **Intended final filename:** `contact-interior.jpg`
- **Intended output path:** `frontend/public/images/allay/contact/contact-interior.jpg`
- **Used in:** Defined at `imagePaths.contact.interior`; not yet rendered — reserved for a future Contact page interior section
- **Section/service represented:** Contact page, interior/waiting area section
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1800x1200px (or 1600x1000px), JPG
- **Full image-generation prompt:** "Editorial interior photograph of a calm waiting lounge at Allay House in Lagos, Nigeria. Two low armchairs in stone and taupe fabric, a small side table with a cup of herbal tea, soft natural light, sage-green accent wall. Warm, relaxed, high-end wellness-house mood, photorealistic, no people, no visible text or logos."
- **Alt text:** `"Waiting lounge at Allay House"`
- **Above the fold:** No
- **Loading:** Lazy

---

## Auth

### 26. auth-signin.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/auth/auth-signin.jpg.txt`
- **Intended final filename:** `auth-signin.jpg`
- **Intended output path:** `frontend/public/images/allay/auth/auth-signin.jpg`
- **Used in:** `AuthLayout` (`frontend/src/components/layout/AuthLayout.jsx`), applied as a CSS `--auth-page-image` background when the current route does not include `sign-up`
- **Section/service represented:** Customer sign-in background
- **Required aspect ratio:** 3:4 portrait
- **Recommended dimensions:** 1200x1600px, JPG
- **Full image-generation prompt:** "Editorial portrait-orientation photograph of a serene spa corner at Allay House in Lagos, Nigeria. A tall arched window, a single upholstered chair in mauve, soft natural light, warm neutral palette of sage, stone, and cream. Calm, quiet, welcoming mood suitable as a full-bleed side-panel background, photorealistic, no people, no visible text or logos."
- **Alt text:** `""` (decorative — currently implemented as a CSS `background-image` on the layout `<main>`, no `<img>`/`alt` attribute in code; suggested alt if ever rendered as `<img>`: "Warm Allay House interior backdrop for sign-in")
- **Above the fold:** Yes (full-bleed background covering the entire auth screen)
- **Loading:** Eager

### 27. auth-signup.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/auth/auth-signup.jpg.txt`
- **Intended final filename:** `auth-signup.jpg`
- **Intended output path:** `frontend/public/images/allay/auth/auth-signup.jpg`
- **Used in:** `AuthLayout`, applied as `--auth-page-image` background when the route includes `sign-up`
- **Section/service represented:** Customer sign-up background
- **Required aspect ratio:** 3:4 portrait
- **Recommended dimensions:** 1200x1600px, JPG
- **Full image-generation prompt:** "Editorial portrait-orientation photograph of a welcoming treatment room entrance at Allay House in Lagos, Nigeria. An arched doorway with sheer curtain, a small bench with folded linen, soft warm daylight, neutral palette of sage, mauve, and cream. Inviting, fresh-start mood suitable as a full-bleed side-panel background, photorealistic, no people, no visible text or logos."
- **Alt text:** `""` (decorative — CSS `background-image`, no `alt` attribute in code; suggested alt if rendered as `<img>`: "Warm Allay House interior backdrop for sign-up")
- **Above the fold:** Yes (full-bleed background covering the entire auth screen)
- **Loading:** Eager

### 28. admin-login-bg.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/auth/admin-login-bg.jpg.txt`
- **Intended final filename:** `admin-login-bg.jpg`
- **Intended output path:** `frontend/public/images/allay/auth/admin-login-bg.jpg`
- **Used in:** `AdminLogin` page (`frontend/src/pages/admin/AdminLogin.jsx`), applied as `--admin-login-image` background on `.admin-login__art`
- **Section/service represented:** Admin/staff login background ("Allay House operations")
- **Required aspect ratio:** 3:4 portrait
- **Recommended dimensions:** 1200x1600px, JPG
- **Full image-generation prompt:** "Editorial portrait-orientation photograph of a behind-the-scenes operations area at Allay House in Lagos, Nigeria: a neat supply shelf with folded towels and product bottles, warm stone tones, soft directional light, subdued and slightly more muted than the client-facing spaces. Professional, calm, warm neutral palette, photorealistic, no people, no visible text or logos."
- **Alt text:** `""` (decorative — CSS `background-image`, no `alt` attribute in code; suggested alt if rendered as `<img>`: "Behind-the-scenes at Allay House operations")
- **Above the fold:** Yes (full-bleed background on the entire admin login screen)
- **Loading:** Eager

### 29. auth-side.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/auth/auth-side.jpg.txt`
- **Intended final filename:** `auth-side.jpg`
- **Intended output path:** `frontend/public/images/allay/auth/auth-side.jpg`
- **Used in:** Defined at `imagePaths.auth.side` and included in `backgroundImages.auth` (`frontend/src/data/allayImages.js`); not directly rendered in current `AuthLayout` JSX (which uses `signin`/`signup` directly) — reserved as a generic auth fallback/side image
- **Section/service represented:** Auth fallback/side background (generic)
- **Required aspect ratio:** 3:4 portrait
- **Recommended dimensions:** 1200x1600px, JPG
- **Full image-generation prompt:** "Editorial portrait-orientation photograph of a calm neutral interior vignette at Allay House in Lagos, Nigeria: a single arched mirror, a small stone side table, soft even natural light, warm sage and cream palette. Generic and versatile enough to serve as a fallback auth background, photorealistic, no people, no visible text or logos."
- **Alt text:** `""` (decorative fallback background; suggested alt if rendered as `<img>`: "Warm Allay House interior backdrop")
- **Above the fold:** Yes if activated (same full-bleed position as `auth-signin`/`auth-signup`)
- **Loading:** Eager

---

## Waitlist

### 30. waitlist-hero.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/waitlist/waitlist-hero.jpg.txt`
- **Intended final filename:** `waitlist-hero.jpg`
- **Intended output path:** `frontend/public/images/allay/waitlist/waitlist-hero.jpg`
- **Used in:** `Waitlist` page (`frontend/src/pages/public/Waitlist.jsx`), applied as `--waitlist-page-image` background on the `<main className="waitlist-page">` element
- **Section/service represented:** Waitlist page background
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1800x1200px (or 1600x1000px), JPG
- **Full image-generation prompt:** "Editorial photograph of a softly lit Allay House interior in Lagos, Nigeria, suitable as a full-page background: an arched doorway, a low bench with folded linen, warm sage-green and cream tones, gentle natural light with soft vignette toward the edges for text legibility. Calm, anticipatory mood, photorealistic, no people, no visible text or logos."
- **Alt text:** `""` (decorative — CSS `background-image` via inline `style`, no `alt` attribute in code; suggested alt if rendered as `<img>`: "Allay House interior backdrop for the private waitlist")
- **Above the fold:** Yes (full-page background behind the entire waitlist form)
- **Loading:** Eager

### 31. waitlist-side.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/waitlist/waitlist-side.jpg.txt`
- **Intended final filename:** `waitlist-side.jpg`
- **Intended output path:** `frontend/public/images/allay/waitlist/waitlist-side.jpg`
- **Used in:** Defined at `imagePaths.waitlist.side`; not yet rendered — reserved waitlist side image
- **Section/service represented:** Waitlist page, secondary/side image
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1800x1200px (or 1600x1000px), JPG
- **Full image-generation prompt:** "Editorial photograph of a quiet corner at Allay House in Lagos, Nigeria: a single armchair beside a tall window, soft afternoon light, warm neutral palette of mauve, stone, and cream. Calm, contemplative mood suitable as a secondary panel image, photorealistic, no people, no visible text or logos."
- **Alt text:** `"A quiet corner at Allay House"`
- **Above the fold:** No (not currently placed on the page)
- **Loading:** Lazy

### 32. waitlist-success.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/waitlist/waitlist-success.jpg.txt`
- **Intended final filename:** `waitlist-success.jpg`
- **Intended output path:** `frontend/public/images/allay/waitlist/waitlist-success.jpg`
- **Used in:** Defined at `imagePaths.waitlist.success`; not yet rendered — reserved for the waitlist confirmation state (`Waitlist.jsx` currently shows a text-only success message with a `Check` icon)
- **Section/service represented:** Waitlist success/confirmation state
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1800x1200px (or 1600x1000px), JPG
- **Full image-generation prompt:** "Editorial photograph conveying a moment of quiet anticipation at Allay House in Lagos, Nigeria: a beautifully set treatment tray with a lit candle and folded towel, warm golden-hour light, sage and cream tones. Hopeful, warm, celebratory-but-calm mood, photorealistic, no people, no visible text or logos."
- **Alt text:** `"You are on the Allay House waitlist"`
- **Above the fold:** Yes if activated (would appear in the success state, which replaces the entire form view)
- **Loading:** Lazy (only shown after form submission, not on initial page load)

---

## Booking

### 33. booking-hero.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/booking/booking-hero.jpg.txt`
- **Intended final filename:** `booking-hero.jpg`
- **Intended output path:** `frontend/public/images/allay/booking/booking-hero.jpg`
- **Used in:** Defined at `imagePaths.booking.hero`; not yet rendered in `Booking.jsx` — reserved booking page hero/background
- **Section/service represented:** Booking page hero (reserved)
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1800x1200px (or 1600x1000px), JPG
- **Full image-generation prompt:** "Editorial photograph of an inviting treatment room at Allay House in Lagos, Nigeria, ready for an appointment: a made-up treatment bed, a small clock, warm natural light, sage and cream tones. Organized, calm, ready-for-you mood, photorealistic, no people, no visible text or logos."
- **Alt text:** `"An Allay House treatment room ready for your visit"`
- **Above the fold:** No (not currently placed on the page)
- **Loading:** Lazy

### 34. booking-side.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/booking/booking-side.jpg.txt`
- **Intended final filename:** `booking-side.jpg`
- **Intended output path:** `frontend/public/images/allay/booking/booking-side.jpg`
- **Used in:** Defined at `imagePaths.booking.side`; not yet rendered — reserved booking side image
- **Section/service represented:** Booking page, secondary/side image
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1800x1200px (or 1600x1000px), JPG
- **Full image-generation prompt:** "Editorial photograph of a calendar and appointment card resting on a stone side table at Allay House in Lagos, Nigeria, beside a small vase of dried flowers, soft natural light, warm neutral palette. Organized, considered mood suitable as a secondary panel image, photorealistic, no visible text or logos."
- **Alt text:** `"Planning a visit to Allay House"`
- **Above the fold:** No
- **Loading:** Lazy

### 35. booking-success.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/booking/booking-success.jpg.txt`
- **Intended final filename:** `booking-success.jpg`
- **Intended output path:** `frontend/public/images/allay/booking/booking-success.jpg`
- **Used in:** Defined at `imagePaths.booking.success`; not yet rendered — reserved for the booking confirmation screen (routed to `/booking-success` in `Booking.jsx`, currently text-only)
- **Section/service represented:** Booking success/confirmation state
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1800x1200px (or 1600x1000px), JPG
- **Full image-generation prompt:** "Editorial photograph conveying confirmation and warmth at Allay House in Lagos, Nigeria: a beautifully prepared treatment room with a welcome tray, soft warm golden light, sage and cream tones. Celebratory, reassuring, calm mood, photorealistic, no people, no visible text or logos."
- **Alt text:** `"Your Allay House booking is confirmed"`
- **Above the fold:** Yes if activated (would appear on the dedicated booking-success page)
- **Loading:** Eager (if used, since it would be the primary content of a short confirmation page)

### 36. booking-empty.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/booking/booking-empty.jpg.txt`
- **Intended final filename:** `booking-empty.jpg`
- **Intended output path:** `frontend/public/images/allay/booking/booking-empty.jpg`
- **Used in:** `Booking` page (`frontend/src/pages/public/Booking.jsx`), applied as `--booking-page-image` background on the `.booking-disabled` section shown when `isLive` is `false` (pre-launch mode)
- **Section/service represented:** Booking disabled / pre-launch state
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1800x1200px (or 1600x1000px), JPG
- **Full image-generation prompt:** "Editorial photograph of a beautifully finished but quiet Allay House treatment room in Lagos, Nigeria, suggesting 'opening soon': a made-up treatment bed with no signs of activity, soft warm light, sage and cream tones, gentle vignette toward the edges for text legibility. Calm, anticipatory, photorealistic, no people, no visible text or logos."
- **Alt text:** `""` (decorative — CSS `background-image` via inline `style`, no `alt` attribute in code; suggested alt if rendered as `<img>`: "Allay House, opening soon")
- **Above the fold:** Yes (full-bleed background behind the pre-launch booking message)
- **Loading:** Eager

---

## Services

### 37. service-swedish-massage.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/services/service-swedish-massage.jpg.txt`
- **Intended final filename:** `service-swedish-massage.jpg`
- **Intended output path:** `frontend/public/images/allay/services/service-swedish-massage.jpg`
- **Used in:** `getServiceImage('swedish-massage')` (`frontend/src/data/allayImages.js`) — rendered by `ServiceCard` (services grid on `Services.jsx`) and `ServiceDetail` page; reserved slug, not in the current seed/placeholder service list
- **Section/service represented:** Swedish Massage (Massage category)
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1200x800px, JPG
- **Full image-generation prompt:** "Editorial photograph of a classic Swedish massage in progress at Allay House in Lagos, Nigeria: a therapist's hands performing long, smooth strokes on a client's back on a linen-draped massage table, warm ambient lighting, sage and stone tones. Relaxed, professional spa mood, shallow depth of field, photorealistic, no visible faces necessary, no visible text or logos."
- **Alt text:** `"Swedish Massage treatment"`
- **Above the fold:** No on the services grid (card thumbnail, below the page header); Yes on its own `ServiceDetail` page (primary image at top of that page)
- **Loading:** Lazy (grid thumbnail); Eager if rendered as the detail-page hero

### 38. service-deep-tissue-massage.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/services/service-deep-tissue-massage.jpg.txt`
- **Intended final filename:** `service-deep-tissue-massage.jpg`
- **Intended output path:** `frontend/public/images/allay/services/service-deep-tissue-massage.jpg`
- **Used in:** `getServiceImage('deep-tissue-massage')` — `ServiceCard` grid and `ServiceDetail` page (matches seed service "Deep Tissue Massage")
- **Section/service represented:** Deep Tissue Massage (Massage category)
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1200x800px, JPG
- **Full image-generation prompt:** "Editorial photograph of a deep tissue massage at Allay House in Lagos, Nigeria: a therapist applying focused, firm pressure with forearm or thumb technique on a client's shoulder, warm dim lighting, stone and taupe tones, a folded towel nearby. Therapeutic, focused mood, shallow depth of field, photorealistic, no visible text or logos."
- **Alt text:** `"Deep Tissue Massage treatment"`
- **Above the fold:** No on the services grid; Yes on its own `ServiceDetail` page
- **Loading:** Lazy (grid thumbnail); Eager if rendered as the detail-page hero

### 39. service-aromatherapy-massage.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/services/service-aromatherapy-massage.jpg.txt`
- **Intended final filename:** `service-aromatherapy-massage.jpg`
- **Intended output path:** `frontend/public/images/allay/services/service-aromatherapy-massage.jpg`
- **Used in:** `getServiceImage('aromatherapy-massage')` — `ServiceCard` grid and `ServiceDetail` page; reserved slug, not in the current seed/placeholder service list
- **Section/service represented:** Aromatherapy Massage (Massage category)
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1200x800px, JPG
- **Full image-generation prompt:** "Editorial photograph of an aromatherapy massage setup at Allay House in Lagos, Nigeria: small amber essential oil bottles and a diffuser with soft mist beside a linen-draped massage table, warm candlelit ambiance, sage and cream tones. Sensory, calming mood, shallow depth of field, photorealistic, no visible text or logos."
- **Alt text:** `"Aromatherapy Massage treatment"`
- **Above the fold:** No on the services grid; Yes on its own `ServiceDetail` page
- **Loading:** Lazy (grid thumbnail); Eager if rendered as the detail-page hero

### 40. service-classic-facial.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/services/service-classic-facial.jpg.txt`
- **Intended final filename:** `service-classic-facial.jpg`
- **Intended output path:** `frontend/public/images/allay/services/service-classic-facial.jpg`
- **Used in:** `getServiceImage('classic-facial')` — `ServiceCard` grid and `ServiceDetail` page; reserved slug, not in the current seed/placeholder service list
- **Section/service represented:** Classic Facial (Facials category)
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1200x800px, JPG
- **Full image-generation prompt:** "Editorial photograph of a classic facial treatment at Allay House in Lagos, Nigeria: an esthetician applying a cleansing product to a client's face on a treatment bed, soft warm light, cream headband keeping hair back, sage-green towel. Gentle, clinical-but-warm spa mood, shallow depth of field, photorealistic, no visible text or logos."
- **Alt text:** `"Classic Facial treatment"`
- **Above the fold:** No on the services grid; Yes on its own `ServiceDetail` page
- **Loading:** Lazy (grid thumbnail); Eager if rendered as the detail-page hero

### 41. service-hydrating-facial.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/services/service-hydrating-facial.jpg.txt`
- **Intended final filename:** `service-hydrating-facial.jpg`
- **Intended output path:** `frontend/public/images/allay/services/service-hydrating-facial.jpg`
- **Used in:** `getServiceImage('hydrating-facial')` — `ServiceCard` grid and `ServiceDetail` page (matches seed service "Hydrating Facial")
- **Section/service represented:** Hydrating Facial (Facials category)
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1200x800px, JPG
- **Full image-generation prompt:** "Editorial photograph of a hydrating facial at Allay House in Lagos, Nigeria: a fresh hydrating mask being applied to a client's face, dewy glowing skin texture visible, soft natural light, cream and mauve tones. Fresh, replenishing mood, shallow depth of field, photorealistic, no visible text or logos."
- **Alt text:** `"Hydrating Facial treatment"`
- **Above the fold:** No on the services grid; Yes on its own `ServiceDetail` page
- **Loading:** Lazy (grid thumbnail); Eager if rendered as the detail-page hero

### 42. service-glow-facial.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/services/service-glow-facial.jpg.txt`
- **Intended final filename:** `service-glow-facial.jpg`
- **Intended output path:** `frontend/public/images/allay/services/service-glow-facial.jpg`
- **Used in:** `getServiceImage('signature-glow-facial' / 'glow-facial')` — `ServiceCard` grid and `ServiceDetail` page (matches seed service "Signature Glow Facial")
- **Section/service represented:** Signature Glow Facial (Facials category)
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1200x800px, JPG
- **Full image-generation prompt:** "Editorial photograph of a signature glow facial at Allay House in Lagos, Nigeria: warm golden-hour light on a client's radiant skin during a facial massage step, esthetician's hands visible, mauve and cream tones. Luminous, elevated, signature-treatment mood, shallow depth of field, photorealistic, no visible text or logos."
- **Alt text:** `"Signature Glow Facial treatment"`
- **Above the fold:** No on the services grid; Yes on its own `ServiceDetail` page
- **Loading:** Lazy (grid thumbnail); Eager if rendered as the detail-page hero

### 43. service-sauna-session.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/services/service-sauna-session.jpg.txt`
- **Intended final filename:** `service-sauna-session.jpg`
- **Intended output path:** `frontend/public/images/allay/services/service-sauna-session.jpg`
- **Used in:** `getServiceImage('sauna-session')` — `ServiceCard` grid and `ServiceDetail` page (matches seed service "Sauna Session")
- **Section/service represented:** Sauna Session (Sauna category)
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1200x800px, JPG
- **Full image-generation prompt:** "Editorial photograph of a private sauna session setting at Allay House in Lagos, Nigeria: warm cedar wood interior, a folded towel and glass of infused water on the bench, soft glowing light and gentle steam haze. Quiet, restorative mood, shallow depth of field, photorealistic, no visible text or logos."
- **Alt text:** `"Sauna Session"`
- **Above the fold:** No on the services grid; Yes on its own `ServiceDetail` page
- **Loading:** Lazy (grid thumbnail); Eager if rendered as the detail-page hero

### 44. service-headspa-treatment.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/services/service-headspa-treatment.jpg.txt`
- **Intended final filename:** `service-headspa-treatment.jpg`
- **Intended output path:** `frontend/public/images/allay/services/service-headspa-treatment.jpg`
- **Used in:** `getServiceImage('headspa-ritual' / 'headspa-treatment')` — `ServiceCard` grid and `ServiceDetail` page (matches seed service "Headspa Ritual")
- **Section/service represented:** Headspa Ritual (Headspa category)
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1200x800px, JPG
- **Full image-generation prompt:** "Editorial photograph of a headspa ritual at Allay House in Lagos, Nigeria: a client reclined in a ceramic shampoo basin, warm water and gentle scalp massage, soft steam, sage-green and cream tones. Sensory, deeply relaxing mood, shallow depth of field, photorealistic, no visible text or logos."
- **Alt text:** `"Headspa Ritual treatment"`
- **Above the fold:** No on the services grid; Yes on its own `ServiceDetail` page
- **Loading:** Lazy (grid thumbnail); Eager if rendered as the detail-page hero

### 45. service-classic-manicure.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/services/service-classic-manicure.jpg.txt`
- **Intended final filename:** `service-classic-manicure.jpg`
- **Intended output path:** `frontend/public/images/allay/services/service-classic-manicure.jpg`
- **Used in:** `getServiceImage('classic-manicure')` — `ServiceCard` grid and `ServiceDetail` page (matches seed service "Nail Care Session")
- **Section/service represented:** Nail Care Session / Classic Manicure (Nail Studio category)
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1200x800px, JPG
- **Full image-generation prompt:** "Editorial photograph of a classic manicure in progress at Allay House in Lagos, Nigeria: a nail technician's hands filing and shaping a client's nails on a cream manicure cushion, warm stone countertop, soft natural light. Detailed, refined mood, shallow depth of field, photorealistic, no visible text or logos."
- **Alt text:** `"Nail Care Session (Classic Manicure)"`
- **Above the fold:** No on the services grid; Yes on its own `ServiceDetail` page
- **Loading:** Lazy (grid thumbnail); Eager if rendered as the detail-page hero

### 46. service-classic-pedicure.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/services/service-classic-pedicure.jpg.txt`
- **Intended final filename:** `service-classic-pedicure.jpg`
- **Intended output path:** `frontend/public/images/allay/services/service-classic-pedicure.jpg`
- **Used in:** `getServiceImage('classic-pedicure')` — `ServiceCard` grid and `ServiceDetail` page; reserved slug, not in the current seed/placeholder service list
- **Section/service represented:** Classic Pedicure (Nail Studio category)
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1200x800px, JPG
- **Full image-generation prompt:** "Editorial photograph of a classic pedicure in progress at Allay House in Lagos, Nigeria: a technician's hands massaging a client's foot resting in a warm water basin, folded towels nearby, warm stone tones, soft natural light. Relaxed, indulgent mood, shallow depth of field, photorealistic, no visible text or logos."
- **Alt text:** `"Classic Pedicure treatment"`
- **Above the fold:** No on the services grid; Yes on its own `ServiceDetail` page
- **Loading:** Lazy (grid thumbnail); Eager if rendered as the detail-page hero

### 47. service-gel-polish.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/services/service-gel-polish.jpg.txt`
- **Intended final filename:** `service-gel-polish.jpg`
- **Intended output path:** `frontend/public/images/allay/services/service-gel-polish.jpg`
- **Used in:** `getServiceImage('gel-polish')` — `ServiceCard` grid and `ServiceDetail` page; reserved slug, not in the current seed/placeholder service list
- **Section/service represented:** Gel Polish (Nail Studio category)
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1200x800px, JPG
- **Full image-generation prompt:** "Editorial close-up photograph of a gel polish application at Allay House in Lagos, Nigeria: a technician's hand applying a neutral rose-nude gel polish to a client's nails, small UV lamp visible, warm stone countertop, soft light. Precise, refined mood, shallow depth of field, photorealistic, no visible text or logos."
- **Alt text:** `"Gel Polish application"`
- **Above the fold:** No on the services grid; Yes on its own `ServiceDetail` page
- **Loading:** Lazy (grid thumbnail); Eager if rendered as the detail-page hero

### 48. service-nail-art.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/services/service-nail-art.jpg.txt`
- **Intended final filename:** `service-nail-art.jpg`
- **Intended output path:** `frontend/public/images/allay/services/service-nail-art.jpg`
- **Used in:** `getServiceImage('nail-art')` — `ServiceCard` grid and `ServiceDetail` page; reserved slug, not in the current seed/placeholder service list
- **Section/service represented:** Nail Art (Nail Studio category)
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1200x800px, JPG
- **Full image-generation prompt:** "Editorial close-up photograph of delicate nail art detailing at Allay House in Lagos, Nigeria: a technician's fine brush adding a subtle minimalist design to a manicured nail, warm neutral palette, soft focused light. Precise, artistic mood, shallow depth of field, photorealistic, no visible text or logos."
- **Alt text:** `"Nail Art detailing"`
- **Above the fold:** No on the services grid; Yes on its own `ServiceDetail` page
- **Loading:** Lazy (grid thumbnail); Eager if rendered as the detail-page hero

### 49. service-lash-extensions.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/services/service-lash-extensions.jpg.txt`
- **Intended final filename:** `service-lash-extensions.jpg`
- **Intended output path:** `frontend/public/images/allay/services/service-lash-extensions.jpg`
- **Used in:** `getServiceImage('lash-extensions')` — `ServiceCard` grid and `ServiceDetail` page; reserved slug, not in the current seed/placeholder service list
- **Section/service represented:** Lash Extensions (Lash Studio category)
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1200x800px, JPG
- **Full image-generation prompt:** "Editorial close-up photograph of a lash extension application at Allay House in Lagos, Nigeria: a technician using fine tweezers to place individual lash extensions on a reclined client's closed eye, soft ring-light glow, mauve tones. Delicate, precise mood, shallow depth of field, photorealistic, no visible text or logos."
- **Alt text:** `"Lash Extensions treatment"`
- **Above the fold:** No on the services grid; Yes on its own `ServiceDetail` page
- **Loading:** Lazy (grid thumbnail); Eager if rendered as the detail-page hero

### 50. service-lash-lift.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/services/service-lash-lift.jpg.txt`
- **Intended final filename:** `service-lash-lift.jpg`
- **Intended output path:** `frontend/public/images/allay/services/service-lash-lift.jpg`
- **Used in:** `getServiceImage('lash-lift' / 'lash-lift-tint')` — `ServiceCard` grid and `ServiceDetail` page (matches seed service "Lash Lift + Tint")
- **Section/service represented:** Lash Lift + Tint (Lash Studio category)
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1200x800px, JPG
- **Full image-generation prompt:** "Editorial close-up photograph of a lash lift and tint treatment at Allay House in Lagos, Nigeria: silicone lifting rods on a reclined client's lash line, soft warm light, mauve and cream tones. Gentle, low-maintenance-beauty mood, shallow depth of field, photorealistic, no visible text or logos."
- **Alt text:** `"Lash Lift + Tint treatment"`
- **Above the fold:** No on the services grid; Yes on its own `ServiceDetail` page
- **Loading:** Lazy (grid thumbnail); Eager if rendered as the detail-page hero

### 51. service-brow-shaping.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/services/service-brow-shaping.jpg.txt`
- **Intended final filename:** `service-brow-shaping.jpg`
- **Intended output path:** `frontend/public/images/allay/services/service-brow-shaping.jpg`
- **Used in:** `getServiceImage('brow-shaping' / 'brow-shaping-tint')` — `ServiceCard` grid and `ServiceDetail` page (matches seed service "Brow Shaping + Tint")
- **Section/service represented:** Brow Shaping + Tint (Lash Studio category)
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1200x800px, JPG
- **Full image-generation prompt:** "Editorial close-up photograph of a brow shaping and tint treatment at Allay House in Lagos, Nigeria: a technician using precise tweezers on a client's brow, small tint brush and bowl nearby, warm soft light, stone tones. Meticulous, refined mood, shallow depth of field, photorealistic, no visible text or logos."
- **Alt text:** `"Brow Shaping + Tint treatment"`
- **Above the fold:** No on the services grid; Yes on its own `ServiceDetail` page
- **Loading:** Lazy (grid thumbnail); Eager if rendered as the detail-page hero

### 52. service-hair-styling.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/services/service-hair-styling.jpg.txt`
- **Intended final filename:** `service-hair-styling.jpg`
- **Intended output path:** `frontend/public/images/allay/services/service-hair-styling.jpg`
- **Used in:** `getServiceImage('hair-styling')` — `ServiceCard` grid and `ServiceDetail` page (matches seed service "Hair Styling")
- **Section/service represented:** Hair Styling (Allay Salon category)
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1200x800px, JPG
- **Full image-generation prompt:** "Editorial photograph of a hair styling session at Allay House in Lagos, Nigeria: a stylist working a round brush and blow-dryer through a client's hair for a polished finish, warm salon lighting, taupe and cream tones. Movement, shine, finished-look mood, shallow depth of field, photorealistic, no visible text or logos."
- **Alt text:** `"Hair Styling treatment"`
- **Above the fold:** No on the services grid; Yes on its own `ServiceDetail` page
- **Loading:** Lazy (grid thumbnail); Eager if rendered as the detail-page hero

### 53. service-hair-braiding.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/services/service-hair-braiding.jpg.txt`
- **Intended final filename:** `service-hair-braiding.jpg`
- **Intended output path:** `frontend/public/images/allay/services/service-hair-braiding.jpg`
- **Used in:** `getServiceImage('braiding' / 'hair-braiding')` — `ServiceCard` grid and `ServiceDetail` page (matches seed service "Braiding")
- **Section/service represented:** Braiding (Hair & Wigs category)
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1200x800px, JPG
- **Full image-generation prompt:** "Editorial photograph of protective hair braiding in progress at Allay House in Lagos, Nigeria: a stylist's hands sectioning and braiding a client's hair with care, neatly organized extension hair nearby, warm natural light, stone tones. Patient, detailed, protective-styling mood, shallow depth of field, photorealistic, no visible text or logos."
- **Alt text:** `"Braiding treatment"`
- **Above the fold:** No on the services grid; Yes on its own `ServiceDetail` page
- **Loading:** Lazy (grid thumbnail); Eager if rendered as the detail-page hero

### 54. service-wig-installation.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/services/service-wig-installation.jpg.txt`
- **Intended final filename:** `service-wig-installation.jpg`
- **Intended output path:** `frontend/public/images/allay/services/service-wig-installation.jpg`
- **Used in:** `getServiceImage('wig-installation')` — `ServiceCard` grid and `ServiceDetail` page; reserved slug, not in the current seed/placeholder service list
- **Section/service represented:** Wig Installation (Hair & Wigs category)
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1200x800px, JPG
- **Full image-generation prompt:** "Editorial photograph of a wig installation session at Allay House in Lagos, Nigeria: a stylist securing and blending a premium human-hair wig along a client's hairline, warm salon lighting, cream and stone tones. Precise, transformative mood, shallow depth of field, photorealistic, no visible text or logos."
- **Alt text:** `"Wig Installation service"`
- **Above the fold:** No on the services grid; Yes on its own `ServiceDetail` page
- **Loading:** Lazy (grid thumbnail); Eager if rendered as the detail-page hero

### 55. service-wig-styling.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/services/service-wig-styling.jpg.txt`
- **Intended final filename:** `service-wig-styling.jpg`
- **Intended output path:** `frontend/public/images/allay/services/service-wig-styling.jpg`
- **Used in:** `getServiceImage('wig-styling' / 'premium-human-hair-wig-consultation')` — `ServiceCard` grid and `ServiceDetail` page (matches seed service "Premium Human Hair Wig Consultation")
- **Section/service represented:** Premium Human Hair Wig Consultation / Wig Styling (Hair & Wigs category)
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1200x800px, JPG
- **Full image-generation prompt:** "Editorial photograph of a wig styling consultation at Allay House in Lagos, Nigeria: a stylist showing texture and color swatches beside a mannequin head wearing a premium human-hair wig, warm stone counter, soft natural light. Consultative, refined mood, shallow depth of field, photorealistic, no visible text or logos."
- **Alt text:** `"Premium Human Hair Wig Consultation"`
- **Above the fold:** No on the services grid; Yes on its own `ServiceDetail` page
- **Loading:** Lazy (grid thumbnail); Eager if rendered as the detail-page hero

### 56. service-private-pilates.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/services/service-private-pilates.jpg.txt`
- **Intended final filename:** `service-private-pilates.jpg`
- **Intended output path:** `frontend/public/images/allay/services/service-private-pilates.jpg`
- **Used in:** `getServiceImage('private-pilates')` — `ServiceCard` grid and `ServiceDetail` page; reserved slug, not in the current seed/placeholder service list
- **Section/service represented:** Private Pilates (Allay Pilates category)
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1200x800px, JPG
- **Full image-generation prompt:** "Editorial photograph of a one-on-one Pilates session at Allay House in Lagos, Nigeria: an instructor guiding a single client through a reformer exercise, warm natural light through large studio windows, stone and taupe tones. Focused, personalized mood, shallow depth of field, photorealistic, no visible text or logos."
- **Alt text:** `"Private Pilates session"`
- **Above the fold:** No on the services grid; Yes on its own `ServiceDetail` page
- **Loading:** Lazy (grid thumbnail); Eager if rendered as the detail-page hero

### 57. service-group-pilates.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/services/service-group-pilates.jpg.txt`
- **Intended final filename:** `service-group-pilates.jpg`
- **Intended output path:** `frontend/public/images/allay/services/service-group-pilates.jpg`
- **Used in:** `getServiceImage('pilates-class' / 'group-pilates')` — `ServiceCard` grid and `ServiceDetail` page (matches seed service "Pilates Class")
- **Section/service represented:** Pilates Class / Group Pilates (Allay Pilates category)
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1200x800px, JPG
- **Full image-generation prompt:** "Editorial photograph of a small-group Pilates class at Allay House in Lagos, Nigeria: three reformer machines in a row with participants mid-exercise, natural light through large studio windows, warm stone and taupe tones. Aligned, energetic-but-calm mood, shallow depth of field, photorealistic, no visible text or logos."
- **Alt text:** `"Pilates Class (Group session)"`
- **Above the fold:** No on the services grid; Yes on its own `ServiceDetail` page
- **Loading:** Lazy (grid thumbnail); Eager if rendered as the detail-page hero

---

## Placeholders (generic fallbacks)

### 58. placeholder-hero.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/placeholders/placeholder-hero.jpg.txt`
- **Intended final filename:** `placeholder-hero.jpg`
- **Intended output path:** `frontend/public/images/allay/placeholders/placeholder-hero.jpg`
- **Used in:** `imagePaths.placeholders.hero` — used as the default `image`/`fallbackSrc` in `PageHero` (`frontend/src/components/common/PageHero.jsx`) and as the `fallbackSrc` for the homepage hero and ritual images in `Home.jsx`
- **Section/service represented:** Generic hero fallback (shown only when a specific hero image fails to load)
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1800x1200px (or 1600x1000px), JPG
- **Full image-generation prompt:** "Editorial photograph of a generic but tasteful Allay House interior in Lagos, Nigeria, suitable as a universal hero fallback: a softly lit arched doorway, warm neutral palette of sage, mauve, stone, and cream, minimal furniture, no distinguishing service-specific props. Calm, brand-consistent, photorealistic, no people, no visible text or logos."
- **Alt text:** Inherits the caller's own `alt` prop (e.g. `"Serene treatment space at Allay House"` when used as the Home hero fallback); when used generically: `"Allay House"`
- **Above the fold:** Not fixed — appears wherever its host component appears; only rendered on image-load failure
- **Loading:** Eager (fallback swap happens client-side immediately after the primary image errors, so it must be ready without delay)

### 59. placeholder-category.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/placeholders/placeholder-category.jpg.txt`
- **Intended final filename:** `placeholder-category.jpg`
- **Intended output path:** `frontend/public/images/allay/placeholders/placeholder-category.jpg`
- **Used in:** `imagePaths.placeholders.category` — returned by `getCategoryImage()` (`frontend/src/data/allayImages.js`) for the `all` category and any unrecognized category slug, on `Home.jsx` and `Services.jsx`
- **Section/service represented:** Generic category fallback / "All services" card
- **Required aspect ratio:** 4:3 landscape
- **Recommended dimensions:** 1200x900px, JPG
- **Full image-generation prompt:** "Editorial photograph of a generic, tasteful Allay House interior vignette in Lagos, Nigeria, suitable as a universal category-card fallback: soft natural light, warm neutral palette, no service-specific props. Calm, brand-consistent, photorealistic, no people, no visible text or logos."
- **Alt text:** `"Allay House"` (category name is rendered separately as text overlay on the card, not part of the image alt)
- **Above the fold:** No (category grid sits below the page header)
- **Loading:** Lazy

### 60. placeholder-service.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/placeholders/placeholder-service.jpg.txt`
- **Intended final filename:** `placeholder-service.jpg`
- **Intended output path:** `frontend/public/images/allay/placeholders/placeholder-service.jpg`
- **Used in:** `imagePaths.placeholders.service` — returned by `getServiceImage()` for any unrecognized service slug, and as the `fallbackSrc` in `ServiceCard` and `ServiceDetail`
- **Section/service represented:** Generic service fallback
- **Required aspect ratio:** 3:2 landscape
- **Recommended dimensions:** 1200x800px, JPG
- **Full image-generation prompt:** "Editorial photograph of a generic, tasteful spa/beauty treatment vignette at Allay House in Lagos, Nigeria, suitable as a universal service fallback: soft warm light, neutral treatment tools laid out on a stone surface, no specific service identifiable. Calm, brand-consistent, photorealistic, no people, no visible text or logos."
- **Alt text:** Inherits the caller's own `alt` prop (e.g. `"{Service name} treatment"`)
- **Above the fold:** Not fixed — only rendered on image-load failure, in the same position as the primary service image
- **Loading:** Eager (fallback swap happens client-side immediately after the primary image errors)

### 61. placeholder-avatar.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/placeholders/placeholder-avatar.jpg.txt`
- **Intended final filename:** `placeholder-avatar.jpg`
- **Intended output path:** `frontend/public/images/allay/placeholders/placeholder-avatar.jpg`
- **Used in:** `imagePaths.placeholders.avatar` — used in `Home.jsx` as the `onError` fallback `src` for testimonial customer profile images
- **Section/service represented:** Generic client avatar fallback (testimonials section)
- **Required aspect ratio:** 1:1 square
- **Recommended dimensions:** 600x600px, JPG
- **Full image-generation prompt:** "A minimalist, abstract avatar placeholder: a soft gradient circle in warm sage-to-cream tones with a simple subtle silhouette icon in the center, flat and understated design, no facial features or identifiable person, no text or logos. Suitable as a generic client avatar fallback for a beauty and wellness brand."
- **Alt text:** `""` (decorative — code renders it with `alt=""` on the testimonial `<img>` since the avatar is purely illustrative)
- **Above the fold:** No (testimonials section sits well below the homepage hero)
- **Loading:** Eager (fallback swap happens client-side immediately after the primary avatar image errors)

### 62. placeholder-empty.jpg.txt
- **Placeholder file:** `frontend/public/images/allay/placeholders/placeholder-empty.jpg.txt`
- **Intended final filename:** `placeholder-empty.jpg`
- **Intended output path:** `frontend/public/images/allay/placeholders/placeholder-empty.jpg`
- **Used in:** `imagePaths.placeholders.empty` — defined but not yet wired into any component; reserved for generic empty-state illustrations (e.g. "no bookings yet", "no results found")
- **Section/service represented:** Generic empty-state fallback
- **Required aspect ratio:** 4:3 landscape
- **Recommended dimensions:** 1200x900px, JPG
- **Full image-generation prompt:** "A minimalist, abstract empty-state illustration in a warm neutral palette (sage, mauve, stone, cream): a single simple line-art object such as an empty vase or an open book on a soft gradient background, plenty of negative space, calm and unobtrusive. No text, no logos, suitable as a generic 'nothing here yet' illustration for a beauty and wellness admin/booking interface."
- **Alt text:** `"No results to show"`
- **Above the fold:** Not fixed — depends on where the empty state is triggered; typically appears inline within a content area, not as a full hero
- **Loading:** Lazy

### 63. placeholder-logo.png.txt
- **Placeholder file:** `frontend/public/images/allay/placeholders/placeholder-logo.png.txt`
- **Intended final filename:** `placeholder-logo.png`
- **Intended output path:** `frontend/public/images/allay/placeholders/placeholder-logo.png`
- **Used in:** `imagePaths.placeholders.logo` — defined but not currently wired into `Logo.jsx` (which instead falls back to a text-only lockup, `<span className="logo__fallback">`, on image error); reserved generic logo fallback
- **Section/service represented:** Generic logo fallback
- **Required aspect ratio:** 1:1 square
- **Recommended dimensions:** 512x512px, transparent background, PNG
- **Full image-generation prompt:** "A minimalist placeholder icon: a simple circular outline containing a small abstract flower or leaf glyph, warm stone-gray line color, on a fully transparent background. Flat, understated, generic enough to serve as a logo-loading fallback, no text, no brand-specific detail."
- **Alt text:** `""` (decorative logo fallback)
- **Above the fold:** Not fixed — would appear wherever `Logo` is rendered (header is above the fold; footer is not)
- **Loading:** Eager (fallback swap happens client-side immediately after the primary logo image errors)

---

## Summary table

| # | Placeholder | Section | Dimensions | Above fold | Loading |
| - | --- | --- | --- | --- | --- |
| 1 | allay-logo-dark.png.txt | brand | 800x300 | No | lazy |
| 2 | allay-logo-light.png.txt | brand | 800x300 | Yes | eager |
| 3 | allay-mark.png.txt | brand | 512x512 | N/A | lazy |
| 4 | favicon.png.txt | brand | 512x512 | N/A | eager |
| 5 | home-hero-secondary.jpg.txt | home | 1800x1200 | Yes* | eager* |
| 6 | home-hero-detail.jpg.txt | home | 1800x1200 | Yes* | eager* |
| 7 | home-experience-section.jpg.txt | home | 1800x1200 | No | lazy |
| 8 | category-spa.jpg.txt | categories | 1200x900 | No | lazy |
| 9 | category-pilates.jpg.txt | categories | 1200x900 | No | lazy |
| 10 | category-nail-studio.jpg.txt | categories | 1200x900 | No | lazy |
| 11 | category-lash-studio.jpg.txt | categories | 1200x900 | No | lazy |
| 12 | category-salon.jpg.txt | categories | 1200x900 | No | lazy |
| 13 | category-facials.jpg.txt | categories | 1200x900 | No | lazy |
| 14 | category-massage.jpg.txt | categories | 1200x900 | No | lazy |
| 15 | category-sauna.jpg.txt | categories | 1200x900 | No | lazy |
| 16 | category-headspa.jpg.txt | categories | 1200x900 | No | lazy |
| 17 | category-hair-braiding.jpg.txt | categories | 1200x900 | No | lazy |
| 18 | category-wigs.jpg.txt | categories | 1200x900 | No | lazy |
| 19 | about-hero.jpg.txt | about | 1800x1200 | Yes | eager |
| 20 | about-interior.jpg.txt | about | 1800x1200 | No | lazy |
| 21 | about-care.jpg.txt | about | 1800x1200 | No | lazy |
| 22 | about-brand-story.jpg.txt | about | 1800x1200 | No | lazy |
| 23 | contact-hero.jpg.txt | contact | 1800x1200 | Yes | eager |
| 24 | contact-location.jpg.txt | contact | 1800x1200 | No | lazy |
| 25 | contact-interior.jpg.txt | contact | 1800x1200 | No | lazy |
| 26 | auth-signin.jpg.txt | auth | 1200x1600 | Yes | eager |
| 27 | auth-signup.jpg.txt | auth | 1200x1600 | Yes | eager |
| 28 | admin-login-bg.jpg.txt | auth | 1200x1600 | Yes | eager |
| 29 | auth-side.jpg.txt | auth | 1200x1600 | Yes* | eager* |
| 30 | waitlist-hero.jpg.txt | waitlist | 1800x1200 | Yes | eager |
| 31 | waitlist-side.jpg.txt | waitlist | 1800x1200 | No | lazy |
| 32 | waitlist-success.jpg.txt | waitlist | 1800x1200 | Yes* | lazy |
| 33 | booking-hero.jpg.txt | booking | 1800x1200 | No | lazy |
| 34 | booking-side.jpg.txt | booking | 1800x1200 | No | lazy |
| 35 | booking-success.jpg.txt | booking | 1800x1200 | Yes* | eager* |
| 36 | booking-empty.jpg.txt | booking | 1800x1200 | Yes | eager |
| 37 | service-swedish-massage.jpg.txt | services | 1200x800 | No/Yes** | lazy/eager** |
| 38 | service-deep-tissue-massage.jpg.txt | services | 1200x800 | No/Yes** | lazy/eager** |
| 39 | service-aromatherapy-massage.jpg.txt | services | 1200x800 | No/Yes** | lazy/eager** |
| 40 | service-classic-facial.jpg.txt | services | 1200x800 | No/Yes** | lazy/eager** |
| 41 | service-hydrating-facial.jpg.txt | services | 1200x800 | No/Yes** | lazy/eager** |
| 42 | service-glow-facial.jpg.txt | services | 1200x800 | No/Yes** | lazy/eager** |
| 43 | service-sauna-session.jpg.txt | services | 1200x800 | No/Yes** | lazy/eager** |
| 44 | service-headspa-treatment.jpg.txt | services | 1200x800 | No/Yes** | lazy/eager** |
| 45 | service-classic-manicure.jpg.txt | services | 1200x800 | No/Yes** | lazy/eager** |
| 46 | service-classic-pedicure.jpg.txt | services | 1200x800 | No/Yes** | lazy/eager** |
| 47 | service-gel-polish.jpg.txt | services | 1200x800 | No/Yes** | lazy/eager** |
| 48 | service-nail-art.jpg.txt | services | 1200x800 | No/Yes** | lazy/eager** |
| 49 | service-lash-extensions.jpg.txt | services | 1200x800 | No/Yes** | lazy/eager** |
| 50 | service-lash-lift.jpg.txt | services | 1200x800 | No/Yes** | lazy/eager** |
| 51 | service-brow-shaping.jpg.txt | services | 1200x800 | No/Yes** | lazy/eager** |
| 52 | service-hair-styling.jpg.txt | services | 1200x800 | No/Yes** | lazy/eager** |
| 53 | service-hair-braiding.jpg.txt | services | 1200x800 | No/Yes** | lazy/eager** |
| 54 | service-wig-installation.jpg.txt | services | 1200x800 | No/Yes** | lazy/eager** |
| 55 | service-wig-styling.jpg.txt | services | 1200x800 | No/Yes** | lazy/eager** |
| 56 | service-private-pilates.jpg.txt | services | 1200x800 | No/Yes** | lazy/eager** |
| 57 | service-group-pilates.jpg.txt | services | 1200x800 | No/Yes** | lazy/eager** |
| 58 | placeholder-hero.jpg.txt | placeholders | 1800x1200 | Fallback-only | eager |
| 59 | placeholder-category.jpg.txt | placeholders | 1200x900 | No | lazy |
| 60 | placeholder-service.jpg.txt | placeholders | 1200x800 | Fallback-only | eager |
| 61 | placeholder-avatar.jpg.txt | placeholders | 600x600 | No | eager |
| 62 | placeholder-empty.jpg.txt | placeholders | 1200x900 | Not fixed | lazy |
| 63 | placeholder-logo.png.txt | placeholders | 512x512 | Not fixed | eager |

`*` = reserved/not yet rendered in current code; fold position and loading are recommendations for when the image is wired in.
`**` = "No" + lazy applies to the `ServiceCard` grid thumbnail (`Services.jsx`); "Yes" + eager applies when the same image is the primary image on that service's own `ServiceDetail` page.
