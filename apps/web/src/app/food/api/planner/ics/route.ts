import { NextResponse } from 'next/server';
import { getSessionUser } from '@food/lib/server/auth';
import { getUserData, readDB } from '@food/lib/server/db';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { planner } = await getUserData(user.id);
  const db = await readDB();
  const recipes = db.recipes[user.id] || [];
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Moms Kitchen//Meal Planner//EN',
  ];

  planner.forEach((entry) => {
    const recipe = recipeMap.get(entry.recipeId);
    if (!recipe) return;
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${entry.id}@moms-kitchen`);
    lines.push(`DTSTART;VALUE=DATE:${entry.date.replace(/-/g, '')}`);
    lines.push(`SUMMARY:${recipe.title}`);
    lines.push(`DESCRIPTION:Cook ${recipe.title}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  const body = lines.join('\r\n');
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="meal-plan.ics"',
    },
  });
}
