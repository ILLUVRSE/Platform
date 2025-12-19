import prisma from "@news/lib/prisma";
import { LiveClient } from "./live-client";

export default async function LivePage() {
  const streams = await prisma.stream.findMany({
    where: { isPublic: true },
    orderBy: [{ status: "desc" }, { updatedAt: "desc" }],
  });

  const normalized = streams.map((stream) => ({
    id: stream.id,
    name: stream.name,
    slug: stream.slug,
    embedUrl: stream.embedUrl,
    posterImage: stream.posterImage,
    locationName: stream.locationName,
    countryCode: stream.countryCode,
    attribution: stream.attribution,
    licenseNote: stream.licenseNote,
    status: stream.status,
  }));

  return <LiveClient streams={normalized} />;
}
