import { NextResponse } from "next/server";
import prisma from "@news/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region")?.toUpperCase();
  const lang = searchParams.get("lang") || undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

  const titles = await prisma.title.findMany({
    orderBy: { releaseDate: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      description: true,
      releaseDate: true,
      posterUrl: true,
      genres: true,
      whereToWatch: true,
    },
  });

  return NextResponse.json({ titles, region, lang });
}
