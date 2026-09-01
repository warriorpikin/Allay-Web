BEGIN;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS service_group VARCHAR(140),
  ADD COLUMN IF NOT EXISTS duration_label VARCHAR(40),
  ADD COLUMN IF NOT EXISTS price_options JSONB;

DO $$ BEGIN
  ALTER TABLE services
    ADD CONSTRAINT services_price_options_array_check
    CHECK (price_options IS NULL OR jsonb_typeof(price_options) = 'array');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  ADD COLUMN IF NOT EXISTS whatsapp_handoff_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whatsapp_message TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES admins(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS bookings_reference_search_idx ON bookings (LOWER(booking_reference));
CREATE INDEX IF NOT EXISTS bookings_customer_name_search_idx ON bookings (LOWER(customer_name));
CREATE INDEX IF NOT EXISTS bookings_customer_email_search_idx ON bookings (LOWER(customer_email));
CREATE INDEX IF NOT EXISTS bookings_customer_phone_search_idx ON bookings (customer_phone);
CREATE INDEX IF NOT EXISTS bookings_pending_created_idx ON bookings (created_at DESC) WHERE status = 'pending';

INSERT INTO settings (key, value)
VALUES (
  'booking_channel',
  '{"provider":"whatsapp","business_short_link":"https://wa.me/message/Z4T6TZPX5LP1","manual_confirmation":true,"online_payment":false}'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

UPDATE settings
SET value = '{"gateway":"none","online_enabled":false,"confirmation":"manual"}'::jsonb,
    updated_at = NOW()
WHERE key = 'payment';

COMMIT;
