import { checkAllStations, checkStationHealth } from '@news/lib/streamHealth';
import { logAudit } from '@news/lib/audit';
import prisma from '@news/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { stationId } = body || {};

  try {
    if (stationId) {
      const station = await prisma.station.findUnique({ where: { id: stationId } });
      if (!station) {
        return NextResponse.json({ ok: false, error: 'Station not found' }, { status: 404 });
      }
      const updated = await checkStationHealth(station);
      await logAudit({
        action: 'stream.health',
        entityId: station.id,
        entityType: 'station',
        summary: `Health check ${station.name}: ${updated.status}`,
      });
      return NextResponse.json({ ok: true, station: updated });
    }

    const results = await checkAllStations();
    await logAudit({
      action: 'stream.healthAll',
      summary: 'Bulk health check for all stations',
      metadata: { count: results.length },
    });
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Health check failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
