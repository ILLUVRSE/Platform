import { NextResponse } from "next/server";
import prisma from "@news/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const text = `${article.title}\n\n${article.content}`;

  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${article.slug}.txt"`,
    },
  });
}
