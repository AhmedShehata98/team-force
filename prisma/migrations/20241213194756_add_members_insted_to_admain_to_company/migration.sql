/*
  Warnings:

  - You are about to drop the column `admin_id` on the `Company` table. All the data in the column will be lost.
  - Made the column `company_id` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_company_id_fkey";

-- DropIndex
DROP INDEX "User_company_id_key";

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "admin_id";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "company_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
