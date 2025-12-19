import { NextResponse } from "next/server";
import prisma from "@news/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region")?.toUpperCase();
  const lang = searchParams.get("lang") || undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

  const people = await prisma.person.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      bio: true,
    },
  });

  return NextResponse.json({ people, region, lang });
}
