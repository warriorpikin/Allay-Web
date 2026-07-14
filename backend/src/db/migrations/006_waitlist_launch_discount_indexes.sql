BEGIN;

ALTER TABLE discount_codes
  ADD COLUMN IF NOT EXISTS waitlist_entry_id UUID REFERENCES waitlist_entries(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS discount_codes_waitlist_entry_idx ON discount_codes (waitlist_entry_id);
CREATE INDEX IF NOT EXISTS discount_codes_active_code_idx ON discount_codes (UPPER(code), is_active);
CREATE INDEX IF NOT EXISTS email_logs_waitlist_type_idx ON email_logs (related_waitlist_id, email_type, created_at DESC);

COMMIT;
