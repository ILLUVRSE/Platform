import { describe, expect, it } from "vitest";
import type { AceAgentManifest } from "@illuvrse/contracts";
import {
  computeStageErrors,
  summarizeDiff,
  parseAvatarAssets,
  validateAvatarFields,
  normalizeCpu,
  normalizeMemory,
  type StageFormState
} from "../../../../apps/web/src/app/(platform)/ace/create/utils";

describe("ACE utils", () => {
const baseState: StageFormState = {
  id: "agent.story-weaver.001",
  name: "StoryWeaver",
  version: "0.1.0",
  description: "demo",
  capabilities: ["generator"],
  runtimeImage: "illuvrse/image:dev",
  trigger: "event:job.requested",
  llmId: "gpt-4o-mini",
  ttsId: "eleven.v1",
  cpu: "500m",
  memory: "1Gi",
  avatarAssets: "s3://avatars/demo",
  avatarVoiceUrl: "https://cdn.example.com/voice.wav"
};

const baseManifest: AceAgentManifest = {
  id: baseState.id,
  name: baseState.name,
  version: baseState.version,
  description: baseState.description,
  archetype: "Oracle",
  capabilities: baseState.capabilities,
  triggers: [{ type: "event", event: "job.requested" }],
  modelBindings: { llm: { id: baseState.llmId, provider: "openai" }, tts: { id: baseState.ttsId, provider: "elevenlabs", voice: "calm" } },
  permissions: { storage: { write: ["previews/", "final/"] }, network: { outbound: true } },
  resources: { cpu: baseState.cpu, memory: baseState.memory },
  runtime: { container: { image: baseState.runtimeImage } },
  metadata: { publishToLiveLoop: false }
};

it("identity stage requires id/name/version/runtimeImage format", () => {
  const errors = computeStageErrors("identity", { ...baseState, id: "Bad Id", name: "", version: "", runtimeImage: "" });
  expect(errors.id).toContain("Use lowercase");
  expect(errors.name).toBe("Required");
  expect(errors.version).toBe("Required");
  expect(errors.runtimeImage).toBe("Required");
});

it("capabilities stage requires at least one capability", () => {
  const errors = computeStageErrors("capabilities", { ...baseState, capabilities: [] });
  expect(errors.capabilities).toBe("Pick at least one capability");
});

it("runtime stage requires trigger, llm, tts, and resources", () => {
  const errors = computeStageErrors("runtime", { ...baseState, trigger: "", llmId: "", ttsId: "", cpu: "", memory: "" });
  expect(errors.trigger).toBe("Required");
  expect(errors.llmId).toBe("Required");
  expect(errors.ttsId).toBe("Required");
  expect(errors.cpu).toBe("Required");
  expect(errors.memory).toBe("Required");
});

it("avatar stage requires valid assets and optional voice url", () => {
  const errors = computeStageErrors("avatar", { ...baseState, avatarAssets: "", avatarVoiceUrl: "file://voice.wav" });
  expect(errors.avatarAssets).toContain("avatar asset");
  expect(errors.avatarVoiceUrl).toContain("http");
});

it("summarizeDiff reports changed fields", () => {
  const updated: AceAgentManifest = {
    ...baseManifest,
    id: "agent.new",
    version: "0.2.0",
    capabilities: ["generator", "catalog"],
    runtime: { container: { image: "new/image:dev" } }
  };
  const summary = summarizeDiff(baseManifest, updated);
  expect(summary.join(" ")).toContain("id: agent.story-weaver.001 → agent.new");
  expect(summary.join(" ")).toContain("version: 0.1.0 → 0.2.0");
  expect(summary.some((s) => s.includes("capabilities"))).toBeTruthy();
  expect(summary.some((s) => s.includes("runtime image"))).toBeTruthy();
});

it("avatar helpers parse and validate assets/voice", () => {
  const parsed = parseAvatarAssets("s3://a, https://cdn.com/b.png");
  expect(parsed).toHaveLength(2);

  const ok = validateAvatarFields("s3://a,https://cdn.com/b.png", "https://cdn.com/voice.wav");
  expect(ok.avatarAssets).toBeUndefined();
  expect(ok.avatarVoiceUrl).toBeUndefined();

  const badAssets = validateAvatarFields("ftp://bad", "");
  expect(badAssets.avatarAssets).toContain("http");

  const badVoice = validateAvatarFields("s3://good", "file://clip.wav");
  expect(badVoice.avatarVoiceUrl).toContain("http");
});

it("resource normalization converts decimals to milli and uppercases mem units", () => {
  expect(normalizeCpu("0.5")).toBe("500m");
  expect(normalizeCpu("500m")).toBe("500m");
  expect(normalizeMemory("1gi")).toBe("1GI");
  expect(normalizeMemory("256MiB")).toContain("Mi");
});
});
