// Authoritative Allay House service catalogue supplied on 17 August 2026.
// `duration` is an internal scheduling value when the supplied menu did not
// advertise one. `durationLabel` is only set for explicitly supplied times.

function slugify(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function svc(fields) {
  const priceOptions = fields.priceOptions?.map(Number).filter((value) => value > 0) || null
  return {
    priceFrom: priceOptions?.length ? Math.min(...priceOptions) : null,
    priceTo: priceOptions?.length ? Math.max(...priceOptions) : null,
    priceIsFrom: false,
    priceUnitLabel: null,
    priceOptions,
    durationLabel: null,
    serviceType: null,
    isAddon: false,
    isCouples: false,
    sessionCount: null,
    ...fields,
  }
}

function serviceGroup({ categorySlug, name, duration = 60, entries, defaults = {} }) {
  return entries.map(([serviceName, price, options = {}], index) => {
    const short = options.short || `${name} at Allay House.`
    return svc({
      categorySlug,
      serviceGroup: name,
      name: serviceName,
      price,
      duration: options.duration || duration,
      order: index + 1,
      short,
      description: options.description || short,
      ...defaults,
      ...options,
    })
  })
}

const rawServices = [
  ...serviceGroup({
    categorySlug: 'signature-experiences', name: 'Signature Experiences', duration: 180,
    defaults: { serviceType: 'signature' },
    entries: [
      ['Allay House Signature Ritual', 195000, { duration: 240, description: 'Head Spa + Massage + Hammam + Pedicure + Healthy Refreshment' }],
      ['Ultimate Wellness Escape', 175000, { duration: 240, description: 'Massage + Facial + Hammam + Sauna + Body Scrub + Healthy Refreshments' }],
      ['Couples Escape', 250000, { isCouples: true, description: 'A shared journey of relaxation and connection.' }],
      ['Mum-to-Be Wellness Ritual', 150000, { description: 'Gentle care for mothers-to-be.' }],
      ['Bridal Wellness Ritual', 190000, { description: 'Glow in every moment.' }],
      ['Birthday Wellness Experience', 170000, { description: 'Celebrate with self-care.' }],
      ['Friends Wellness Day', 120000, { priceUnitLabel: 'per person', description: 'Wellness is better together.' }],
      ['Corporate Wellness Experience', 110000, { priceUnitLabel: 'per person', description: 'Recharge. Refocus. Reconnect.' }],
    ],
  }),
  ...serviceGroup({
    categorySlug: 'headspa', name: 'Japanese Head Spa',
    entries: [
      ['Express Head Spa', 48000, { duration: 30, durationLabel: '30 mins' }],
      ['Signature Head Spa', 68000, { duration: 60, durationLabel: '60 mins' }],
      ['Premium Head Spa', 95000, { duration: 90, durationLabel: '90 mins' }],
      ['Luxury Japanese Head Spa Experience', 115000, { duration: 90 }],
    ],
  }),
  ...serviceGroup({
    categorySlug: 'headspa', name: 'Head Spa Add-ons', duration: 20, defaults: { isAddon: true },
    entries: [['Hair Analysis', 15000], ['Hair Growth Treatment', 18000], ['LED Scalp Therapy', 20000], ['Deep Hydration Therapy', 20000], ['Extended Massage Time', 15000], ['Aromatherapy Upgrade', 10000]],
  }),
  ...serviceGroup({
    categorySlug: 'massage', name: 'Massage Rituals — Relaxation',
    entries: [
      ['Swedish Massage (60 mins)', 68000, { duration: 60, durationLabel: '60 mins' }],
      ['Swedish Massage (90 mins)', 100000, { duration: 90, durationLabel: '90 mins' }],
      ['Bali Massage (60 mins)', 78000, { duration: 60, durationLabel: '60 mins' }],
      ['Bali Massage (90 mins)', 115000, { duration: 90, durationLabel: '90 mins' }],
      ['Aromatherapy Massage (60 mins)', 78000, { duration: 60, durationLabel: '60 mins' }],
      ['Aromatherapy Massage (90 mins)', 115000, { duration: 90, durationLabel: '90 mins' }],
      ['Relaxation Massage (60 mins)', 65000, { duration: 60, durationLabel: '60 mins' }],
      ['Relaxation Massage (90 mins)', 95000, { duration: 90, durationLabel: '90 mins' }],
      ['Signature Allay Massage (60 mins)', 85000, { duration: 60, durationLabel: '60 mins' }],
      ['Signature Allay Massage (90 mins)', 125000, { duration: 90, durationLabel: '90 mins' }],
    ],
  }),
  ...serviceGroup({
    categorySlug: 'massage', name: 'Massage Rituals — Therapeutic',
    entries: [['Deep Tissue Massage', 78000], ['Thai Massage', 95000], ['Sports Massage', 95000], ['Hot Stone Massage', 95000], ['Reflexology', 72000], ['Head, Neck & Shoulder Massage', 65000], ['Face Massage', 55000], ['Pregnancy Massage', 85000], ['Lymphatic Drainage Massage', 75000], ['Couples Massage', 170000, { isCouples: true }]],
  }),
  ...serviceGroup({ categorySlug: 'massage', name: 'Premium Massage Experiences', entries: [['Four Hands Massage', 140000], ['Hot Stone Massage for Two', 150000, { isCouples: true }]] }),
  ...serviceGroup({ categorySlug: 'massage', name: 'Massage Add-ons', duration: 15, defaults: { isAddon: true }, entries: [['CBD Balm', 15000], ['Aromatherapy Oils', 10000], ['Hot Stones', 10000], ['Scalp Massage', 15000], ['Foot Scrub', 8000]] }),
  ...serviceGroup({
    categorySlug: 'body-beauty', name: 'Hammam Rituals',
    entries: [['Traditional Hammam', 75000], ['Deluxe Moroccan Hammam', 115000], ['Brightening Hammam', 125000], ['Hammam + Massage', 140000, { duration: 120 }], ['Hammam + Facial', 110000, { duration: 120 }], ['Hammam + Massage + Facial', 168000, { duration: 180 }], ['Couples Hammam Experience', 165000, { duration: 90, isCouples: true }]],
  }),
  ...serviceGroup({ categorySlug: 'sauna', name: 'Sauna & Steam', duration: 30, entries: [['Traditional Sauna', 30000], ['Steam Room', 25000], ['Sauna + Cold Shower Ritual', 35000], ['Steam + Massage Ritual', 85000, { duration: 90 }]] }),
  ...serviceGroup({
    categorySlug: 'body-beauty', name: 'Body Sculpting',
    entries: [['Wood Therapy', 60000], ['Lymphatic Drainage', 50000], ['Radio Frequency Skin Tightening', 75000], ['Cavitation', 65000], ['EMS Body Sculpt', 85000], ['EMS ZeroSculpt', 98000], ['EMS Toning', 75000], ['Waist Sculpt Programme', 75000], ['Arm Sculpt', 45000], ['Thigh Sculpt', 65000], ['Bum Lift Programme', 70000], ['Tummy Sculpt', 65000], ['Full Body Sculpt Programme', 125000, { duration: 90 }]],
  }),
  ...serviceGroup({ categorySlug: 'facials', name: 'Chemical Peels', entries: [['Lactic Peel', 130000], ['Mandelic Peel', 130000], ['Melanostop Peel', 160000], ['Melano Plus Peel', 160000], ['Blemiderm Peel', 130000], ['Meso Peel', 130000], ['Depigmentation Peel', 130000]] }),
  ...serviceGroup({ categorySlug: 'facials', name: 'Advanced Skin Treatments', duration: 75, entries: [['Microneedling (Anti-Ageing)', 225000], ['Microneedling (Pigmentation)', 225000], ['Microneedling (Stretch Marks)', 225000]] }),
  ...serviceGroup({ categorySlug: 'facials', name: 'Specialist Facials', entries: [['Underarm Facial', 75000], ['Prenatal Facial', 98000], ['Basic Vajacial', 85000], ['Pigmentation Vajacial', 95000]] }),
  ...serviceGroup({ categorySlug: 'facials', name: 'Facial Add-ons', duration: 20, defaults: { isAddon: true }, entries: [['LED Therapy', 20000], ['Eye Treatment', 18000], ['Lip Treatment', 18000], ['High Frequency', 20000], ['Scalp Massage', 10000], ['Neck & Shoulder Massage', 15000]] }),

  ...serviceGroup({
    categorySlug: 'allay-salon', name: 'Wash & Styling',
    entries: [
      ['Wash & Blow Dry', 15000], ['Wash & Silk Press', 18000], ['Wash, Blow Dry & Flat Iron', 22000], ['Wash & Curl Styling', 20000], ['Wash & Roller Set', 20000], ['Wash & Finger Coils', 25000], ['Wash & Style (Natural Hair)', 18000], ['Wash & Weave', 25000, { duration: 90 }], ['Wash & Cornrows', 18000, { duration: 90 }], ['Blow Dry Only', 10000], ['Silk Press Only', 15000], ['Wig Styling', 10000], ['Wig Refresh / Revamp', 30000, { duration: 90 }], ['Bridal Hair Styling', 60000, { priceFrom: 60000, priceIsFrom: true, duration: 150 }], ['Event Hairstyling', 35000, { priceFrom: 35000, priceIsFrom: true, duration: 120 }],
    ],
  }),
  ...serviceGroup({
    categorySlug: 'allay-salon', name: 'Hair Treatments', duration: 45,
    entries: [['Hair Consultation', 10000], ['Hair Analysis', 15000], ['Scalp Detox Treatment', 20000], ['Deep Moisture Treatment', 20000], ['Protein Treatment', 25000], ['Bond Repair Treatment', 30000], ['Steam Therapy', 15000], ['Hydration Therapy', 25000], ['Hair Growth Treatment', 20000], ['Anti-Breakage Treatment', 25000], ['Olaplex / Bond Builder Treatment', 35000], ['Scalp Exfoliation', 15000], ['Split-End Trim with Treatment', 15000]],
  }),
  ...serviceGroup({
    categorySlug: 'allay-salon', name: 'Hair Colour Services', duration: 120,
    entries: [
      ['Root Touch-up', 25000], ['Low Cut Colour', 35000], ['Short Hair Colour (Single Process)', 35000], ['Short Hair Colour (Double Process)', 48000], ['Medium Hair Colour (Single Process)', 45000], ['Medium Hair Colour (Double Process)', 60000], ['Long Hair Colour (Single Process)', 55000, { duration: 150 }], ['Long Hair Colour (Double Process)', 68000, { duration: 180 }], ['Extra Long Hair Colour', 85000, { duration: 210 }], ['Full Wig Bleaching', 120000, { duration: 180 }], ['Highlights', 125000, { duration: 180 }], ['Balayage', 135000, { duration: 210 }], ['Ombre', 130000, { duration: 210 }], ['Toner', 70000], ['Gloss Treatment', 35000], ['Bundle Colour', 3000, { priceUnitLabel: 'per bundle' }], ['Wig Colour Transformation', 180000, { priceFrom: 180000, priceIsFrom: true, duration: 240 }], ['Colour Correction', 180000, { priceFrom: 180000, priceIsFrom: true, duration: 240 }],
    ],
  }),
  ...serviceGroup({ categorySlug: 'hair-wigs', name: 'Wig Services — Installation', duration: 120, entries: [['Frontal Wig Install', 60000], ['Closure Wig Install', 45000], ['Glueless Wig Install', 50000], ['Ponytail Wig Install', 55000], ['Wig Reinstallation', 30000, { duration: 90 }]] }),
  ...serviceGroup({
    categorySlug: 'hair-wigs', name: 'Wig Services — Maintenance', duration: 75,
    entries: [['Wig Wash', 28000], ['Lace Wash', 10000], ['Wig Styling', 10000], ['Wig Refresh', 20000], ['Short Wig Revamp', 25000, { duration: 90 }], ['Long Wig Revamp', 35000, { duration: 120 }], ['Pixie Wig Revamp', 30000, { duration: 90 }], ['Wig Reconstruction', 45000, { duration: 150 }], ['Wig Customization', 8000], ['Wig Layering', 20000], ['Wig Trimming', 10000], ['Lace Cutting / Customization', 15000], ['Clip-in Installation', 18000]],
  }),
  ...serviceGroup({
    categorySlug: 'hair-wigs', name: 'Sew-in Services', duration: 150,
    entries: [['Traditional Sew-in', 45000], ['Half Sew-in', 35000], ['Flip-over Sew-in', 65000], ['Invisible Sew-in', 95000, { duration: 180 }], ['Half Stitch & Half Sew-in', 55000], ['Quick Weave', 15000, { duration: 90 }], ['Ponytail Install (Without Hair)', 25000, { duration: 90 }], ['Weaving Only', 15000, { duration: 90 }], ['Weaving with Design', 25000, { duration: 120 }], ['Weaving with Attachment', 30000, { duration: 120 }]],
  }),
  ...serviceGroup({
    categorySlug: 'hair-wigs', name: 'Braids — Goddess Braids', duration: 300,
    entries: [['Goddess Braids — Bob Length', 30000, { priceOptions: [48000, 35000, 30000] }], ['Goddess Braids — Shoulder Length', 38000, { priceOptions: [53500, 42700, 38000] }], ['Goddess Braids — Bra Length', 44500, { priceOptions: [57000, 47000, 44500] }], ['Goddess Braids — Waist Length', 49000, { priceOptions: [61700, 52500, 49000], duration: 360 }], ['Goddess Braids — Bum Bum Length', 53200, { priceOptions: [67000, 58000, 53200], duration: 420 }], ['Goddess Braids — Extra Long', 65000, { priceOptions: [85000, 70000, 65000], duration: 480 }]],
  }),
  ...serviceGroup({ categorySlug: 'hair-wigs', name: 'Knotless Braids', duration: 300, entries: [['Knotless Braids — Bob Length', 26000, { priceOptions: [45000, 42000, 26000] }], ['Knotless Braids — Shoulder Length', 70000], ['Knotless Braids — Bra Length', 80000], ['Knotless Braids — Waist Length', 90000, { duration: 360 }], ['Knotless Braids — Bum Length', 100000, { duration: 420 }], ['Knotless Braids — Extra Long', 120000, { duration: 480 }]] }),
  ...serviceGroup({ categorySlug: 'hair-wigs', name: 'Traditional Braids', duration: 300, entries: [['Traditional Braids — Bob Length', 45000], ['Traditional Braids — Shoulder Length', 55000], ['Traditional Braids — Bra Length', 65000], ['Traditional Braids — Waist Length', 75000, { duration: 360 }], ['Traditional Braids — Bum Length', 85000, { duration: 420 }], ['Traditional Braids — Extra Long', 105000, { duration: 480 }]] }),
  ...serviceGroup({ categorySlug: 'hair-wigs', name: 'Braids — Stitch & Feed-in', duration: 180, entries: [['Straight Back', 25000], ['Stitch & Feed-in — 2 Lines', 30000], ['Stitch & Feed-in — 4 Lines', 35000], ['Stitch & Feed-in — 6 Lines', 40000], ['Stitch & Feed-in — 8 Lines', 45000]] }),
  ...serviceGroup({ categorySlug: 'hair-wigs', name: 'Feed-in Braids', duration: 240, entries: [['Feed-in Braids — Bra Length', 55000], ['Feed-in Braids — Waist Length', 75000], ['Feed-in Braids — Bum Length', 85000, { duration: 300 }], ['Ponytail Feed-ins', 80000], ['Half Feeding', 50000]] }),
  ...serviceGroup({ categorySlug: 'hair-wigs', name: 'Boho Braids', duration: 300, entries: [['Boho Braids Without Curls', 80000], ['Boho Braids with Human Hair Curls', 110000], ['Boho Braids with Synthetic Curls', 90000]] }),
  ...serviceGroup({ categorySlug: 'hair-wigs', name: 'Other Braids', duration: 240, entries: [['French Curl Braids', 85000], ['Feather Braids', 85000], ['Ghana Weaving', 55000], ['Shuku Braids', 55000], ['Shuku with Design', 65000], ['Cornrows', 20000, { duration: 120 }], ['Invisible Cornrows', 35000, { duration: 150 }], ['Tiny Braids', 100000, { duration: 420 }], ['Didi', 15000, { duration: 120 }], ['Didi with Attachment', 18000, { duration: 150 }]] }),
  ...serviceGroup({ categorySlug: 'hair-wigs', name: 'Natural Hair', duration: 75, entries: [['Wash & Go', 18000], ['Twist Out', 22000], ['Braid Out', 22000], ['Flat Twist', 25000, { duration: 120 }], ['Two-Strand Twist', 25000, { duration: 120 }], ['Mini Twists', 30000, { duration: 180 }], ['Afro Styling', 18000], ['Blow Out (Natural Hair)', 18000], ['Silk Press (Natural Hair)', 22000], ['Natural Hair Trim', 13000, { duration: 45 }]] }),
  ...serviceGroup({ categorySlug: 'hair-wigs', name: 'Loc Services', duration: 120, entries: [['Starter Locs', 45000, { duration: 180 }], ['Instant Locs', 55000, { duration: 180 }], ['Loc Retwist', 25000], ['Loc Styling', 20000], ['Loc Detox', 20000], ['Interlocking', 30000], ['Loc Colour', 45000, { duration: 150 }], ['Loc Repair', 30000]] }),
  ...serviceGroup({ categorySlug: 'hair-wigs', name: 'Take-out Services', entries: [['Frontal Removal', 8000], ['Closure Removal', 5000], ['Sew-in Removal', 12500], ['Cornrow Removal', 8000], ['Stitch Braids Removal', 20000, { duration: 90 }], ['Knotless Braids Removal', 25000, { duration: 120 }], ['Boho Braids Removal', 25000, { duration: 120 }], ['Twist Removal', 15000, { duration: 90 }], ['Crochet Removal', 15000, { duration: 90 }], ['Loc Removal', 20000, { duration: 120 }]] }),

  ...serviceGroup({ categorySlug: 'allay-pilates', name: 'Pilates Session Options', duration: 50, entries: [['Group Class (Minimum 4 People)', 25000, { priceUnitLabel: 'per person' }], ['Private Pilates Session', 65000, { priceFrom: 65000, priceTo: 75000 }], ['Duet Pilates Session (2 People)', 90000, { description: '₦45,000 per person; ₦90,000 total for two people.', isCouples: true }]] }),
  ...serviceGroup({
    categorySlug: 'allay-pilates', name: 'Pilates Membership Plans', duration: 50, defaults: { serviceType: 'package' },
    entries: [['The Essential — 4 Classes Monthly', 90000, { sessionCount: 4, description: '4 Reformer Classes • Valid for 30 Days • Advance Booking Required' }], ['The Balance — 8 Classes Monthly', 175000, { sessionCount: 8, description: '8 Reformer Classes • Valid for 30 Days • Priority Booking • 1 Guest Pass' }], ['The Ultimate Lifestyle — 12 Classes Monthly', 250000, { sessionCount: 12, description: '12 Reformer Classes • Valid for 30 Days • Priority Booking • 1 Guest Pass Monthly • 10% Off Add-on Services' }]],
  }),
  ...serviceGroup({ categorySlug: 'allay-pilates', name: 'Pilates + Wellness Packages', duration: 150, defaults: { serviceType: 'package', priceUnitLabel: 'per person' }, entries: [['Pilates Reset', 85000, { description: 'Reformer Class + Head Spa + Healthy Smoothie' }], ['Pilates Recovery', 105000, { description: 'Reformer Class + 60-Minute Massage + Wellness Tea or Smoothie' }], ['Wellness Morning', 120000, { duration: 180, description: 'Reformer + Traditional Hammam Bath + Pedicure + Healthy Lunch' }], ['Allay Reset', 180000, { duration: 240, description: 'Reformer + Hydrofacial + Massage + Healthy Lunch' }]] }),

  ...serviceGroup({ categorySlug: 'allay-nail-studio', name: 'Manicures', entries: [['Basic Manicure (Nail Prep)', 14500], ['Basic Manicure + Regular Polish', 19500], ['Basic Manicure + Gel Polish', 25000], ['Russian Manicure', 22000], ['Russian Manicure + Regular Polish', 27000], ['Russian Manicure + Gel Polish', 32500], ['Silk Touch Manicure', 25000], ['Silk Touch Manicure + Regular Polish', 30000], ['Silk Touch Manicure + Gel Polish', 35000], ['Regular Polish on Nails', 9500, { duration: 30 }], ['Gel Polish on Nails', 15500, { duration: 45 }], ['Nail Trimming', 5000, { duration: 20 }]] }),
  ...serviceGroup({ categorySlug: 'allay-nail-studio', name: 'BIAB', duration: 90, entries: [['Builder Gel on Natural Nails (BIAB)', 32000], ['BIAB with Extension', 38000], ['Russian Manicure + BIAB (Natural Nails)', 48000], ['Russian Manicure + BIAB (Extensions)', 54500], ['BIAB Refill', 32000], ['BIAB Patch & Polish', 20000, { duration: 60 }], ['BIAB Repair (Natural Nail)', 4500, { duration: 20, priceUnitLabel: 'per nail' }], ['BIAB Repair (Extension)', 6500, { duration: 20, priceUnitLabel: 'per nail' }]] }),
  ...serviceGroup({ categorySlug: 'allay-nail-studio', name: 'Hard Gel', duration: 105, entries: [['Hard Gel Underlay', 52000], ['Hard Gel on Natural Nails', 42000], ['Hard Gel Overlay on Extensions', 46500], ['Russian Manicure + Hard Gel Underlay', 72500], ['Russian Manicure + Hard Gel (Natural Nails)', 62500], ['Hard Gel Refill', 36000, { duration: 90 }], ['Hard Gel Patch & Polish', 22500, { duration: 60 }], ['Hard Gel Underlay Repair', 10000, { duration: 25, priceUnitLabel: 'per finger' }], ['Hard Gel Overlay Repair', 8500, { duration: 25, priceUnitLabel: 'per finger' }]] }),
  ...serviceGroup({ categorySlug: 'allay-nail-studio', name: 'Polygel', duration: 105, entries: [['Polygel Underlay', 55000], ['Russian Manicure + Polygel Underlay', 75500], ['Polygel Refill', 39500, { duration: 90 }], ['Polygel Patch & Polish', 25000, { duration: 60 }], ['Polygel Repair', 12000, { duration: 25, priceUnitLabel: 'per finger' }]] }),
  ...serviceGroup({ categorySlug: 'allay-nail-studio', name: 'Hybrid Gel', duration: 105, entries: [['Hybrid Gel Extension', 42500], ['Russian Manicure + Hybrid Extension', 61500], ['Hybrid Refill', 33500, { duration: 90 }], ['Hybrid Patch & Polish', 20000, { duration: 60 }], ['Hybrid Repair', 8500, { duration: 25, priceUnitLabel: 'per finger' }]] }),
  ...serviceGroup({ categorySlug: 'allay-nail-studio', name: 'Gel-X', duration: 90, entries: [['Gel X Full Set', 32000], ['Gel X + Russian Manicure', 52500], ['Gel X Refill', 27000], ['Gel X Patch & Polish', 20000, { duration: 60 }], ['Gel X Repair', 4500, { duration: 20, priceUnitLabel: 'per finger' }]] }),
  ...serviceGroup({ categorySlug: 'allay-nail-studio', name: 'UV Stick-On Nails', duration: 75, entries: [['UV Stick-On Nails', 12000, { priceFrom: 12000, priceTo: 27000 }], ['Russian Manicure + UV Stick-On', 32000], ['UV Stick-On Patch & Polish', 20000, { duration: 60 }], ['UV Stick-On Repair', 4500, { duration: 20, priceUnitLabel: 'per finger' }]] }),
  ...serviceGroup({ categorySlug: 'allay-nail-studio', name: 'Acrylic', duration: 105, entries: [['Acrylic Plain Short', 30000], ['Acrylic Plain Medium', 33500], ['Acrylic Plain Long', 38500, { duration: 120 }], ['Acrylic French', 38500], ['Acrylic Chrome', 42500], ['Acrylic Ombre', 42500], ['Acrylic Cat Eye', 42500], ['Acrylic Airbrush', 45000], ['Acrylic Refill', 22500, { duration: 75 }], ['Acrylic Repair', 5000, { duration: 20, priceUnitLabel: 'per finger' }], ['Acrylic Soak Off', 8500, { duration: 30 }]] }),
  ...serviceGroup({ categorySlug: 'allay-nail-studio', name: 'Press-On Nails', entries: [['Plain Press-On Set', 20000], ['French Press-On Set', 28500], ['Chrome Press-On Set', 42500], ['Cat Eye Press-On Set', 42500], ['Airbrush Press-On Set', 45000], ['Luxury Custom Press-On Set', 70000, { priceFrom: 70000, priceIsFrom: true }], ['Press-On Application', 22000]] }),
  ...serviceGroup({ categorySlug: 'allay-nail-studio', name: 'Soak-Offs & Repairs', duration: 30, entries: [['Gel Polish Soak Off', 6500], ['BIAB Soak Off', 8500], ['Acrylic Soak Off', 8500], ['Hard Gel / Acrylic Removal', 11000], ['Acrylic Removal + Manicure', 17000, { duration: 60 }], ['Anti-Fungal Nail Treatment', 13500, { duration: 45 }], ['Extension Repair', 3500, { duration: 20, priceUnitLabel: 'per finger' }]] }),
  ...serviceGroup({ categorySlug: 'allay-nail-studio', name: 'Pedicures', duration: 75, entries: [['Classic Pedicure (Women)', 29500], ['Classic Pedicure (Men)', 35000], ['Classic Pedicure (Children)', 18000, { duration: 60 }], ['Spa Pedicure (Women)', 38000], ['Spa Pedicure (Men)', 42000], ['Spa Pedicure (Children)', 22000, { duration: 60 }], ['Allay Paraffin Pedicure (Women)', 42000], ['Allay Paraffin Pedicure (Men)', 45000], ['Therapeutic (Chinese) Pedicure', 46000], ['Allay Special Pedicure', 48000], ['Jelly Pedicure', 44500], ['Dry Pedicure', 43000], ['Nail Trimming', 5000, { duration: 20 }], ['Foot Massage', 15000, { duration: 30 }]] }),
  ...serviceGroup({ categorySlug: 'allay-nail-studio', name: 'Mani & Pedi Packages', duration: 120, defaults: { serviceType: 'package' }, entries: [['Classic Mani-Pedi', 42000], ["Children's Mani-Pedi", 33000], ['Mani-Pedi + Regular Polish', 48500], ['Mani-Pedi + Gel Polish', 58500]] }),
  ...serviceGroup({
    categorySlug: 'allay-nail-studio', name: 'Toe Enhancements',
    entries: [['Regular Polish on Toes', 6000, { duration: 30 }], ['Regular Polish + Foot Massage', 18500], ['Gel Polish on Toes', 13500, { duration: 45 }], ['Gel Polish + Foot Massage', 20000], ['Russian Toe Pedicure', 18500], ['Russian Toe Pedicure + Regular Polish', 25500], ['Russian Toe Pedicure + Gel Polish', 29500], ['One Big Toe Extension', 3500, { duration: 20 }], ['Small Toe Extension', 1000, { duration: 15, priceUnitLabel: 'per toe' }], ['Full Toe Extension', 13500], ['BIAB on Two Big Toes', 10000], ['BIAB on All Toes', 24000], ['BIAB Big Toe Extensions', 24000], ['Hybrid on Two Big Toes', 11000], ['Hybrid on All Toes', 32000], ['Hard Gel on One Big Toe', 6500, { duration: 20 }], ['Hard Gel on Two Big Toes', 12000], ['Polygel on One Big Toe', 6500, { duration: 20 }], ['Polygel on Two Big Toes', 11000], ['Polygel on All Toes', 32000]],
  }),
  ...serviceGroup({
    categorySlug: 'allay-nail-studio', name: 'Nail Art & Add-ons', duration: 30, defaults: { isAddon: true },
    entries: [['French Tips', 8500], ['Coloured Tips', 9500], ['Patterned Tips', 9000], ['Half French Tips', 14500], ['Chrome Finish', 13500], ['Chrome Tips', 10500], ['Chrome', 12500, { priceUnitLabel: 'per nail' }], ['Cat Eye Finish', 13500], ['Cat Eye', 12500, { priceUnitLabel: 'per nail' }], ['Ombre Finish', 10500], ['Ombre', 10500, { priceUnitLabel: 'per nail' }], ['Nude Gradient', 8500], ['Glitter Finish', 8500], ['Blooming Gel', 10000], ['Syrup Nails', 10000], ['Full Nail Art', 15000], ['Half Nail Art', 10500], ['Nail Art', 12000, { priceUnitLabel: 'per finger' }], ['3D Nail Art', 15000], ['Nail Stickers/Decals (Small)', 1000], ['Nail Stickers/Decals (Large)', 1000], ['Rhinestones (Small)', 1000], ['Rhinestones (Large)', 2000], ['Charms', 2000, { priceUnitLabel: 'per nail' }], ['Pearls', 2000, { priceUnitLabel: 'per nail' }], ['Foil Accent', 500, { priceUnitLabel: 'per nail' }]],
  }),
  ...serviceGroup({ categorySlug: 'allay-nail-studio', name: 'Signature Nail Experiences', duration: 120, defaults: { serviceType: 'signature' }, entries: [['Signature Luxury Manicure', 30000, { duration: 75 }], ['Signature Luxury Pedicure', 50000, { duration: 90 }], ['Luxury Hands & Feet Experience', 75000, { duration: 150 }], ['Bridal Nail Experience', 85000, { duration: 150 }], ['Bridal Party Nail Package', 250000, { priceFrom: 250000, priceIsFrom: true, duration: 240 }]] }),
]

const nameCounts = rawServices.reduce((counts, service) => {
  const key = slugify(service.name)
  counts.set(key, (counts.get(key) || 0) + 1)
  return counts
}, new Map())

export const officialServices = rawServices.map((service) => {
  const baseSlug = slugify(service.name)
  return { ...service, slug: nameCounts.get(baseSlug) > 1 ? slugify(`${service.name}-${service.serviceGroup}`) : baseSlug }
})

export const catalogueCategories = [
  { name: 'Facials', slug: 'facials', description: 'Specialist facials, peels, and advanced skin treatments.', displayOrder: 1 },
  { name: 'Massage', slug: 'massage', description: 'Relaxation, therapeutic, couples, and premium massage rituals.', displayOrder: 2 },
  { name: 'Sauna', slug: 'sauna', description: 'Sauna and steam rituals.', displayOrder: 3 },
  { name: 'Headspa', slug: 'headspa', description: 'Japanese head spa rituals and scalp add-ons.', displayOrder: 4 },
  { name: 'Allay Pilates', slug: 'allay-pilates', description: 'Reformer sessions, memberships, and wellness packages.', displayOrder: 5 },
  { name: 'Allay Salon', slug: 'allay-salon', description: 'Wash, styling, treatments, and colour services.', displayOrder: 6 },
  { name: 'Hair & Wigs', slug: 'hair-wigs', description: 'Wigs, sew-ins, braids, natural hair, locs, and take-out services.', displayOrder: 7 },
  { name: 'Allay Nail Studio', slug: 'allay-nail-studio', description: 'Manicures, pedicures, nail enhancements, and nail art.', displayOrder: 8 },
  { name: 'Body & Beauty', slug: 'body-beauty', description: 'Hammam rituals and body sculpting.', displayOrder: 9 },
  { name: 'Signature Experiences', slug: 'signature-experiences', description: 'Allay House wellness experiences for individuals, couples, friends, and teams.', displayOrder: 10 },
]

// Compatibility export for older scripts. The new importer safely archives
// every unlisted service because this catalogue is authoritative.
export const legacySeededServiceSlugs = ['signature-glow-facial', 'hydrating-facial', 'deep-tissue-massage', 'sauna-session', 'headspa-ritual', 'pilates-class', 'brow-shaping-tint', 'lash-lift-tint', 'hair-styling', 'braiding', 'premium-human-hair-wig-consultation', 'nail-care-session', 'body-scrub-polish']

// Existing lifestyle memberships stay. Pilates plans are catalogue services.
export const memberships = [
  { name: 'The Reset', slug: 'the-reset', tagline: 'A monthly wellness reset.', monthlyPrice: 250000, displayOrder: 1, isFeatured: false, description: 'A balanced monthly rhythm of beauty, hair, relaxation, and Pilates experiences.', terms: 'Benefits reset each month and do not roll over. Services are subject to availability.', benefits: ['1 Signature Japanese Head Spa', '1 Natural Hair Treatment', '1 Cornrow Styling', '1 Swedish Massage', '1 Traditional Hammam Ritual', '2 Reformer Pilates Classes', '1 Jelly Pedicure', 'Healthy refreshments during every visit', 'Priority booking', '10% off additional services', 'Birthday Wellness Day Treat'] },
  { name: 'The Ritual', slug: 'the-ritual', tagline: 'Wellness. Beauty. Balance.', monthlyPrice: 480000, displayOrder: 2, isFeatured: true, description: 'A premium monthly membership combining beauty treatments, wellness rituals, massage, and Pilates.', terms: 'Benefits reset each month and do not roll over. Services are subject to availability.', benefits: ['2 Signature Head Spa Treatments', '2 Natural Hair Treatments', '2 Cornrow Styling Sessions', '2 Premium Massages', '1 Deluxe Hammam Ritual', '8 Reformer Pilates Classes', '2 Jelly Pedicures', 'Unlimited healthy refreshments', 'Steam room access on every visit', '15% off additional services', 'Priority weekend booking', '1 complimentary Pilates guest pass every month', 'Birthday Wellness Day Treat'] },
  { name: 'The Sanctuary', slug: 'the-sanctuary', tagline: 'The ultimate Allay House lifestyle.', monthlyPrice: 850000, displayOrder: 3, isFeatured: false, description: 'The highest Allay House tier for frequent treatments, unlimited Pilates, and premium priority access.', terms: 'Benefits reset each month and do not roll over. Services are subject to availability.', benefits: ['4 Signature Head Spa Treatments', '4 Natural Hair Treatments', '4 Cornrow Styling Sessions', '4 Premium Massages', '1 Luxury Hammam Experience', 'Unlimited Reformer Pilates Classes', '2 Jelly Pedicures', 'Unlimited healthy refreshments', '20% off all additional services', 'VIP priority booking', 'Complimentary steam room access', 'Complimentary wellness consultation', 'Birthday Wellness Day Treat', 'One complimentary eligible guest service every month', '2 complimentary Pilates guest passes every month'] },
]

export const sharedMemberPerks = ['Dedicated members’ booking line', 'Priority waitlist for fully booked days', 'Complimentary Wi-Fi', 'Refreshments during every visit', 'Member-only pricing on retail products', 'Exclusive invitations to wellness events', 'Early access to new treatments', 'Flexible appointment rescheduling']
