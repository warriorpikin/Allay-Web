BEGIN;

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'active';

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS image_public_id TEXT,
  ADD COLUMN IF NOT EXISTS bookable BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE testimonials
  ADD COLUMN IF NOT EXISTS customer_role VARCHAR(160),
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_public_id TEXT;

UPDATE testimonials
SET image_url = COALESCE(image_url, profile_image_url)
WHERE profile_image_url IS NOT NULL;

ALTER TABLE testimonials
  ALTER COLUMN rating TYPE NUMERIC(2,1) USING rating::numeric,
  DROP CONSTRAINT IF EXISTS testimonials_rating_check,
  ADD CONSTRAINT testimonials_rating_check CHECK (rating >= 1 AND rating <= 5 AND rating * 2 = FLOOR(rating * 2));

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS discount_code_id UUID REFERENCES discount_codes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discount_code VARCHAR(80);

CREATE INDEX IF NOT EXISTS customers_created_at_idx ON customers (created_at DESC);
CREATE INDEX IF NOT EXISTS customers_last_login_idx ON customers (last_login_at DESC);
CREATE INDEX IF NOT EXISTS services_slug_idx ON services (slug);
CREATE INDEX IF NOT EXISTS services_active_display_idx ON services (is_active, display_order);
CREATE INDEX IF NOT EXISTS testimonials_active_display_idx ON testimonials (is_active, display_order);
CREATE INDEX IF NOT EXISTS bookings_discount_code_idx ON bookings (discount_code);

INSERT INTO service_categories (name, slug, description, display_order, is_active)
VALUES
  ('Facials', 'facials', 'Restorative skin rituals for glow, hydration, and calm.', 1, TRUE),
  ('Massage', 'massage', 'Bodywork and recovery treatments for deep release.', 2, TRUE),
  ('Sauna', 'sauna', 'Private heat rituals for reset and restoration.', 3, TRUE),
  ('Headspa', 'headspa', 'Scalp, steam, and hair-wellness rituals.', 4, TRUE),
  ('Allay Pilates', 'allay-pilates', 'Movement sessions for strength, alignment, and ease.', 5, TRUE),
  ('Allay Lash Studio', 'allay-lash-studio', 'Brows, lashes, and soft feature definition.', 6, TRUE),
  ('Allay Salon', 'allay-salon', 'Hair styling, braiding, and finishing services.', 7, TRUE),
  ('Hair & Wigs', 'hair-wigs', 'Premium human hair wig consultation and protective styling.', 8, TRUE),
  ('Allay Nail Studio', 'allay-nail-studio', 'Nail and cuticle care with a refined finish.', 9, TRUE),
  ('Body & Beauty', 'body-beauty', 'Polishing body treatments and beauty rituals.', 10, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  description = COALESCE(service_categories.description, EXCLUDED.description),
  display_order = COALESCE(service_categories.display_order, EXCLUDED.display_order);

INSERT INTO services (category_id, name, slug, description, duration_minutes, price, image_url, is_active, is_discount_eligible, simultaneous_capacity, display_order)
VALUES
  ((SELECT id FROM service_categories WHERE slug = 'facials'), 'Signature Glow Facial', 'signature-glow-facial', 'A radiance-focused ritual combining gentle renewal, hydration, and restorative massage.', 60, 20000, '/images/allay/services/service-glow-facial.jpg', TRUE, TRUE, 7, 1),
  ((SELECT id FROM service_categories WHERE slug = 'facials'), 'Hydrating Facial', 'hydrating-facial', 'Deep hydration and barrier support for skin that feels calm, soft, and replenished.', 60, 24000, '/images/allay/services/service-hydrating-facial.jpg', TRUE, TRUE, 7, 2),
  ((SELECT id FROM service_categories WHERE slug = 'massage'), 'Deep Tissue Massage', 'deep-tissue-massage', 'Focused therapeutic pressure for persistent tension, tired muscles, and fuller release.', 75, 30000, '/images/allay/services/service-deep-tissue-massage.jpg', TRUE, TRUE, 7, 3),
  ((SELECT id FROM service_categories WHERE slug = 'sauna'), 'Sauna Session', 'sauna-session', 'A quiet private heat ritual with generous time to settle before and after.', 45, 15000, '/images/allay/services/service-sauna-session.jpg', TRUE, TRUE, 7, 4),
  ((SELECT id FROM service_categories WHERE slug = 'headspa'), 'Headspa Ritual', 'headspa-ritual', 'Scalp cleansing, conditioning, steam, and slow massage in one sensory ritual.', 75, 35000, '/images/allay/services/service-headspa-treatment.jpg', TRUE, TRUE, 7, 5),
  ((SELECT id FROM service_categories WHERE slug = 'allay-pilates'), 'Pilates Class', 'pilates-class', 'A considered small-group class for alignment, control, strength, and balance.', 50, 18000, '/images/allay/services/service-group-pilates.jpg', TRUE, TRUE, 7, 6),
  ((SELECT id FROM service_categories WHERE slug = 'allay-lash-studio'), 'Brow Shaping + Tint', 'brow-shaping-tint', 'Measured shaping and soft tinting designed around your natural features.', 45, 15000, '/images/allay/services/service-brow-shaping.jpg', TRUE, TRUE, 7, 7),
  ((SELECT id FROM service_categories WHERE slug = 'allay-lash-studio'), 'Lash Lift + Tint', 'lash-lift-tint', 'A low-maintenance lift and tint for softly defined, naturally open lashes.', 60, 22000, '/images/allay/services/service-lash-lift.jpg', TRUE, TRUE, 7, 8),
  ((SELECT id FROM service_categories WHERE slug = 'allay-salon'), 'Hair Styling', 'hair-styling', 'Cleanse, condition, protect, and finish with polish, movement, and shine.', 90, 25000, '/images/allay/services/service-hair-styling.jpg', TRUE, TRUE, 7, 9),
  ((SELECT id FROM service_categories WHERE slug = 'hair-wigs'), 'Braiding', 'braiding', 'Protective styling planned with comfort, finish, and longevity in mind.', 240, 45000, '/images/allay/services/service-hair-braiding.jpg', TRUE, TRUE, 7, 10),
  ((SELECT id FROM service_categories WHERE slug = 'hair-wigs'), 'Premium Human Hair Wig Consultation', 'premium-human-hair-wig-consultation', 'A private consultation for fit, texture, colour, styling, and custom finish.', 45, 10000, '/images/allay/services/service-wig-styling.jpg', TRUE, TRUE, 7, 11),
  ((SELECT id FROM service_categories WHERE slug = 'allay-nail-studio'), 'Nail Care Session', 'nail-care-session', 'Detailed nail and cuticle care with a refined, natural finish.', 60, 18000, '/images/allay/services/service-classic-manicure.jpg', TRUE, TRUE, 7, 12),
  ((SELECT id FROM service_categories WHERE slug = 'body-beauty'), 'Body Scrub / Polish', 'body-scrub-polish', 'A smoothing full-body polish followed by warm hydration and quiet rest.', 60, 28000, '/images/allay/placeholders/placeholder-service.jpg', TRUE, TRUE, 7, 13)
ON CONFLICT (slug) DO UPDATE SET
  category_id = COALESCE(services.category_id, EXCLUDED.category_id),
  image_url = COALESCE(services.image_url, EXCLUDED.image_url),
  simultaneous_capacity = COALESCE(services.simultaneous_capacity, EXCLUDED.simultaneous_capacity),
  display_order = COALESCE(services.display_order, EXCLUDED.display_order);

COMMIT;
