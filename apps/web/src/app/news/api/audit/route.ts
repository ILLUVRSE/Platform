import { NextResponse } from "next/server";

const inMemoryLog: any[] = [];

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !body.message) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const entry = {
    id: `${Date.now()}`,
    ...body,
    createdAt: new Date().toISOString(),
  };
  inMemoryLog.unshift(entry);
  return NextResponse.json({ ok: true, entry });
}

export async function GET() {
  return NextResponse.json({ entries: inMemoryLog.slice(0, 100) });
}
