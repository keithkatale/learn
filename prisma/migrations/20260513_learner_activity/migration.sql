-- Learner visit tracking + instructor-assigned display names (run in Supabase SQL Editor if not using prisma migrate)

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "instructorLabel" TEXT;

CREATE TABLE IF NOT EXISTS "LearnerVisitSession" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "durationSeconds" INTEGER,
  CONSTRAINT "LearnerVisitSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "LearnerVisitSession_userId_idx" ON "LearnerVisitSession"("userId");
CREATE INDEX IF NOT EXISTS "LearnerVisitSession_lastActivityAt_idx" ON "LearnerVisitSession"("lastActivityAt");
