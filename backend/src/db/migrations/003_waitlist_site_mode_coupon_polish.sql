BEGIN;

-- Waitlist must only require an email; name/phone become optional.
ALTER TABLE waitlist_entries
  ALTER COLUMN full_name DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS status VARCHAR(40) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source VARCHAR(80) NOT NULL DEFAULT 'website',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Normalize any existing rows before enforcing a case-insensitive unique email so upserts have a conflict target.
UPDATE waitlist_entries SET email = LOWER(email) WHERE email <> LOWER(email);

DROP INDEX IF EXISTS waitlist_email_idx;
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_entries_email_unique_idx ON waitlist_entries (LOWER(email));

DROP TRIGGER IF EXISTS waitlist_entries_set_updated_at ON waitlist_entries;
CREATE TRIGGER waitlist_entries_set_updated_at BEFORE UPDATE ON waitlist_entries FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
