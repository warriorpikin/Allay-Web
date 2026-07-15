BEGIN;

-- Reusable backend-controlled promotion system for the public website
-- (waitlist campaigns, discounts, announcements, etc). Status is
-- deliberately limited to admin-set intent (draft/active/paused); the
-- "scheduled" and "expired" states shown in the admin UI are derived from
-- status + start_at/end_at rather than stored, so they can never drift out
-- of sync with the dates.
CREATE TABLE IF NOT EXISTS website_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  internal_name VARCHAR(160) NOT NULL,
  heading VARCHAR(200) NOT NULL,
  eyebrow_text VARCHAR(120) NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',

  cta_text VARCHAR(80) NOT NULL DEFAULT '',
  cta_action VARCHAR(30) NOT NULL DEFAULT 'none'
    CHECK (cta_action IN ('internal_page', 'waitlist', 'booking', 'service', 'external_url', 'close', 'none')),
  cta_target VARCHAR(300) NOT NULL DEFAULT '',
  secondary_cta_text VARCHAR(80) NOT NULL DEFAULT '',
  secondary_cta_action VARCHAR(30) NOT NULL DEFAULT 'none'
    CHECK (secondary_cta_action IN ('internal_page', 'waitlist', 'booking', 'service', 'external_url', 'close', 'none')),
  secondary_cta_target VARCHAR(300) NOT NULL DEFAULT '',

  image_source_type VARCHAR(20) NOT NULL DEFAULT 'custom'
    CHECK (image_source_type IN ('custom', 'category', 'mixed')),
  images JSONB NOT NULL DEFAULT '[]',

  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused')),
  priority INT NOT NULL DEFAULT 0 CHECK (priority >= 0),
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,

  is_dismissible BOOLEAN NOT NULL DEFAULT TRUE,
  autoplay_images BOOLEAN NOT NULL DEFAULT TRUE,
  slide_interval_ms INT NOT NULL DEFAULT 6000 CHECK (slide_interval_ms >= 2000),

  trigger_first_visit BOOLEAN NOT NULL DEFAULT FALSE,
  trigger_return_visit BOOLEAN NOT NULL DEFAULT FALSE,
  return_after_days INT NOT NULL DEFAULT 7 CHECK (return_after_days > 0),
  trigger_after_delay BOOLEAN NOT NULL DEFAULT FALSE,
  delay_seconds INT NOT NULL DEFAULT 900 CHECK (delay_seconds >= 0),
  trigger_on_reload BOOLEAN NOT NULL DEFAULT FALSE,
  reload_frequency VARCHAR(20) NOT NULL DEFAULT 'once_per_session'
    CHECK (reload_frequency IN ('once_per_session', 'cooldown', 'every_reload')),
  trigger_after_signup BOOLEAN NOT NULL DEFAULT FALSE,
  trigger_after_login BOOLEAN NOT NULL DEFAULT FALSE,

  target_routes JSONB NOT NULL DEFAULT '["all"]',
  target_audience VARCHAR(20) NOT NULL DEFAULT 'all'
    CHECK (target_audience IN ('all', 'new', 'returning', 'guest', 'signed_in')),

  cooldown_seconds INT NOT NULL DEFAULT 86400 CHECK (cooldown_seconds >= 0),
  max_per_session INT NOT NULL DEFAULT 1 CHECK (max_per_session >= 0),
  max_lifetime_impressions INT CHECK (max_lifetime_impressions IS NULL OR max_lifetime_impressions >= 0),
  stop_after_dismissal BOOLEAN NOT NULL DEFAULT TRUE,
  campaign_version INT NOT NULL DEFAULT 1 CHECK (campaign_version >= 1),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (end_at IS NULL OR start_at IS NULL OR end_at > start_at)
);

CREATE INDEX IF NOT EXISTS website_promotions_status_priority_idx
  ON website_promotions (status, priority DESC, start_at DESC);
CREATE INDEX IF NOT EXISTS website_promotions_dates_idx
  ON website_promotions (start_at, end_at);

DROP TRIGGER IF EXISTS website_promotions_set_updated_at ON website_promotions;
CREATE TRIGGER website_promotions_set_updated_at
  BEFORE UPDATE ON website_promotions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed the pre-launch waitlist campaign as the first real promotion. Fixed id
-- + ON CONFLICT DO NOTHING makes this safe to re-run without clobbering admin
-- edits (mirrors the seeding convention used in 005 for services/categories).
INSERT INTO website_promotions (
  id, internal_name, heading, eyebrow_text, message,
  cta_text, cta_action, cta_target,
  image_source_type, images,
  status, priority, is_dismissible, autoplay_images,
  trigger_first_visit, trigger_after_delay, delay_seconds,
  target_routes, cooldown_seconds, max_per_session, stop_after_dismissal
) VALUES (
  '00000000-0000-4000-8000-000000000001',
  'Pre-launch waitlist offer',
  'Join the waitlist and get 15% off',
  'Limited pre-launch offer',
  'Be first through the door. Join the Allay House waitlist now and receive 15% off your first booking when we launch.',
  'Join the waitlist', 'waitlist', '/waitlist',
  'category', '[{"type":"category","categorySlug":"allay-spa"},{"type":"category","categorySlug":"allay-pilates"},{"type":"category","categorySlug":"allay-nail-studio"},{"type":"category","categorySlug":"allay-salon"}]',
  'active', 100, TRUE, TRUE,
  TRUE, TRUE, 900,
  '["all"]', 86400, 1, FALSE
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
