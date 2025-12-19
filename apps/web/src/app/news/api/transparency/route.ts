import { NextResponse } from "next/server";

export async function GET() {
  const entries = [
    {
      id: "alert-approval-1",
      type: "alert",
      region: "WORLD",
      actor: "admin@example.com",
      message: "Critical alert approved and published.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "ingest-1",
      type: "ingest",
      region: "WORLD",
      actor: "system",
      message: "RSS ingestion completed for BBC/NPR/UN/AJ.",
      createdAt: new Date().toISOString(),
    },
  ];

  return NextResponse.json({ entries });
}
