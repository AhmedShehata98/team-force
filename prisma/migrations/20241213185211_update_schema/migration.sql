/*
  Warnings:

  - The `status` column on the `Project` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `leader_id` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `project_id` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Team_members` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Team_members` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `role` on the `Team_members` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "User_Roles" AS ENUM ('Admin', 'MEMBER');

-- CreateEnum
CREATE TYPE "Team_Roles" AS ENUM ('LEADER', 'MEMBER');

-- CreateEnum
CREATE TYPE "Task_Status" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Project_Status" AS ENUM ('ACTIVE', 'INACTIVE', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_leader_id_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_project_id_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "status",
ADD COLUMN     "status" "Project_Status" NOT NULL DEFAULT 'INACTIVE';

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "leader_id",
DROP COLUMN "project_id";

-- AlterTable
ALTER TABLE "Team_members" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "role",
ADD COLUMN     "role" "Team_Roles" NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "User_Roles" NOT NULL DEFAULT 'Admin';

-- DropEnum
DROP TYPE "Roles";

-- DropEnum
DROP TYPE "Status";

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "team_id" INTEGER NOT NULL,
    "assignee_to_id" INTEGER NOT NULL,
    "due_date" TIMESTAMP(3),
    "status" "Task_Status" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignee_to_id_fkey" FOREIGN KEY ("assignee_to_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
