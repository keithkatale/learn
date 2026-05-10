-- Topics (chapters) ordered per subject; lessons ordered per topic (creation sequence).

ALTER TABLE "Topic" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Existing topics: stable order by id within each subject (creation proxy).
UPDATE "Topic" AS t
SET "sortOrder" = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "subjectId" ORDER BY id) AS rn
  FROM "Topic"
) AS sub
WHERE t.id = sub.id;

-- Existing lessons: order by created time within each topic.
UPDATE "Lesson" AS l
SET "sortOrder" = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY "topicId" ORDER BY "createdAt" ASC NULLS LAST, id
  ) AS rn
  FROM "Lesson"
  WHERE "topicId" IS NOT NULL
) AS sub
WHERE l.id = sub.id AND l."topicId" IS NOT NULL;
