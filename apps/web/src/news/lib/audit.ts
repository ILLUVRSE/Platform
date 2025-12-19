import prisma from '@news/lib/prisma';

type AuditInput = {
  actor?: string | null;
  action: string;
  entityId?: string | null;
  entityType?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
};

export async function logAudit(entry: AuditInput) {
  const safeMeta = entry.metadata ? (entry.metadata as object) : undefined;
  return prisma.auditLog.create({
    data: {
      actor: entry.actor ?? null,
      action: entry.action,
      entityId: entry.entityId ?? null,
      entityType: entry.entityType ?? null,
      summary: entry.summary,
      metadata: safeMeta,
    },
  });
}

export async function latestAudit(limit = 20) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
