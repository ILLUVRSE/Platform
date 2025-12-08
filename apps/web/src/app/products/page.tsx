import Link from "next/link";
import { Card, PageSection, Pill, ProofCard } from "@illuvrse/ui";

const archetypes = ["Guardian", "Strategist", "Explorer", "Catalyst", "Oracle"];
const traits = ["Loyal", "Calculated", "Curious", "Empathetic", "Aggressive", "Playful", "Stoic", "Ambitious", "Protective", "Mischievous"];
const attributes = ["Intelligence", "Empathy", "Creativity", "Combat Instinct", "Strategy", "Curiosity", "Risk Appetite", "Communication Skill", "Adaptability", "Tenacity"];
const voiceStyles = ["Tactical", "Elegant", "Savage", "Humorous", "Neutral", "Enigmatic", "Mentor-like"];
const addOns = ["Skins", "Armor sets", "Particle effects", "Emotes", "Personality trait packs", "Ability modules", "Memory expansions", "Lore fragments", "Custom voice filters"];

export default function ProductsPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-700/70 bg-slate-800/70 px-8 py-10 shadow-card">
        <Pill className="bg-teal-600/20 text-teal-200">ACE — Agent Creation Experience</Pill>
        <h1 className="mt-3 text-4xl font-semibold">Build your agent with Madden-level control and a bonded activation.</h1>
        <p className="mt-3 max-w-3xl text-lg text-slate-200/90">
          Five-stage creation: Identity → Appearance Studio → Personality Core → Attributes → Voice & Activation. Every choice rolls into a signed Agent Manifest governed by Kernel + SentinelNet.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/ace/create"
            className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow-card transition hover:opacity-95"
          >
            Start ACE
          </Link>
          <Link
            href="#activation"
            className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-cream transition hover:border-teal-500/70 hover:text-teal-200"
          >
            Preview activation
          </Link>
        </div>
      </section>

      <PageSection eyebrow="Stage 1" title="Identity selection">
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            title="Archetypes"
            body={
              <div className="flex flex-wrap gap-2 text-sm">
                {archetypes.map((item) => (
                  <Pill key={item} className="bg-slate-700 text-slate-200">
                    {item}
                  </Pill>
                ))}
              </div>
            }
          />
          <Card
            title="Alignment spectrums"
            body={
              <div className="space-y-2 text-sm text-slate-200/80">
                <div>Directive-Driven ←→ Autonomous</div>
                <div>Passive ←→ Initiative-Taking</div>
                <div>Analytical ←→ Emotional</div>
              </div>
            }
          />
        </div>
      </PageSection>

      <PageSection eyebrow="Stage 2" title="Appearance studio — premium morphs">
        <div className="grid gap-4 md:grid-cols-3">
          <Card
            title="Morphing controls"
            body={<p className="text-sm text-slate-200/80">Face, jawline, eyes, brows, nose, mouth, cheekbones, skull, ears.</p>}
          />
          <Card
            title="Body & style presets"
            body={<p className="text-sm text-slate-200/80">Height, build, stance, cyber/primal/armoured/organic/mythical/sleek/corrupted/ascended.</p>}
          />
          <Card
            title="Surfaces & animations"
            body={<p className="text-sm text-slate-200/80">Textures, gradients, glow, idle loops, walk/run styles, eye movement (focused/curious/scanning/soft).</p>}
          />
        </div>
      </PageSection>

      <PageSection eyebrow="Stage 3" title="Personality Core (the stuffing ritual, grown up)">
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            title="Trait matrix"
            body={
              <div className="flex flex-wrap gap-2 text-sm">
                {traits.map((t) => (
                  <Pill key={t} className="bg-slate-700 text-slate-200">
                    {t}
                  </Pill>
                ))}
              </div>
            }
          />
          <Card
            title="Interaction style & emotional range"
            body={
              <div className="space-y-2 text-sm text-slate-200/80">
                <div>Styles: Direct, Encouraging, Analytical, Entertainer, Mentor, Mysterious, Warm.</div>
                <div>Emotional range: Minimal, Controlled, Expressive, Dynamic.</div>
              </div>
            }
          />
        </div>
      </PageSection>

      <PageSection eyebrow="Stage 4" title="Behavior & Skill attributes">
        <div className="grid gap-4 md:grid-cols-3">
          <Card
            title="Attribute sliders (0–100)"
            body={
              <ul className="list-disc space-y-1 pl-4 text-sm text-slate-200/80">
                {attributes.map((attr) => (
                  <li key={attr}>{attr}</li>
                ))}
              </ul>
            }
          />
          <Card
            title="Preset builds"
            body={
              <div className="flex flex-wrap gap-2 text-sm">
                {["Analyst", "Explorer", "Warrior", "Diplomat", "Inventor", "Chaos Agent", "Ascended Hybrid"].map((p) => (
                  <Pill key={p} className="bg-slate-700 text-slate-200">
                    {p}
                  </Pill>
                ))}
              </div>
            }
          />
          <Card
            title="Perk slots"
            body={
              <div className="flex flex-wrap gap-2 text-sm">
                {["Tactical Prediction", "Memory Recall Boost", "Emotional Tuning", "Lore Mastery", "Stealth Interaction", "High-Risk Logic", "Ultra-Empathy Mode", "Vision Alignment Lock"].map((perk) => (
                  <Pill key={perk} className="bg-slate-700 text-slate-200">
                    {perk}
                  </Pill>
                ))}
              </div>
            }
          />
        </div>
      </PageSection>

      <PageSection eyebrow="Stage 5" title="Voice, style & activation" id="activation">
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            title="Voice builder"
            body={
              <div className="space-y-2 text-sm text-slate-200/80">
                <div>Base voice → tweak tone, pacing, warmth, assertiveness, accent.</div>
                <div>FX: Ethereal resonance, metallic undertone, whisper harmonics, deep echo, light flares.</div>
                <div className="flex flex-wrap gap-2">
                  {voiceStyles.map((style) => (
                    <Pill key={style} className="bg-slate-700 text-slate-200">
                      {style}
                    </Pill>
                  ))}
                </div>
              </div>
            }
          />
          <Card
            title="Activation moment"
            body={
              <div className="space-y-3 text-sm text-slate-200/80">
                <p>Lighting pulse, sound cue, eye contact, and a personalized line (e.g., “Initialization complete. I’m ready to move with you.”).</p>
                <ProofCard sha="agent-manifest-sha" signer="Kernel" timestamp="Pending" />
              </div>
            }
          />
        </div>
      </PageSection>

      <PageSection eyebrow="Progression" title="Evolve your agent over time">
        <div className="grid gap-4 md:grid-cols-3">
          <Card
            title="Growth paths"
            body={<p className="text-sm text-slate-200/80">Skill XP, behaviors unlocked, memory modules, bond levels, territory/domain mastery, combat/strategy proficiency.</p>}
          />
          <Card
            title="Milestone events"
            body={<p className="text-sm text-slate-200/80">Evolution prompts, cosmetic unlocks, new voice/emote packs, rare personality fragments.</p>}
          />
          <Card
            title="Social loop"
            body={<p className="text-sm text-slate-200/80">Character cards, show-off animations, battle simulations, public profile, agent gallery.</p>}
          />
        </div>
      </PageSection>

      <PageSection eyebrow="Marketplace" title="High-value add-ons">
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            title="Sellable add-ons"
            body={
              <div className="flex flex-wrap gap-2 text-sm">
                {addOns.map((item) => (
                  <Pill key={item} className="bg-slate-700 text-slate-200">
                    {item}
                  </Pill>
                ))}
              </div>
            }
            footer={
              <Link href="/marketplace" className="text-sm font-semibold text-teal-300 underline underline-offset-4">
                Browse marketplace
              </Link>
            }
          />
          <Card
            title="Recurring value"
            body={<p className="text-sm text-slate-200/80">Memory expansions, ability add-ons, seasonal personality packs, evolution themes, limited-time trait sets, collabs (voices/skins/lore).</p>}
          />
        </div>
      </PageSection>
    </div>
  );
}
