import { NextResponse } from 'next/server';

export async function GET() {
  const base = process.env.NEXT_PUBLIC_PLATFORM_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  const body = `User-agent: *
Allow: /
Sitemap: ${base}/food/sitemap.xml`;
  return new NextResponse(body, { headers: { 'Content-Type': 'text/plain' } });
}
