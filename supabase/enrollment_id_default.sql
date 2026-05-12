-- =============================================================================
-- Optional: Enrollment primary key default (Supabase SQL Editor)
-- =============================================================================
-- If inserts omit "id", Postgres can generate one — avoids NOT NULL violations.
-- The app already sends explicit ids when granting full catalog; this is a backup.
--
-- Safe to run once; idempotent if default already matches (ALTER SET replaces).
-- =============================================================================

ALTER TABLE public."Enrollment"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
