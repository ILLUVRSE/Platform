import { NextResponse } from 'next/server';
import prisma from '@news/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  if (!slug) {
    return NextResponse.json({ available: false, message: 'Slug missing' }, { status: 400 });
  }
  const exists = await prisma.article.findUnique({ where: { slug } });
  return NextResponse.json({ available: !exists });
}
