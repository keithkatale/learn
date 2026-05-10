-- Allow creator accounts (Supabase email only) without a phone number.
ALTER TABLE "User" ALTER COLUMN "phone" DROP NOT NULL;


