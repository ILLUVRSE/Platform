import prisma from '@news/lib/prisma';

export async function validateAndConsumeToken(token?: string | null) {
  if (!token) return { ok: true }; // public if no token provided
  // @ts-expect-error guard for migration
  if (!prisma.apiToken) return { ok: false, error: 'API tokens not available. Run migrations.' };
  // @ts-expect-error guarded above
  const apiToken = await prisma.apiToken.findUnique({ where: { token } });
  if (!apiToken || !apiToken.active) return { ok: false, error: 'Invalid or inactive token' };
  if (apiToken.usageCount >= apiToken.rateLimit) return { ok: false, error: 'Rate limit exceeded' };
  // @ts-expect-error guarded above
  await prisma.apiToken.update({
    where: { id: apiToken.id },
    data: { usageCount: { increment: 1 } },
  });
  return { ok: true };
}
