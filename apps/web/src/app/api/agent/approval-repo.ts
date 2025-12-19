import { prisma } from "@illuvrse/db";
import {
  addApprovalRequest,
  approvalById,
  approvalRequests,
  updateApprovalRequest,
  type ApprovalRequest,
  type ApprovalStatus
} from "./store";

type CreateApprovalInput = {
  agentId: string;
  action: string;
  payload?: Record<string, unknown>;
  manifest?: Record<string, unknown>;
  requestedBy?: string;
};

const useDatabase = Boolean(process.env.DATABASE_URL);

function mapDbRecord(record: any): ApprovalRequest {
  return {
    id: record.id,
    agentId: record.agentId,
    action: record.action,
    payload: record.payload ?? undefined,
    manifest: record.manifest ?? undefined,
    status: record.status as ApprovalStatus,
    requestedBy: record.requestedBy ?? undefined,
    approvedBy: record.approvedBy ?? undefined,
    reason: record.reason ?? undefined,
    execution: record.execution ?? undefined,
    createdAt: record.createdAt ? new Date(record.createdAt).getTime() : Date.now(),
    decidedAt: record.decidedAt ? new Date(record.decidedAt).getTime() : undefined
  };
}

export async function createApprovalRequest(input: CreateApprovalInput): Promise<ApprovalRequest> {
  if (!useDatabase) {
    return addApprovalRequest({
      agentId: input.agentId,
      action: input.action,
      payload: input.payload ?? {},
      manifest: input.manifest,
      requestedBy: input.requestedBy
    });
  }
  const client = (prisma as any).agentApproval;
  const record = await client.create({
    data: {
      agentId: input.agentId,
      action: input.action,
      payload: input.payload ?? undefined,
      manifest: input.manifest ?? undefined,
      status: "pending",
      requestedBy: input.requestedBy ?? undefined
    }
  });
  return mapDbRecord(record);
}

export async function listApprovalRequests(): Promise<{ pending: ApprovalRequest[]; history: ApprovalRequest[]; total: number }> {
  if (!useDatabase) {
    const pending = approvalRequests.filter((req) => req.status === "pending");
    const history = approvalRequests.filter((req) => req.status !== "pending");
    return { pending, history, total: approvalRequests.length };
  }
  const client = (prisma as any).agentApproval;
  const rows = await client.findMany({ orderBy: { createdAt: "desc" } });
  const records = rows.map(mapDbRecord);
  const pending = records.filter((req) => req.status === "pending");
  const history = records.filter((req) => req.status !== "pending");
  return { pending, history, total: records.length };
}

export async function getApprovalRequest(id: string): Promise<ApprovalRequest | null> {
  if (!useDatabase) {
    return approvalById[id] ?? null;
  }
  const client = (prisma as any).agentApproval;
  const record = await client.findUnique({ where: { id } });
  return record ? mapDbRecord(record) : null;
}

export async function updateApproval(id: string, patch: Partial<ApprovalRequest>): Promise<ApprovalRequest | null> {
  if (!useDatabase) {
    return updateApprovalRequest(id, patch);
  }
  const client = (prisma as any).agentApproval;
  const data: Record<string, unknown> = {};
  if (patch.status !== undefined) data.status = patch.status;
  if (patch.requestedBy !== undefined) data.requestedBy = patch.requestedBy;
  if (patch.approvedBy !== undefined) data.approvedBy = patch.approvedBy;
  if (patch.reason !== undefined) data.reason = patch.reason;
  if (patch.payload !== undefined) data.payload = patch.payload;
  if (patch.manifest !== undefined) data.manifest = patch.manifest;
  if (patch.execution !== undefined) data.execution = patch.execution;
  if (patch.decidedAt !== undefined) data.decidedAt = new Date(patch.decidedAt);
  const record = await client.update({ where: { id }, data });
  return mapDbRecord(record);
}
