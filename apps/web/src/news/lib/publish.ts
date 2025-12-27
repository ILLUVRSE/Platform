import prisma from '@news/lib/prisma';
import { logAudit } from './audit';

type ExecuteResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

// Execute an approved proposal. Currently supports "publish.article".
export async function executeProposal(proposalId: string): Promise<ExecuteResult> {
  // @ts-expect-error Guard for envs without migration
  if (!prisma.proposal) return { ok: false, error: 'Proposal model unavailable. Run migrations.' };

  // @ts-expect-error guarded above
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) return { ok: false, error: 'Proposal not found' };
  if (proposal.status !== 'approved') return { ok: false, error: 'Proposal not approved' };

  if (proposal.type === 'news.pitch') {
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: 'approved', reason: 'Pitch accepted' },
    });
    await logAudit({
      action: 'news.pitch.accept',
      entityId: proposal.id,
      entityType: 'proposal',
      summary: `News pitch accepted (${proposal.id})`,
      metadata: { proposalId: proposal.id, topic: (proposal.data as { topic?: string } | null)?.topic },
    });
    return { ok: true, message: 'Pitch accepted' };
  }

  if (proposal.type === 'alert.publish') {
    // @ts-expect-error guard for envs without migration
    if (!prisma.alert) return { ok: false, error: 'Alert model unavailable. Run migrations.' };
    const proposalData = (proposal.data || {}) as { message?: string; severity?: string; region?: string; language?: string };
    const message = proposalData.message || 'Alert';
    const severity = proposal.severity || proposalData.severity || 'info';
    const region = proposal.region || proposalData.region || 'WORLD';
    const language = proposal.language || proposalData.language || 'en';

    // @ts-expect-error guarded above
    const alert = await prisma.alert.create({
      data: {
        message,
        severity,
        region,
        language,
        status: 'published',
        publishedAt: new Date(),
      },
    });

    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: 'approved', reason: 'Executed' },
    });

    await logAudit({
      action: 'alert.publish',
      entityId: alert.id,
      entityType: 'alert',
      summary: `Alert published via proposal ${proposal.id}`,
      metadata: { proposalId: proposal.id, region, language },
    });

    return { ok: true, message: 'Alert published' };
  }

  if (proposal.type === 'publish.article') {
    if (!proposal.entityId) return { ok: false, error: 'Proposal missing article id' };
    const article = await prisma.article.findUnique({ where: { id: proposal.entityId } });
    if (!article) return { ok: false, error: 'Article not found' };

    await prisma.article.update({
      where: { id: proposal.entityId },
      data: {
        published: true,
        status: 'published',
        publishedAt: new Date(),
        region: proposal.region ?? article.region,
        locale: proposal.language ?? article.locale,
      },
    });

    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: 'approved', reason: 'Executed' },
    });

    await logAudit({
      action: 'publish.execute',
      entityId: proposal.entityId,
      entityType: 'article',
      summary: `Article published via proposal ${proposal.id}`,
      metadata: { proposalId: proposal.id, region: proposal.region, language: proposal.language },
    });

    return { ok: true, message: 'Article published' };
  }

  return { ok: false, error: 'Unsupported proposal type' };
}
