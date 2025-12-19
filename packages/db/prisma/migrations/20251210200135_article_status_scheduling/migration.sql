-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('draft', 'scheduled', 'published');

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "scheduledFor" TIMESTAMP(3),
ADD COLUMN     "status" "ArticleStatus" NOT NULL DEFAULT 'draft';
