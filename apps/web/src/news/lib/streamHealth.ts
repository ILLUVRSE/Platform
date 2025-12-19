import prisma from '@news/lib/prisma';
import { AvailabilityStatus, Station } from '@illuvrse/db';

const timeoutMs = 8000;

async function checkUrl(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    return res.ok;
  } catch {
    try {
      const res = await fetch(url, { method: 'GET', signal: controller.signal });
      return res.ok;
    } catch {
      return false;
    }
  } finally {
    clearTimeout(timer);
  }
}

export async function checkStationHealth(station: Station) {
  const ok = await checkUrl(station.streamUrl);
  const status = ok ? AvailabilityStatus.online : AvailabilityStatus.offline;
  const failureCount = ok ? 0 : (station.failureCount || 0) + 1;

  const updated = await prisma.station.update({
    where: { id: station.id },
    data: {
      status,
      lastCheckedAt: new Date(),
      failureCount,
    },
  });

  return updated;
}

export async function checkAllStations() {
  const stations = await prisma.station.findMany({ where: { isPublic: true } });
  const results = [];

  for (const station of stations) {
    try {
      const updated = await checkStationHealth(station);
      results.push({ id: station.id, name: station.name, status: updated.status, ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Health check failed';
      results.push({ id: station.id, name: station.name, status: station.status, ok: false, message });
    }
  }

  return results;
}
