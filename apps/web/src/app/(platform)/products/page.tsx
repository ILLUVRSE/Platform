import Link from "next/link";
import { Card, PageSection, Pill, ProofCard, StatBadge } from "@illuvrse/ui";
import { surfaceUrls } from "@/lib/navigation";

const aceStages = [
  { title: "Identity", detail: "id, name, version, runtime image; defaults prefilled with format validation." },
  { title: "Capabilities", detail: "Toggle generator, catalog, scheduler, liveloop, proof, moderator, monitor, assistant — or apply a preset." },
  { title: "Runtime & models", detail: "Pick trigger (cron/event/http), llmId + ttsId, publishLiveLoop metadata, and resources." },
  { title: "Avatar & activation", detail: "Activation line, avatar assets/voice url, preview block for the activation moment." },
  { title: "Review & proof", detail: "Readonly manifest JSON, SHA-256 compute, SentinelNet verdict, Kernel signing + Agent Manager register." }
];

const productStack = [
  {
    title: "ACE Wizard",
    body: "5-step creation zone with live manifest JSON, autosave/import/export, and draft presets ready to send to Playground.",
    href: "/ace/create"
  },
  {
    title: "Kernel + SentinelNet",
    body: "Signer, policy evaluator, and proof verification. SHA-256 digest, signature, verdict, and ledger references.",
    href: "/developers#ace-spec"
  },
  {
    title: "StorySphere LiveLoop",
    body: "Studio + Player to showcase signed agents and their output. Publish/preview flows reuse the same manifest + proof trail.",
    href: "/storysphere"
  }
];

const guardrails = [
  "Inline validation for ids, required fields, and capability toggles.",
  "Live SHA-256 digest computed client-side with WebCrypto.",
  "Policy verdict card (SentinelNet) + Kernel verify/sign stubs for local testing.",
  "Local draft autosave with import/export so teams can collaborate asynchronously."
];

const surfaceStack = [
  {
    title: "Mom Kitech",
    body: "FoodNetwork-style surface for recipes, menus, and creator cooking workflows.",
    href: surfaceUrls.food
  },
  {
    title: "Gridstock",
    body: "CNBC/Bloomberg-style terminal for markets, research, and trading play.",
    href: surfaceUrls.gridstock
  }
];

export default function ProductsPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl space-y-4">
            <Pill className="bg-teal-50 text-teal-700">ACE creation zone</Pill>
            <h1 className="text-4xl font-semibold leading-tight">Build, sign, and activate agents with proof-first defaults.</h1>
            <p className="text-lg text-slate-700">
              The ACE wizard assembles your manifest across Identity, Capabilities, Runtime/Models, Avatar/Activation, and Review. Every step feeds live JSON, SHA-256 digest, and policy-ready metadata.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/ace/create"
                className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow-card transition hover:opacity-95"
              >
                Start ACE wizard
              </Link>
              <Link
                href="/developers#ace-spec"
                className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-teal-500/70 hover:text-teal-700"
              >
                View ACE spec
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              {["Live manifest preview", "Autosave drafts", "Import/export JSON", "Kernel + Sentinel-ready"].map((item) => (
                <Pill key={item} className="bg-slate-100 text-slate-700">
                  {item}
                </Pill>
              ))}
            </div>
          </div>
          <div className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-card">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Proof snapshot</div>
            <ProofCard
              sha="c2a4...9f7e"
              signer="Kernel"
              timestamp="Pending signature"
              policyVerdict="SentinelNet stub"
            />
            <div className="grid grid-cols-2 gap-3">
              <StatBadge label="ACE draft" value="Autosave ON" variant="success" />
              <StatBadge label="Register" value="Agent Manager" variant="neutral" />
            </div>
          </div>
        </div>
      </section>

      <PageSection eyebrow="ACE flow" title="Wizard stages at a glance">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {aceStages.map((stage) => (
            <Card
              key={stage.title}
              title={stage.title}
              body={<p className="text-sm text-slate-700">{stage.detail}</p>}
              footer={
                stage.title === "Review & proof" ? (
                  <span className="text-sm text-teal-700">SHA-256 + verify before register</span>
                ) : null
              }
            />
          ))}
        </div>
      </PageSection>

      <PageSection eyebrow="Products" title="What ships together">
        <div className="grid gap-4 md:grid-cols-3">
          {productStack.map((product) => (
            <Card
              key={product.title}
              title={product.title}
              body={<p>{product.body}</p>}
              footer={
                <Link href={product.href} className="text-sm font-semibold text-teal-700 underline underline-offset-4">
                  Open {product.title}
                </Link>
              }
            />
          ))}
        </div>
      </PageSection>

      <PageSection eyebrow="Surfaces" title="New destinations inside ILLUVRSE">
        <div className="grid gap-4 md:grid-cols-2">
          {surfaceStack.map((surface) => (
            <Card
              key={surface.title}
              title={surface.title}
              body={<p>{surface.body}</p>}
              footer={
                <Link href={surface.href} className="text-sm font-semibold text-teal-700 underline underline-offset-4">
                  Open {surface.title}
                </Link>
              }
            />
          ))}
        </div>
      </PageSection>

      <PageSection eyebrow="Guardrails" title="Proof, validation, and handoff">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card
            title="How we keep agents trustworthy"
            body={
              <ul className="list-disc space-y-2 pl-4 text-sm text-slate-700">
                {guardrails.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            }
            footer={
              <Link href="/developers#verify" className="text-sm font-semibold text-teal-700 underline underline-offset-4">
                Verify a manifest
              </Link>
            }
          />
          <Card
            title="Register + send to Playground"
            body={
              <div className="space-y-2 text-sm text-slate-700">
                <p>One-click handoff writes the manifest to localStorage + cookie so Playground can load it instantly.</p>
                <p>Register uses Kernel sign + Agent Manager stubs so you can test the full path even if backend isn’t live.</p>
                <p className="text-slate-700">Errors surface inline with severity so you know why a register is blocked.</p>
              </div>
            }
            footer={
              <div className="text-sm text-slate-700">
                See it in action inside the ACE Review step.
              </div>
            }
          />
        </div>
      </PageSection>

      <PageSection eyebrow="Activation" title="Avatar, voice, and launch moment">
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            title="Activation preview"
            body={
              <div className="space-y-3 text-sm text-slate-700">
                <p>Preview the activation line, avatar assets, and voice sample link before pushing to Playground.</p>
                <p>Keep assets in S3 or HTTPS; we’ll carry the URLs and voice activation text into the manifest.</p>
              </div>
            }
          />
          <Card
            title="Launch conditions"
            body={
              <div className="space-y-2 text-sm text-slate-700">
                <p>Pick triggers (cron/event/http) and opt into LiveLoop publishing so agents ship with clear activation rules.</p>
                <p>Runtime image + resources sit alongside capabilities so operators see what’s deployed at a glance.</p>
              </div>
            }
            footer={
              <Link href="/storysphere" className="text-sm font-semibold text-teal-700 underline underline-offset-4">
                See the launch surface
              </Link>
            }
          />
        </div>
      </PageSection>
    </div>
  );
}
