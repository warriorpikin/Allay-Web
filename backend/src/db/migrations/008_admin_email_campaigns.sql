BEGIN;

DO $$ BEGIN
  CREATE TYPE email_campaign_status AS ENUM ('draft', 'sending', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE email_campaign_recipient_status AS ENUM ('pending', 'sent', 'failed', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key VARCHAR(120) UNIQUE,
  email_type VARCHAR(40) NOT NULL DEFAULT 'standard',
  subject VARCHAR(255) NOT NULL,
  preheader VARCHAR(255),
  heading VARCHAR(255),
  body_text TEXT NOT NULL,
  image_url TEXT,
  image_alt VARCHAR(255),
  cta_label VARCHAR(80),
  cta_url TEXT,
  audience_type VARCHAR(40) NOT NULL,
  reply_mode VARCHAR(20) NOT NULL DEFAULT 'default',
  reply_to VARCHAR(255),
  support_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  status email_campaign_status NOT NULL DEFAULT 'draft',
  total_recipients INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS email_campaigns_created_at_idx ON email_campaigns (created_at DESC);
CREATE INDEX IF NOT EXISTS email_campaigns_status_idx ON email_campaigns (status);

CREATE TABLE IF NOT EXISTS email_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(160),
  user_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  waitlist_id UUID REFERENCES waitlist_entries(id) ON DELETE SET NULL,
  status email_campaign_recipient_status NOT NULL DEFAULT 'pending',
  provider_message_id VARCHAR(255),
  failure_code VARCHAR(80),
  failure_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS email_campaign_recipients_unique_idx ON email_campaign_recipients (campaign_id, LOWER(recipient_email));
CREATE INDEX IF NOT EXISTS email_campaign_recipients_campaign_idx ON email_campaign_recipients (campaign_id, status);

COMMIT;
