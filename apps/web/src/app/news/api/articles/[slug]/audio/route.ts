import { NextResponse } from "next/server";
import prisma from "@news/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Placeholder until TTS is integrated.
  return NextResponse.json({
    message: "Audio generation is not yet enabled. Integrate TTS and stream audio here.",
    slug: article.slug,
  });
}
