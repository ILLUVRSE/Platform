import { NextResponse } from "next/server";
import prisma from "@news/lib/prisma";

export async function GET() {
  const articles = await prisma.article.findMany({
    where: { published: true, status: "published" },
    orderBy: { publishedAt: "desc" },
    take: 200,
    select: {
      title: true,
      slug: true,
      countryCode: true,
      region: true,
      locale: true,
      license: true,
      sourceReliability: true,
      publishedAt: true,
    },
  });

  const header = "title,slug,countryCode,region,locale,license,sourceReliability,publishedAt";
  const rows = articles.map((a) =>
    [
      a.title.replace(/"/g, '""'),
      a.slug,
      a.countryCode ?? "",
      a.region ?? "",
      a.locale ?? "",
      a.license ?? "",
      a.sourceReliability ?? "",
      a.publishedAt?.toISOString() ?? "",
    ]
      .map((v) => `"${v}"`)
      .join(","),
  );

  const csv = [header, ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
    },
  });
}
