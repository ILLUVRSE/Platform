import Link from "next/link";
import { Card, PageSection } from "@illuvrse/ui";
import { gameGridManifest } from "../../../storysphere/src/lib/gameGridManifest";

export function GameGridListing() {
  return (
    <PageSection eyebrow="GameGrid" title="Playable arcade inside StorySphere">
      <div className="grid gap-4 md:grid-cols-3">
        {gameGridManifest.map((game) => (
          <Card
            key={game.id}
            title={game.title}
            body={<p className="text-sm text-slate-200/80">{game.description}</p>}
            footer={
              <Link
                href={`/games/${game.id}`}
                className="text-sm font-semibold text-teal-300 underline underline-offset-4"
              >
                Details
              </Link>
            }
          />
        ))}
      </div>
    </PageSection>
  );
}
