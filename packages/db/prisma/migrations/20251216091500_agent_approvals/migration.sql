-- CreateEnum
CREATE TYPE "AgentApprovalStatus" AS ENUM ('pending', 'approved', 'rejected', 'executed', 'failed');

-- CreateTable
CREATE TABLE "AgentApproval" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB,
    "manifest" JSONB,
    "status" "AgentApprovalStatus" NOT NULL DEFAULT 'pending',
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "reason" TEXT,
    "execution" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentApproval_pkey" PRIMARY KEY ("id")
);
