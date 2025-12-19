import prisma from '@news/lib/prisma';

export async function getSetting(key: string) {
  // @ts-expect-error guard for migration
  if (!prisma.setting) return null;
  // @ts-expect-error guarded above
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string | null) {
  // @ts-expect-error guard for migration
  if (!prisma.setting) return null;
  // @ts-expect-error guarded above
  return prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function isSafeMode() {
  const value = await getSetting('safe_mode');
  return value === 'on';
}
