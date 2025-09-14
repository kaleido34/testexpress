-- This is an empty migration.
-- Verify all existing users who don't have verification tokens
UPDATE "User" SET "isEmailVerified" = true WHERE "verificationToken" IS NULL;