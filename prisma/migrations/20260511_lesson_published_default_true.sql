-- New lessons default to visible on Learn / catalog unless explicitly unpublished.
ALTER TABLE "Lesson" ALTER COLUMN "published" SET DEFAULT true;
