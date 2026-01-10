-- Add userId and username columns to Resource table
ALTER TABLE "Resource" ADD COLUMN "userId" TEXT;
ALTER TABLE "Resource" ADD COLUMN "username" TEXT;
