# Atomic Labs (Supabase URL + anon key)

This app uses Supabase client auth/data with:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Features

- Register/login with Supabase Auth
- Creator dashboard (`/studio`) based on `NEXT_PUBLIC_CREATOR_EMAIL`
- Lesson CRUD in `Lesson` table
- Learner access in `Enrollment` table
- Video uploads to Supabase Storage bucket
- Explicit loading states across learner and studio pages

## Environment

Copy `.env.example` to `.env` and set values.

Optional:

- `NEXT_PUBLIC_SUPABASE_VIDEO_BUCKET=lesson-videos`
- `NEXT_PUBLIC_MAX_VIDEO_MB=50`

## Storage bucket setup

Create bucket: `lesson-videos` (or your configured name).

If upload fails with policy errors, run these SQL policies in Supabase SQL editor:

```sql
-- allow authenticated users to upload lesson videos
create policy "authenticated upload lesson videos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'lesson-videos');

-- allow authenticated users to update own uploads (optional)
create policy "authenticated update lesson videos"
on storage.objects
for update
to authenticated
using (bucket_id = 'lesson-videos')
with check (bucket_id = 'lesson-videos');

-- allow authenticated users to read from bucket (if bucket not public)
create policy "authenticated read lesson videos"
on storage.objects
for select
to authenticated
using (bucket_id = 'lesson-videos');
```

If your bucket is public, reads may already work without the select policy.

## Run

```bash
npm install
npm run dev
```

## Notes

- Enforce security with Supabase RLS + Storage policies.
- Keep service role key out of the browser.
