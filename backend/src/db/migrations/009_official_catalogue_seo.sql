BEGIN;

-- Pricing range, merchandising flags and SEO fields for the official Allay
-- House catalogue. All additive/nullable so existing rows and the current
-- API contract keep working untouched.
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS price_from NUMERIC(12, 2) CHECK (price_from IS NULL OR price_from >= 0),
  ADD COLUMN IF NOT EXISTS price_to NUMERIC(12, 2) CHECK (price_to IS NULL OR price_to >= 0),
  ADD COLUMN IF NOT EXISTS price_is_from BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS price_unit_label VARCHAR(40),
  ADD COLUMN IF NOT EXISTS short_description VARCHAR(240),
  ADD COLUMN IF NOT EXISTS service_type VARCHAR(40),
  ADD COLUMN IF NOT EXISTS is_addon BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_couples BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS session_count INTEGER CHECK (session_count IS NULL OR session_count > 0),
  ADD COLUMN IF NOT EXISTS seo_title VARCHAR(160),
  ADD COLUMN IF NOT EXISTS seo_description VARCHAR(300),
  ADD COLUMN IF NOT EXISTS seo_keywords TEXT;

-- ADD CONSTRAINT has no IF NOT EXISTS guard in Postgres, and this whole file
-- re-runs on every deploy (no migration-tracking table in this project), so
-- guard it manually the same way 001_foundation.sql guards CREATE TYPE.
DO $$ BEGIN
  ALTER TABLE services
    ADD CONSTRAINT services_price_range_check CHECK (price_from IS NULL OR price_to IS NULL OR price_to >= price_from);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE service_categories
  ADD COLUMN IF NOT EXISTS seo_title VARCHAR(160),
  ADD COLUMN IF NOT EXISTS seo_description VARCHAR(300);

-- Monthly membership plans: a distinct entity from one-off/bookable services,
-- matching how service_categories/services are already modelled.
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  tagline VARCHAR(200),
  monthly_price NUMERIC(12, 2) NOT NULL CHECK (monthly_price >= 0),
  description TEXT,
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  recurring_frequency VARCHAR(20) NOT NULL DEFAULT 'monthly',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  image_storage_key TEXT,
  seo_title VARCHAR(160),
  seo_description VARCHAR(300),
  terms TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS memberships_active_display_idx ON memberships (is_active, display_order);
CREATE INDEX IF NOT EXISTS memberships_slug_idx ON memberships (slug);

DROP TRIGGER IF EXISTS memberships_set_updated_at ON memberships;
CREATE TRIGGER memberships_set_updated_at BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- The two new catalogue categories (Waxing, Signature Experiences) go through
-- the same ON CONFLICT (slug) upsert as the existing 10 categories so this
-- migration file stays safe to re-run on every deploy. Actual service rows
-- are imported separately by scripts/importOfficialCatalogue.js, which is
-- transactional and reversible in a way a migration file re-run on every
-- deploy is not.
INSERT INTO service_categories (name, slug, description, display_order, is_active)
VALUES
  ('Waxing', 'waxing', 'Precise waxing services from brow to full body.', 11, TRUE),
  ('Signature Experiences', 'signature-experiences', 'Full-day, bridal and corporate wellness experiences at Allay House.', 12, TRUE)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
