import { NextResponse } from "next/server";
import prisma from "@news/lib/prisma";

export async function GET() {
  const stations = await prisma.station.findMany({
    where: { isPublic: true },
    orderBy: [{ status: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      streamUrl: true,
      websiteUrl: true,
      logoUrl: true,
      countryCode: true,
      region: true,
      city: true,
      language: true,
      genre: true,
      bitrate: true,
      codec: true,
      status: true,
      lastCheckedAt: true,
      failureCount: true,
      isPublic: true,
      notes: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ stations });
}
