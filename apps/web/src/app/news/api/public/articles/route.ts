import { NextResponse } from "next/server";
import prisma from "@news/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region")?.toUpperCase();
  const lang = searchParams.get("lang") || undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

  const articles = await prisma.article.findMany({
    where: {
      published: true,
      status: "published",
      publishedAt: { lte: new Date() },
      ...(region && region !== "WORLD" ? { countryCode: region } : {}),
      ...(lang
        ? {
            OR: [{ locale: lang }, { locale: { startsWith: `${lang}-` } }],
          }
        : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      summary: true,
      coverImage: true,
      publishedAt: true,
      countryCode: true,
      region: true,
      locale: true,
      license: true,
      sourceUrl: true,
      sourceReliability: true,
      tags: { select: { name: true, slug: true } },
    },
  });

  return NextResponse.json({ articles });
}
