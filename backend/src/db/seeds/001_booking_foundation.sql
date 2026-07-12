BEGIN;

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
  name = COALESCE(service_categories.name, EXCLUDED.name),
  description = COALESCE(service_categories.description, EXCLUDED.description),
  display_order = COALESCE(service_categories.display_order, EXCLUDED.display_order),
  is_active = COALESCE(service_categories.is_active, EXCLUDED.is_active);

INSERT INTO services (category_id, name, slug, description, duration_minutes, price, image_url, is_active, is_discount_eligible, simultaneous_capacity, display_order)
VALUES
  ((SELECT id FROM service_categories WHERE slug = 'facials'), 'Signature Glow Facial', 'signature-glow-facial', 'A radiance-focused ritual combining gentle renewal, hydration, and restorative massage.', 60, 20000, NULL, TRUE, TRUE, 7, 1),
  ((SELECT id FROM service_categories WHERE slug = 'facials'), 'Hydrating Facial', 'hydrating-facial', 'Deep hydration and barrier support for skin that feels calm, soft, and replenished.', 60, 24000, NULL, TRUE, TRUE, 7, 2),
  ((SELECT id FROM service_categories WHERE slug = 'massage'), 'Deep Tissue Massage', 'deep-tissue-massage', 'Focused therapeutic pressure for persistent tension, tired muscles, and fuller release.', 75, 30000, NULL, TRUE, TRUE, 7, 3),
  ((SELECT id FROM service_categories WHERE slug = 'sauna'), 'Sauna Session', 'sauna-session', 'A quiet private heat ritual with generous time to settle before and after.', 45, 15000, NULL, TRUE, TRUE, 7, 4),
  ((SELECT id FROM service_categories WHERE slug = 'headspa'), 'Headspa Ritual', 'headspa-ritual', 'Scalp cleansing, conditioning, steam, and slow massage in one sensory ritual.', 75, 35000, NULL, TRUE, TRUE, 7, 5),
  ((SELECT id FROM service_categories WHERE slug = 'allay-pilates'), 'Pilates Class', 'pilates-class', 'A considered small-group class for alignment, control, strength, and balance.', 50, 18000, NULL, TRUE, TRUE, 7, 6),
  ((SELECT id FROM service_categories WHERE slug = 'allay-lash-studio'), 'Brow Shaping + Tint', 'brow-shaping-tint', 'Measured shaping and soft tinting designed around your natural features.', 45, 15000, NULL, TRUE, TRUE, 7, 7),
  ((SELECT id FROM service_categories WHERE slug = 'allay-lash-studio'), 'Lash Lift + Tint', 'lash-lift-tint', 'A low-maintenance lift and tint for softly defined, naturally open lashes.', 60, 22000, NULL, TRUE, TRUE, 7, 8),
  ((SELECT id FROM service_categories WHERE slug = 'allay-salon'), 'Hair Styling', 'hair-styling', 'Cleanse, condition, protect, and finish with polish, movement, and shine.', 90, 25000, NULL, TRUE, TRUE, 7, 9),
  ((SELECT id FROM service_categories WHERE slug = 'hair-wigs'), 'Braiding', 'braiding', 'Protective styling planned with comfort, finish, and longevity in mind.', 240, 45000, NULL, TRUE, TRUE, 7, 10),
  ((SELECT id FROM service_categories WHERE slug = 'hair-wigs'), 'Premium Human Hair Wig Consultation', 'premium-human-hair-wig-consultation', 'A private consultation for fit, texture, colour, styling, and custom finish.', 45, 10000, NULL, TRUE, TRUE, 7, 11),
  ((SELECT id FROM service_categories WHERE slug = 'allay-nail-studio'), 'Nail Care Session', 'nail-care-session', 'Detailed nail and cuticle care with a refined, natural finish.', 60, 18000, NULL, TRUE, TRUE, 7, 12),
  ((SELECT id FROM service_categories WHERE slug = 'body-beauty'), 'Body Scrub / Polish', 'body-scrub-polish', 'A smoothing full-body polish followed by warm hydration and quiet rest.', 60, 28000, NULL, TRUE, TRUE, 7, 13)
ON CONFLICT (slug) DO UPDATE SET
  category_id = COALESCE(services.category_id, EXCLUDED.category_id),
  name = COALESCE(services.name, EXCLUDED.name),
  description = COALESCE(services.description, EXCLUDED.description),
  duration_minutes = COALESCE(services.duration_minutes, EXCLUDED.duration_minutes),
  price = COALESCE(services.price, EXCLUDED.price),
  image_url = COALESCE(services.image_url, EXCLUDED.image_url),
  is_active = COALESCE(services.is_active, EXCLUDED.is_active),
  is_discount_eligible = COALESCE(services.is_discount_eligible, EXCLUDED.is_discount_eligible),
  simultaneous_capacity = COALESCE(services.simultaneous_capacity, EXCLUDED.simultaneous_capacity),
  display_order = COALESCE(services.display_order, EXCLUDED.display_order);

INSERT INTO business_hours (day_of_week, open_time, close_time, is_open, max_daily_bookings, max_bookings_per_slot, slot_interval_minutes)
VALUES
  (0, '09:00', '17:00', FALSE, 0, 0, 30),
  (1, '09:00', '17:00', TRUE, 30, 3, 30),
  (2, '09:00', '17:00', TRUE, 30, 3, 30),
  (3, '09:00', '17:00', TRUE, 30, 3, 30),
  (4, '09:00', '17:00', TRUE, 30, 3, 30),
  (5, '09:00', '17:00', TRUE, 30, 3, 30),
  (6, '10:00', '16:00', TRUE, 15, 3, 30)
ON CONFLICT (day_of_week) DO UPDATE SET
  open_time = EXCLUDED.open_time,
  close_time = EXCLUDED.close_time,
  is_open = EXCLUDED.is_open,
  max_daily_bookings = EXCLUDED.max_daily_bookings,
  max_bookings_per_slot = EXCLUDED.max_bookings_per_slot,
  slot_interval_minutes = EXCLUDED.slot_interval_minutes;

COMMIT;
