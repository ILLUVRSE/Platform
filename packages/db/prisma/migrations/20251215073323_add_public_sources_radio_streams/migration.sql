-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('government', 'public_broadcaster', 'community', 'ngo', 'wire', 'independent', 'other');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('unknown', 'online', 'offline');

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "locale" TEXT,
ADD COLUMN     "originId" TEXT,
ADD COLUMN     "sourceId" TEXT,
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "summary" TEXT;

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "SourceType" NOT NULL DEFAULT 'other',
    "homepageUrl" TEXT,
    "feedUrl" TEXT,
    "countryCode" TEXT,
    "region" TEXT,
    "language" TEXT,
    "timezone" TEXT,
    "reliability" INTEGER,
    "lastFetchedAt" TIMESTAMP(3),
    "fetchInterval" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "countryCode" TEXT,
    "region" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "language" TEXT,
    "genre" TEXT,
    "streamUrl" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "logoUrl" TEXT,
    "bitrate" INTEGER,
    "codec" TEXT,
    "status" "AvailabilityStatus" NOT NULL DEFAULT 'unknown',
    "lastCheckedAt" TIMESTAMP(3),
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stream" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "locationName" TEXT,
    "countryCode" TEXT,
    "region" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "language" TEXT,
    "embedUrl" TEXT NOT NULL,
    "posterImage" TEXT,
    "attribution" TEXT,
    "licenseNote" TEXT,
    "status" "AvailabilityStatus" NOT NULL DEFAULT 'unknown',
    "lastCheckedAt" TIMESTAMP(3),
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "sourceId" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stream_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Source_slug_key" ON "Source"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Station_slug_key" ON "Station"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Stream_slug_key" ON "Stream"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Article_originId_key" ON "Article"("originId");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stream" ADD CONSTRAINT "Stream_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

