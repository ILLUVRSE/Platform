import { Card, PageSection, Pill } from "@illuvrse/ui";
import Link from "next/link";
import { ManifestViewer } from "../../components/ManifestViewer";
import type { AceAgentManifest } from "@illuvrse/contracts";
import { cookies } from "next/headers";

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

export default function PlaygroundPage() {
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

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-700/70 bg-slate-800/70 px-8 py-10 shadow-card">
        <Pill className="bg-teal-600/20 text-teal-200">Playground</Pill>
        <h1 className="mt-3 text-4xl font-semibold">Deploy and preview ACE agents</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-200/90">
          Drop in your ACE Agent Manifest, spin up a sandbox, and preview activation before you publish to Marketplace or LiveLoop. All runs in isolated demo mode.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/products"
            className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow-card transition hover:opacity-95"
          >
            Back to ACE builder
          </Link>
          <Link
            href="/checkout"
            className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-cream transition hover:border-teal-500/70 hover:text-teal-200"
          >
            Publish after preview
          </Link>
        </div>
      </section>

      <PageSection eyebrow="1. Import" title="Load your Agent Manifest">
        <Card
          title="Manifest upload"
          body={
            <div className="space-y-3 text-sm text-slate-200/80">
              <p>Upload the signed ACE manifest (Kernel-signed) to start a sandbox preview.</p>
              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                <div className="text-[12px] text-slate-200/70">Example</div>
                <pre className="mt-2 overflow-auto rounded-lg bg-slate-800 p-3 text-[12px] leading-relaxed text-cream">
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
      </PageSection>

      <PageSection eyebrow="2. Preview" title="Sandbox activation">
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            title="Preview activation"
            body={<p className="text-sm text-slate-200/80">Run activation moment (lighting pulse, voice line) without publishing. Validate appearance, personality, and voice settings.</p>}
          />
          <Card
            title="Behavior probe"
            body={<p className="text-sm text-slate-200/80">Send scripted prompts to test traits, attributes, and voice style before release.</p>}
          />
          {/* @ts-expect-error Server Component */}
          <ManifestViewer manifest={manifestToUse} />
        </div>
      </PageSection>

      <PageSection eyebrow="3. Publish" title="Push to Marketplace or LiveLoop">
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            title="Marketplace publish"
            body={<p className="text-sm text-slate-200/80">When satisfied, publish to Marketplace with Finance receipt + ArtifactPublisher delivery proofs.</p>}
            footer={<Link href="/marketplace" className="text-teal-300 underline underline-offset-4 text-sm">Go to Marketplace</Link>}
          />
          <Card
            title="LiveLoop placement"
            body={<p className="text-sm text-slate-200/80">Add the agent’s activation or cinematic to LiveLoop playlists with proofs.</p>}
            footer={<Link href="/storysphere" className="text-teal-300 underline underline-offset-4 text-sm">Open StorySphere</Link>}
          />
        </div>
      </PageSection>
    </div>
  );
}
