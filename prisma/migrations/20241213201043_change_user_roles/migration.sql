/*
  Warnings:

  - The values [Admin] on the enum `User_Roles` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "User_Roles_new" AS ENUM ('ADMIN', 'MEMBER');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "User_Roles_new" USING ("role"::text::"User_Roles_new");
ALTER TYPE "User_Roles" RENAME TO "User_Roles_old";
ALTER TYPE "User_Roles_new" RENAME TO "User_Roles";
DROP TYPE "User_Roles_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ADMIN';
COMMIT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ADMIN';
