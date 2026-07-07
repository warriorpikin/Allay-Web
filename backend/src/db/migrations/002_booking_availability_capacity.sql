BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE service_categories
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS simultaneous_capacity INTEGER CHECK (simultaneous_capacity IS NULL OR simultaneous_capacity > 0);

ALTER TABLE bookings
  ALTER COLUMN customer_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(160),
  ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(40),
  ADD COLUMN IF NOT EXISTS total_duration_minutes INTEGER NOT NULL DEFAULT 0 CHECK (total_duration_minutes >= 0),
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0);

UPDATE bookings
SET
  customer_name = COALESCE(bookings.customer_name, customers.full_name),
  customer_email = COALESCE(bookings.customer_email, customers.email),
  customer_phone = COALESCE(bookings.customer_phone, customers.phone),
  subtotal = CASE WHEN bookings.subtotal = 0 THEN bookings.total_amount ELSE bookings.subtotal END
FROM customers
WHERE bookings.customer_id = customers.id;

CREATE TABLE IF NOT EXISTS booking_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  service_name VARCHAR(160) NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS booking_services_booking_idx ON booking_services (booking_id);
CREATE INDEX IF NOT EXISTS booking_services_service_idx ON booking_services (service_id);

INSERT INTO booking_services (booking_id, service_id, service_name, price, duration_minutes, created_at)
SELECT bi.booking_id, bi.service_id, s.name, bi.price, bi.duration_minutes, bi.created_at
FROM booking_items bi
JOIN services s ON s.id = bi.service_id
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week SMALLINT NOT NULL UNIQUE CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME NOT NULL DEFAULT '09:00',
  close_time TIME NOT NULL DEFAULT '17:00',
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  max_daily_bookings INTEGER NOT NULL DEFAULT 30 CHECK (max_daily_bookings >= 0),
  max_bookings_per_slot INTEGER NOT NULL DEFAULT 3 CHECK (max_bookings_per_slot >= 0),
  slot_interval_minutes INTEGER NOT NULL DEFAULT 30 CHECK (slot_interval_minutes > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (close_time > open_time)
);

INSERT INTO business_hours (day_of_week, open_time, close_time, is_open, max_daily_bookings, max_bookings_per_slot, slot_interval_minutes)
SELECT day_of_week, open_time, close_time, is_open, 30, GREATEST(max_bookings_per_slot, 1), 30
FROM availability_rules
ON CONFLICT (day_of_week) DO NOTHING;

INSERT INTO business_hours (day_of_week, open_time, close_time, is_open, max_daily_bookings, max_bookings_per_slot, slot_interval_minutes)
VALUES
  (0, '09:00', '17:00', FALSE, 0, 0, 30),
  (1, '09:00', '17:00', TRUE, 30, 3, 30),
  (2, '09:00', '17:00', TRUE, 30, 3, 30),
  (3, '09:00', '17:00', TRUE, 30, 3, 30),
  (4, '09:00', '17:00', TRUE, 30, 3, 30),
  (5, '09:00', '17:00', TRUE, 30, 3, 30),
  (6, '10:00', '16:00', TRUE, 15, 3, 30)
ON CONFLICT (day_of_week) DO NOTHING;

ALTER TABLE blocked_periods
  ALTER COLUMN created_by DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS block_type VARCHAR(40) NOT NULL DEFAULT 'time_range';

CREATE TABLE IF NOT EXISTS booking_capacity_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time_slot TIME,
  max_bookings INTEGER NOT NULL CHECK (max_bookings >= 0),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (date, time_slot)
);
CREATE INDEX IF NOT EXISTS booking_capacity_overrides_date_idx ON booking_capacity_overrides (date, time_slot);

CREATE INDEX IF NOT EXISTS bookings_active_schedule_idx
  ON bookings (appointment_date, start_time, end_time, status)
  WHERE status <> 'cancelled';

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customers_set_updated_at ON customers;
CREATE TRIGGER customers_set_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS service_categories_set_updated_at ON service_categories;
CREATE TRIGGER service_categories_set_updated_at BEFORE UPDATE ON service_categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS business_hours_set_updated_at ON business_hours;
CREATE TRIGGER business_hours_set_updated_at BEFORE UPDATE ON business_hours FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS blocked_periods_set_updated_at ON blocked_periods;
CREATE TRIGGER blocked_periods_set_updated_at BEFORE UPDATE ON blocked_periods FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS booking_capacity_overrides_set_updated_at ON booking_capacity_overrides;
CREATE TRIGGER booking_capacity_overrides_set_updated_at BEFORE UPDATE ON booking_capacity_overrides FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
