/*
  Warnings:

  - Added the required column `bio` to the `Company` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "bio" VARCHAR(255) NOT NULL;
