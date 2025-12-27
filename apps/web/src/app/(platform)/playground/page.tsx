import { Playground3DLazy } from "./Playground3DLazy";
import { ManifestUpload } from "./ManifestUpload";
import { PlaygroundStorageControls } from "./PlaygroundStorageControls";
import { PublishDrawer } from "./PublishDrawer";
import { RecentManifests } from "./RecentManifests";
import { buildMetadata, buildJsonLd } from "@/lib/metadata";

const title = "ILLUVRSE Playground | Business Park and agent control room";
const description =
  "Tokyo-meets-Venice Business Park with hive towers, agent previews, and a 3D control room for signed manifests.";

export const metadata = buildMetadata({
  title,
  description,
  path: "/playground"
});

const pageJsonLd = buildJsonLd({
  title,
  description,
  path: "/playground",
  type: "WebApplication"
});

export default function PlaygroundPage() {
  return (
    <>
      <script type="application/ld+json">{JSON.stringify(pageJsonLd)}</script>
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">ILLUVRSE Playground</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">ILLUVRSE Business Park</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            A Tokyo-meets-Venice campus where every tower routes into an ILLUVRSE surface. Navigate the park, enter
            a building, and open its workspace in a new tab. Wumpa Island Rift now lives in{" "}
            <a className="font-semibold text-teal-600 hover:text-teal-700" href="/games/wumpa-island/index.html">
              GameGrid
            </a>
            .
          </p>
        </section>

      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[78vh] w-[100vw] overflow-hidden border-y border-slate-200 bg-slate-900">
        <iframe
          title="ILLUVRSE Playground"
          src="/playground/index.html"
          className="h-full w-full"
          allowFullScreen
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-card">
        <p>Controls: WASD to move, drag to look, press E or Enter to enter a building, click kiosks to select agents.</p>
      </section>

        <section className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">Agent Playground</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">3D control room + live agent actions</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Load manifests, trigger actions, and watch live status updates in the 3D scene. This is the operator-facing
            VR control room for signed agents.
          </p>
          <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-4">
              <Playground3DLazy handoffManifest={null} />
            </div>
            <div className="space-y-4">
              <ManifestUpload />
              <PlaygroundStorageControls />
              <RecentManifests />
              <PublishDrawer />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
