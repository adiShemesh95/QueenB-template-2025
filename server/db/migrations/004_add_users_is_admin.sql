-- Admin foundation: capability flag on users (not a mutually exclusive role).
-- A user may simultaneously be a regular user, mentor, mentee, and admin.
-- DEFAULT FALSE keeps existing and newly registered users non-admin unless
-- an authorized server/database-side process promotes them.
-- Never grant Admin via registration or other client-controlled input.
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
