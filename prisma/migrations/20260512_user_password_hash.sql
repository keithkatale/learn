-- Learner accounts store bcrypt hashes locally (no Twilio / Supabase phone auth).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
