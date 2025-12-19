import prisma from "@news/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  const article = await prisma.article.findUnique({
    where: { slug },
    select: {
      slug: true,
      sourceUrl: true,
      sources: true,
      license: true,
      countryCode: true,
      region: true,
      locale: true,
      sourceReliability: true,
    },
  });

  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sources =
    (Array.isArray(article.sources) &&
      (article.sources as { name?: string; url?: string }[]).filter(
        (s) => typeof s?.name === "string" && typeof s?.url === "string",
      )) ||
    [];

  return NextResponse.json({
    slug: article.slug,
    license: article.license,
    countryCode: article.countryCode,
    region: article.region,
    locale: article.locale,
    sourceReliability: article.sourceReliability,
    sources,
    canonical: article.sourceUrl,
  });
}
