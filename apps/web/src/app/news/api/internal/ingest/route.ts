import { ingestAllActive, ingestSource } from '@news/lib/ingest';
import { logAudit } from '@news/lib/audit';
import prisma from '@news/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { sourceId, publish } = body || {};

  try {
    if (sourceId) {
      const source = await prisma.source.findUnique({ where: { id: sourceId } });
      if (!source) {
        return NextResponse.json({ error: 'Source not found' }, { status: 404 });
      }
      const result = await ingestSource(sourceId, Boolean(publish));
      await logAudit({
        action: 'ingest.run',
        entityId: sourceId,
        entityType: 'source',
        summary: `Ingested ${source.name} (${result.created} new, ${result.updated} updated)`,
        metadata: { publish: Boolean(publish) },
      });
      return NextResponse.json({ ok: true, result });
    }

    const results = await ingestAllActive(Boolean(publish));
    await logAudit({
      action: 'ingest.runAll',
      summary: 'Ingested all active sources',
      metadata: { count: results.length, publish: Boolean(publish) },
    });
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ingest failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
