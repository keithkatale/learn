-- Phone-first learners may have no email; legacy schema required NOT NULL.
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
