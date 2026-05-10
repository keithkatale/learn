-- New Tables for Academic Content
CREATE TABLE "Class" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL
);

CREATE TABLE "Subject" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "classId" TEXT NOT NULL REFERENCES "Class"("id")
);

CREATE TABLE "Topic" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL REFERENCES "Subject"("id")
);

-- Update Lesson to reference Topic
ALTER TABLE "Lesson" ADD COLUMN "topicId" TEXT REFERENCES "Topic"("id");

-- Update User for phone auth
ALTER TABLE "User" ADD COLUMN "phone" TEXT UNIQUE;
-- Assuming we want to drop email and just use phone
-- ALTER TABLE "User" DROP COLUMN "email"; 

-- Update Enrollment to link to new User structure
-- (If needed)
