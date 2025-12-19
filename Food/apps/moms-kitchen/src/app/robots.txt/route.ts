import { NextResponse } from 'next/server';

export async function GET() {
  const body = `User-agent: *
Allow: /
Sitemap: ${process.env.NEXT_PUBLIC_APP_URL || ''}/sitemap.xml`;
  return new NextResponse(body, { headers: { 'Content-Type': 'text/plain' } });
}
