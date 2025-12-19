import { NextResponse } from 'next/server';
import { readDB } from '@/lib/server/db';

export async function GET(req: Request, { params }: { params: { shareId: string } }) {
  const db = await readDB();
  const { shareId } = params;
  const url = new URL(req.url);
  const pin = url.searchParams.get('pin');

  for (const userId of Object.keys(db.recipes)) {
    const recipe = (db.recipes[userId] || []).find(
      (r) => r.shareId === shareId && r.isPublic
    );
    if (recipe) {
      if (recipe.sharePin && recipe.sharePin !== pin) {
        return NextResponse.json({ error: 'PIN required' }, { status: 401 });
      }
      return NextResponse.json({ recipe });
    }
  }

  return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
}
