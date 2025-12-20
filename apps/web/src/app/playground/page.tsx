import { Card, PageSection, Pill } from "@illuvrse/ui";
import Link from "next/link";
import { ManifestViewer } from "../../components/ManifestViewer";
import type { AceAgentManifest } from "@illuvrse/contracts";
import { cookies } from "next/headers";
import { TutorialManifests } from "./TutorialManifests";
import { Playground3D } from "./Playground3D";
import { ManifestUpload } from "./ManifestUpload";
import { PlaygroundStorageControls } from "./PlaygroundStorageControls";
import { PublishDrawer } from "./PublishDrawer";
import { RecentManifests } from "./RecentManifests";

const playgroundManifest: AceAgentManifest = {
  id: "agent.avatar-demo.001",
  name: "AvatarDemo",
  version: "0.1.0",
  description: "Avatar + generator agent for sandbox previews",
  archetype: "Performer",
  capabilities: ["generator", "liveloop"],
  triggers: [{ type: "http", path: "/hook/generate", method: "POST" }],
  modelBindings: { llm: { id: "gpt-4o-mini", provider: "openai" }, tts: { id: "eleven.v1", voice: "bright" } },
  permissions: { storage: { read: ["avatars/"], write: ["previews/"] }, network: { outbound: true } },
  resources: { cpu: "1", memory: "2Gi", gpu: { count: 0 } },
  runtime: { container: { image: "illuvrse/agent-avatar-demo:dev" } },
  avatar: {
    appearance: { assets: ["s3://avatars/demo"], stylePreset: "stylized" },
    voice: { activationLine: "Let’s light up the loop." },
    personality: { traits: ["Curious", "Playful"], archetype: "Guide" }
  }
};

export default function PlaygroundPage({ searchParams }: { searchParams?: { source?: string } }) {
  let loadedManifest: AceAgentManifest | null = null;
  try {
    const cookieStore = cookies();
    const stored = cookieStore.get("ace-playground-manifest")?.value ?? "";
    if (stored) {
      loadedManifest = JSON.parse(decodeURIComponent(stored)) as AceAgentManifest;
    }
  } catch {
    loadedManifest = null;
  }

  const manifestToUse = loadedManifest ?? playgroundManifest;
  const fromAce = searchParams?.source === "ace";

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-card">
        <Pill className="bg-teal-100 text-teal-800">Playground</Pill>
        <h1 className="mt-3 text-4xl font-semibold text-slate-900">Deploy and preview ACE agents</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-700">
          Drop in your ACE Agent Manifest, spin up a sandbox, and preview activation before you publish to Marketplace or LiveLoop. All runs in isolated demo mode.
        </p>
        {fromAce ? (
          <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
            Manifest sent from ACE wizard loaded. You can preview or run actions immediately.
          </div>
        ) : null}
        <div className="mt-4 flex gap-3">
          <Link
            href="/products"
            className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow-card transition hover:opacity-95"
          >
            Back to ACE builder
          </Link>
          <Link
            href="/checkout"
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-teal-500/70 hover:text-teal-700"
          >
            Publish after preview
          </Link>
        </div>
      </section>

      <PageSection eyebrow="1. Import" title="Load your Agent Manifest">
        <Card
          title="Manifest upload"
          body={
            <div className="space-y-3 text-sm text-slate-700">
              <p>Upload the signed ACE manifest (Kernel-signed) to start a sandbox preview.</p>
              {/* @ts-expect-error Client Component */}
              <ManifestUpload />
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[12px] text-slate-600">Example</div>
                <pre className="mt-2 overflow-auto rounded-lg bg-white p-3 text-[12px] leading-relaxed text-slate-900">
{`{
  "agentId": "ace-001",
  "sha256": "...",
  "archetype": "Oracle",
  "traits": ["Curious","Protective","Stoic"],
  "attributes": { "Intelligence": 88, "Empathy": 72 }
}`}
                </pre>
              </div>
            </div>
          }
        />
        <div className="mt-4 space-y-2">
          <Pill className="bg-teal-50 text-teal-700">Tutorial agents</Pill>
          <p className="text-sm text-slate-600">Load a ready-made tutorial agent into Playground as a guided example.</p>
          {/* @ts-expect-error Client Component */}
          <TutorialManifests />
          {/* @ts-expect-error Client Component */}
          <PlaygroundStorageControls />
          {/* @ts-expect-error Client Component */}
          <RecentManifests />
        </div>
      </PageSection>

      <PageSection eyebrow="2. Preview" title="Sandbox activation">
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            title="Preview activation"
            body={<p className="text-sm text-slate-700">Run activation moment (lighting pulse, voice line) without publishing. Validate appearance, personality, and voice settings.</p>}
          />
          <Card
            title="Behavior probe"
            body={<p className="text-sm text-slate-700">Send scripted prompts to test traits, attributes, and voice style before release.</p>}
          />
          {/* @ts-expect-error Server Component */}
          <ManifestViewer manifest={manifestToUse} />
        </div>
      </PageSection>

      <PageSection eyebrow="2B" title="3D / VR prototype">
        {/* @ts-expect-error Client Component */}
        <Playground3D />
      </PageSection>

      <PageSection eyebrow="3. Publish" title="Push to Marketplace or LiveLoop">
        <div className="grid gap-4 md:grid-cols-3">
          <Card
            title="Marketplace publish"
            body={<p className="text-sm text-slate-700">When satisfied, publish to Marketplace with Finance receipt + ArtifactPublisher delivery proofs.</p>}
            footer={<Link href="/marketplace" className="text-teal-700 underline underline-offset-4 text-sm">Go to Marketplace</Link>}
          />
          <Card
            title="LiveLoop placement"
            body={<p className="text-sm text-slate-700">Add the agent’s activation or cinematic to LiveLoop playlists with proofs.</p>}
            footer={<Link href="/storysphere" className="text-teal-700 underline underline-offset-4 text-sm">Open StorySphere</Link>}
          />
          {/* @ts-expect-error Client Component */}
          <PublishDrawer />
        </div>
      </PageSection>
    </div>
  );
}
