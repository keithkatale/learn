-- Make subjects global/shared across classes.
-- Keep per-class chapter structure by moving class linkage to Topic.

ALTER TABLE "Topic" ADD COLUMN IF NOT EXISTS "classId" TEXT;

UPDATE "Topic" t
SET "classId" = s."classId"
FROM "Subject" s
WHERE t."subjectId" = s."id"
  AND t."classId" IS NULL;

-- Build canonical subject IDs by normalized name.
CREATE TEMP TABLE "__subject_canonical" AS
SELECT
  MIN(s."id") AS "canonicalId",
  LOWER(TRIM(s."name")) AS "normName"
FROM "Subject" s
GROUP BY LOWER(TRIM(s."name"));

CREATE TEMP TABLE "__subject_map" AS
SELECT
  s."id" AS "oldId",
  c."canonicalId"
FROM "Subject" s
JOIN "__subject_canonical" c
  ON LOWER(TRIM(s."name")) = c."normName";

-- Point topics at canonical shared subject IDs.
UPDATE "Topic" t
SET "subjectId" = m."canonicalId"
FROM "__subject_map" m
WHERE t."subjectId" = m."oldId"
  AND t."subjectId" <> m."canonicalId";

-- Create implicit many-to-many table used by Prisma for Class[] <-> Subject[].
CREATE TABLE IF NOT EXISTS "_ClassToSubject" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "_ClassToSubject_AB_unique"
  ON "_ClassToSubject"("A", "B");
CREATE INDEX IF NOT EXISTS "_ClassToSubject_B_index"
  ON "_ClassToSubject"("B");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = '_ClassToSubject_A_fkey'
  ) THEN
    ALTER TABLE "_ClassToSubject"
      ADD CONSTRAINT "_ClassToSubject_A_fkey"
      FOREIGN KEY ("A") REFERENCES "Class"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = '_ClassToSubject_B_fkey'
  ) THEN
    ALTER TABLE "_ClassToSubject"
      ADD CONSTRAINT "_ClassToSubject_B_fkey"
      FOREIGN KEY ("B") REFERENCES "Subject"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Backfill Class<->Subject links from old per-class subjects.
INSERT INTO "_ClassToSubject" ("A", "B")
SELECT DISTINCT s."classId", m."canonicalId"
FROM "Subject" s
JOIN "__subject_map" m ON m."oldId" = s."id"
WHERE s."classId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- Remove duplicate subject rows, keep canonical IDs.
DELETE FROM "Subject" s
USING "__subject_map" m
WHERE s."id" = m."oldId"
  AND m."oldId" <> m."canonicalId";

-- Pick clean display names and enforce uniqueness.
UPDATE "Subject" s
SET "name" = t."name"
FROM (
  SELECT MIN("id") AS "id", INITCAP(TRIM("name")) AS "name"
  FROM "Subject"
  GROUP BY LOWER(TRIM("name")), INITCAP(TRIM("name"))
) t
WHERE s."id" = t."id";

ALTER TABLE "Subject" DROP COLUMN IF EXISTS "classId";
CREATE UNIQUE INDEX IF NOT EXISTS "Subject_name_key" ON "Subject"("name");

ALTER TABLE "Topic"
  ALTER COLUMN "classId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Topic_classId_fkey'
  ) THEN
    ALTER TABLE "Topic"
      ADD CONSTRAINT "Topic_classId_fkey"
      FOREIGN KEY ("classId") REFERENCES "Class"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
