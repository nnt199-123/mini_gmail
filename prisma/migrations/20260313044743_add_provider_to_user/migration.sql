-- AlterTable
ALTER TABLE "User" ADD COLUMN     "provider" TEXT DEFAULT 'local',
ALTER COLUMN "password" DROP NOT NULL;
