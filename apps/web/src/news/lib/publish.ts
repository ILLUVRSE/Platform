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
