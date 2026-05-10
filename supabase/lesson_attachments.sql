-- =============================================================================
-- Lesson PDF / document attachments — run in Supabase SQL Editor (Dashboard)
-- =============================================================================
-- 1) Adds JSON metadata on Lesson rows (what lives in Storage).
-- 2) Creates a private Storage bucket for files (PDFs, Office docs, etc.).
-- 3) Adds Storage RLS policies so creators can upload and learners can read.
--
-- Bucket layout (path):  <lesson_uuid>/<random_uuid>_<safe_filename.pdf>
-- Lesson.attachments JSONB shape:
--   [{"path":"…","label":"Handout.pdf","mime":"application/pdf"}, …]
-- =============================================================================

-- A) Column on Lesson (adjust table name if yours differs)
ALTER TABLE public."Lesson"
  ADD COLUMN IF NOT EXISTS "attachments" JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public."Lesson"."attachments" IS
  'Array of {path, label, mime} objects pointing at storage.objects in lesson-attachments bucket';

-- B) Bucket (skip if you already created it in Dashboard → Storage).
--    You can set file size / MIME limits in Dashboard → Storage → bucket → Configuration.
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-attachments', 'lesson-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- C) Drop old policies if re-running (ignore errors if names differ)
DROP POLICY IF EXISTS "lesson_attachments_insert_creators" ON storage.objects;
DROP POLICY IF EXISTS "lesson_attachments_update_creators" ON storage.objects;
DROP POLICY IF EXISTS "lesson_attachments_delete_creators" ON storage.objects;
DROP POLICY IF EXISTS "lesson_attachments_select_learners_and_creators" ON storage.objects;

-- Creators (User.role = CREATOR) may upload / replace / delete.
-- Note: studio UI may allow access via NEXT_PUBLIC_CREATOR_EMAIL; Storage still checks DB role.
--       Set User.role = 'CREATOR' for instructors who upload files, or relax policies carefully.

CREATE POLICY "lesson_attachments_insert_creators"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'lesson-attachments'
  AND EXISTS (
    SELECT 1 FROM public."User" u
    WHERE u.id = auth.uid()::text
      AND u.role = 'CREATOR'
  )
);

CREATE POLICY "lesson_attachments_update_creators"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'lesson-attachments'
  AND EXISTS (
    SELECT 1 FROM public."User" u
    WHERE u.id = auth.uid()::text
      AND u.role = 'CREATOR'
  )
)
WITH CHECK (
  bucket_id = 'lesson-attachments'
  AND EXISTS (
    SELECT 1 FROM public."User" u
    WHERE u.id = auth.uid()::text
      AND u.role = 'CREATOR'
  )
);

CREATE POLICY "lesson_attachments_delete_creators"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'lesson-attachments'
  AND EXISTS (
    SELECT 1 FROM public."User" u
    WHERE u.id = auth.uid()::text
      AND u.role = 'CREATOR'
  )
);

-- Enrolled learners OR creators may download (signed URLs / fetch)
CREATE POLICY "lesson_attachments_select_learners_and_creators"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'lesson-attachments'
  AND (
    EXISTS (
      SELECT 1 FROM public."Enrollment" e
      WHERE e."userId" = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = auth.uid()::text
        AND u.role = 'CREATOR'
    )
  )
);
