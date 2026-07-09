BEGIN;

ALTER TYPE email_status ADD VALUE IF NOT EXISTS 'skipped';

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS local_image_path TEXT,
  ADD COLUMN IF NOT EXISTS default_capacity_per_slot INTEGER NOT NULL DEFAULT 7 CHECK (default_capacity_per_slot >= 0);

UPDATE services
SET
  simultaneous_capacity = COALESCE(simultaneous_capacity, default_capacity_per_slot, 7),
  default_capacity_per_slot = COALESCE(default_capacity_per_slot, simultaneous_capacity, 7)
WHERE simultaneous_capacity IS NULL
   OR default_capacity_per_slot IS NULL;

ALTER TABLE business_hours
  ALTER COLUMN slot_interval_minutes SET DEFAULT 5,
  ALTER COLUMN max_bookings_per_slot SET DEFAULT 7;

UPDATE business_hours
SET
  slot_interval_minutes = 5,
  max_bookings_per_slot = CASE WHEN max_bookings_per_slot < 7 THEN 7 ELSE max_bookings_per_slot END;

ALTER TABLE booking_capacity_overrides
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE CASCADE;

DROP INDEX IF EXISTS booking_capacity_overrides_date_idx;
CREATE INDEX IF NOT EXISTS booking_capacity_overrides_date_idx ON booking_capacity_overrides (date, time_slot, service_id);

CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(160) NOT NULL,
  profile_image_url TEXT,
  testimonial_text TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS testimonials_set_updated_at ON testimonials;
CREATE TRIGGER testimonials_set_updated_at BEFORE UPDATE ON testimonials FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO testimonials (customer_name, testimonial_text, rating, is_active, display_order)
VALUES
  ('Amara N.', 'Allay House feels calm from the first moment. The care is thoughtful, polished, and deeply restorative.', 5, TRUE, 1),
  ('Tomi A.', 'The service felt premium without feeling intimidating. I left lighter, softer, and already planning my next visit.', 5, TRUE, 2),
  ('Kemi O.', 'Every detail felt intentional, from the welcome to the final finish. It is exactly the kind of beauty space Lagos needs.', 5, TRUE, 3)
ON CONFLICT DO NOTHING;

INSERT INTO settings (key, value)
VALUES ('launch', '{"mode":"prelaunch","waitlist_enabled":true,"discount_percentage":null,"discount_expiry":null}'::jsonb)
ON CONFLICT (key) DO UPDATE SET
  value = settings.value || '{"mode":"prelaunch","waitlist_enabled":true}'::jsonb
WHERE settings.value->>'mode' IS NULL;

COMMIT;
