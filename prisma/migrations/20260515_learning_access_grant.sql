-- Scoped lesson access (paid / partial enrollment). Expiry enforced in application layer.
CREATE TABLE IF NOT EXISTS "LearningAccessGrant" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearningAccessGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LearningAccessGrant_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LearningAccessGrant_userId_lessonId_key" UNIQUE ("userId", "lessonId")
);

CREATE INDEX IF NOT EXISTS "LearningAccessGrant_userId_idx" ON "LearningAccessGrant"("userId");
CREATE INDEX IF NOT EXISTS "LearningAccessGrant_lessonId_idx" ON "LearningAccessGrant"("lessonId");
