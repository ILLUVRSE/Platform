import {
  AceAgentManifest,
  AceCapability,
  AceTrigger,
  AceModelBindings,
  AcePermissions,
  AceTool,
  AceMemoryPolicy,
  AcePresence,
  AceResources,
  AceRuntime,
  AceAvatar,
} from "./types";

type Dict = Record<string, unknown>;

const capabilitySet = new Set<AceCapability>([
  "generator",
  "catalog",
  "scheduler",
  "liveloop",
  "proof",
  "moderator",
  "monitor",
  "assistant",
  "custom",
]);

const httpMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
type AceHttpMethod = (typeof httpMethods)[number];
const httpMethodSet = new Set<AceHttpMethod>(httpMethods);

function expectObject(value: unknown, field: string): Dict {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
  return value as Dict;
}

function expectString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function parseCapabilities(value: unknown): AceCapability[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("capabilities must be a non-empty array");
  }
  return value.map((cap) => {
    if (typeof cap !== "string" || !capabilitySet.has(cap as AceCapability)) {
      throw new Error(`invalid capability: ${String(cap)}`);
    }
    return cap as AceCapability;
  });
}

function parseTriggers(value: unknown): AceTrigger[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new Error("triggers must be an array");
  return value.map((trigger) => {
    const obj = expectObject(trigger, "trigger");
    const type = expectString(obj.type, "trigger.type");
    if (type === "cron") {
      return {
        type,
        cron: expectString(obj.cron, "trigger.cron"),
        timezone: obj.timezone ? expectString(obj.timezone, "trigger.timezone") : undefined,
      } as AceTrigger;
    }
    if (type === "event") {
      return {
        type,
        event: expectString(obj.event, "trigger.event"),
        filter: obj.filter && expectObject(obj.filter, "trigger.filter"),
      } as AceTrigger;
    }
    if (type === "http") {
      const method = obj.method;
      let parsedMethod: AceHttpMethod | undefined;
      if (method !== undefined) {
        if (typeof method !== "string" || !httpMethodSet.has(method as AceHttpMethod)) {
          throw new Error("trigger.method must be a valid HTTP method");
        }
        parsedMethod = method as AceHttpMethod;
      }
      return {
        type,
        path: expectString(obj.path, "trigger.path"),
        method: parsedMethod,
      } as AceTrigger;
    }
    throw new Error(`invalid trigger type: ${type}`);
  });
}

function parseModelBindings(value: unknown): AceModelBindings | undefined {
  if (value === undefined) return undefined;
  const obj = expectObject(value, "modelBindings");
  const llm = obj.llm ? expectObject(obj.llm, "modelBindings.llm") : undefined;
  const tts = obj.tts ? expectObject(obj.tts, "modelBindings.tts") : undefined;
  const vision = obj.vision ? expectObject(obj.vision, "modelBindings.vision") : undefined;
  return {
    llm: llm
      ? {
          id: expectString(llm.id, "modelBindings.llm.id"),
          provider: llm.provider ? expectString(llm.provider, "modelBindings.llm.provider") : undefined,
          params: llm.params !== undefined ? expectObject(llm.params, "modelBindings.llm.params") : undefined,
        }
      : undefined,
    tts: tts
      ? {
          id: expectString(tts.id, "modelBindings.tts.id"),
          provider: tts.provider ? expectString(tts.provider, "modelBindings.tts.provider") : undefined,
          voice: tts.voice ? expectString(tts.voice, "modelBindings.tts.voice") : undefined,
          params: tts.params !== undefined ? expectObject(tts.params, "modelBindings.tts.params") : undefined,
        }
      : undefined,
    vision: vision
      ? {
          id: expectString(vision.id, "modelBindings.vision.id"),
          provider: vision.provider ? expectString(vision.provider, "modelBindings.vision.provider") : undefined,
          params: vision.params !== undefined ? expectObject(vision.params, "modelBindings.vision.params") : undefined,
        }
      : undefined,
  };
}

function parsePermissions(value: unknown): AcePermissions | undefined {
  if (value === undefined) return undefined;
  const obj = expectObject(value, "permissions");
  const storage = obj.storage ? expectObject(obj.storage, "permissions.storage") : undefined;
  const network = obj.network ? expectObject(obj.network, "permissions.network") : undefined;
  const secrets = obj.secrets;
  const scopes = obj.scopes;
  return {
    storage: storage
      ? {
          read: storage.read ? parseStringArray(storage.read, "permissions.storage.read") : undefined,
          write: storage.write ? parseStringArray(storage.write, "permissions.storage.write") : undefined,
        }
      : undefined,
    network: network
      ? {
          outbound: typeof network.outbound === "boolean" ? network.outbound : undefined,
          domains: network.domains ? parseStringArray(network.domains, "permissions.network.domains") : undefined,
        }
      : undefined,
    secrets: secrets ? parseStringArray(secrets, "permissions.secrets") : undefined,
    scopes: scopes ? parseStringArray(scopes, "permissions.scopes") : undefined,
  };
}

function parseTools(value: unknown): AceTool[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new Error("tools must be an array");
  return value.map((tool, idx) => {
    const obj = expectObject(tool, `tools[${idx}]`);
    const actions = parseStringArray(obj.actions, `tools[${idx}].actions`);
    return {
      id: expectString(obj.id, `tools[${idx}].id`),
      name: obj.name ? expectString(obj.name, `tools[${idx}].name`) : undefined,
      description: obj.description ? expectString(obj.description, `tools[${idx}].description`) : undefined,
      actions,
      scopes: obj.scopes ? parseStringArray(obj.scopes, `tools[${idx}].scopes`) : undefined,
      metadata: obj.metadata ? expectObject(obj.metadata, `tools[${idx}].metadata`) : undefined,
    };
  });
}

function parseNumber(value: unknown, field: string): number {
  const num = Number(value);
  if (!Number.isFinite(num)) throw new Error(`${field} must be a number`);
  return num;
}

function parseMemory(value: unknown): AceMemoryPolicy | undefined {
  if (value === undefined) return undefined;
  const obj = expectObject(value, "memory");
  const shortTerm = obj.shortTerm ? expectObject(obj.shortTerm, "memory.shortTerm") : undefined;
  const longTerm = obj.longTerm ? expectObject(obj.longTerm, "memory.longTerm") : undefined;
  return {
    shortTerm: shortTerm
      ? {
          ttlDays: shortTerm.ttlDays !== undefined ? parseNumber(shortTerm.ttlDays, "memory.shortTerm.ttlDays") : undefined,
          maxEntries:
            shortTerm.maxEntries !== undefined ? parseNumber(shortTerm.maxEntries, "memory.shortTerm.maxEntries") : undefined,
        }
      : undefined,
    longTerm: longTerm
      ? {
          enabled: typeof longTerm.enabled === "boolean" ? longTerm.enabled : undefined,
          retentionDays:
            longTerm.retentionDays !== undefined ? parseNumber(longTerm.retentionDays, "memory.longTerm.retentionDays") : undefined,
          vectorStore: longTerm.vectorStore ? expectString(longTerm.vectorStore, "memory.longTerm.vectorStore") : undefined,
          namespace: longTerm.namespace ? expectString(longTerm.namespace, "memory.longTerm.namespace") : undefined,
        }
      : undefined,
    citations: typeof obj.citations === "boolean" ? obj.citations : undefined,
  };
}

function parsePresence(value: unknown): AcePresence | undefined {
  if (value === undefined) return undefined;
  const obj = expectObject(value, "presence");
  const priority = obj.priority ? expectString(obj.priority, "presence.priority") : undefined;
  if (priority && !["low", "normal", "high"].includes(priority)) {
    throw new Error("presence.priority must be low, normal, or high");
  }
  return {
    realm: obj.realm ? expectString(obj.realm, "presence.realm") : undefined,
    room: obj.room ? expectString(obj.room, "presence.room") : undefined,
    priority: priority as AcePresence["priority"],
    schedule: obj.schedule ? parseStringArray(obj.schedule, "presence.schedule") : undefined,
    timezone: obj.timezone ? expectString(obj.timezone, "presence.timezone") : undefined,
  };
}

function parseResources(value: unknown): AceResources | undefined {
  if (value === undefined) return undefined;
  const obj = expectObject(value, "resources");
  return {
    cpu: obj.cpu ? expectString(obj.cpu, "resources.cpu") : undefined,
    memory: obj.memory ? expectString(obj.memory, "resources.memory") : undefined,
    gpu: obj.gpu
      ? (() => {
          const gpu = expectObject(obj.gpu, "resources.gpu");
          return {
            count: gpu.count !== undefined ? Number(gpu.count) : undefined,
            model: gpu.model ? expectString(gpu.model, "resources.gpu.model") : undefined,
          };
        })()
      : undefined,
    storage: obj.storage ? expectString(obj.storage, "resources.storage") : undefined,
  };
}

function parseRuntime(value: unknown): AceRuntime {
  const obj = expectObject(value, "runtime");
  const container = expectObject(obj.container, "runtime.container");
  const image = expectString(container.image, "runtime.container.image");
  const command = container.command ? parseStringArray(container.command, "runtime.container.command") : undefined;
  const args = container.args ? parseStringArray(container.args, "runtime.container.args") : undefined;
  const env = container.env ? expectRecordOfStrings(container.env, "runtime.container.env") : undefined;
  return {
    container: { image, command, args, env },
    entrypoint: obj.entrypoint ? expectString(obj.entrypoint, "runtime.entrypoint") : undefined,
  };
}

function parseAvatar(value: unknown): AceAvatar | undefined {
  if (value === undefined) return undefined;
  const obj = expectObject(value, "avatar");
  const appearance = obj.appearance ? expectObject(obj.appearance, "avatar.appearance") : undefined;
  const voice = obj.voice ? expectObject(obj.voice, "avatar.voice") : undefined;
  const personality = obj.personality ? expectObject(obj.personality, "avatar.personality") : undefined;
  return {
    profileId: obj.profileId ? expectString(obj.profileId, "avatar.profileId") : undefined,
    appearance: appearance
      ? {
          assets: appearance.assets ? parseStringArray(appearance.assets, "avatar.appearance.assets") : undefined,
          stylePreset: appearance.stylePreset ? expectString(appearance.stylePreset, "avatar.appearance.stylePreset") : undefined,
          rig: appearance.rig ? expectString(appearance.rig, "avatar.appearance.rig") : undefined,
        }
      : undefined,
    voice: voice
      ? {
          sampleUrl: voice.sampleUrl ? expectString(voice.sampleUrl, "avatar.voice.sampleUrl") : undefined,
          configId: voice.configId ? expectString(voice.configId, "avatar.voice.configId") : undefined,
          activationLine: voice.activationLine ? expectString(voice.activationLine, "avatar.voice.activationLine") : undefined,
        }
      : undefined,
    personality: personality
      ? {
          traits: personality.traits ? parseStringArray(personality.traits, "avatar.personality.traits") : undefined,
          archetype: personality.archetype ? expectString(personality.archetype, "avatar.personality.archetype") : undefined,
          emotionalRange: personality.emotionalRange
            ? parseStringArray(personality.emotionalRange, "avatar.personality.emotionalRange")
            : undefined,
        }
      : undefined,
  };
}

function parseStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array of strings`);
  return value.map((item) => expectString(item, `${field}[]`));
}

function expectRecordOfStrings(value: unknown, field: string): Record<string, string> {
  const obj = expectObject(value, field);
  const record: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    record[expectString(k, `${field} key`)] = expectString(v, `${field}.${k}`);
  }
  return record;
}

function parseSigning(value: unknown): AceAgentManifest["signing"] | undefined {
  if (value === undefined) return undefined;
  const obj = expectObject(value, "signing");
  const proof = obj.proof ? expectObject(obj.proof, "signing.proof") : undefined;
  return {
    proof: proof
      ? {
          sha256: expectString(proof.sha256, "signing.proof.sha256"),
          signer: expectString(proof.signer, "signing.proof.signer"),
          timestamp: expectString(proof.timestamp, "signing.proof.timestamp"),
          ledgerUrl: proof.ledgerUrl ? expectString(proof.ledgerUrl, "signing.proof.ledgerUrl") : undefined,
          policyVerdict: proof.policyVerdict ? expectString(proof.policyVerdict, "signing.proof.policyVerdict") : undefined,
          signature: proof.signature ? expectString(proof.signature, "signing.proof.signature") : undefined,
        }
      : undefined,
    policyVerdict: obj.policyVerdict ? expectString(obj.policyVerdict, "signing.policyVerdict") : undefined,
  };
}

export function validateAceAgentManifest(manifest: unknown): AceAgentManifest {
  const obj = expectObject(manifest, "manifest");

  const capabilities = parseCapabilities(obj.capabilities);
  const runtime = parseRuntime(obj.runtime);
  const triggers = parseTriggers(obj.triggers);
  const modelBindings = parseModelBindings(obj.modelBindings);
  const permissions = parsePermissions(obj.permissions);
  const tools = parseTools(obj.tools);
  const resources = parseResources(obj.resources);
  const memory = parseMemory(obj.memory);
  const presence = parsePresence(obj.presence);
  const metadata = obj.metadata ? expectObject(obj.metadata, "metadata") : undefined;
  const avatar = parseAvatar(obj.avatar);
  const signing = parseSigning(obj.signing);

  return {
    id: expectString(obj.id, "id"),
    name: expectString(obj.name, "name"),
    version: expectString(obj.version, "version"),
    description: obj.description ? expectString(obj.description, "description") : undefined,
    archetype: obj.archetype ? expectString(obj.archetype, "archetype") : undefined,
    capabilities,
    triggers,
    modelBindings,
    permissions,
    tools,
    resources,
    memory,
    presence,
    runtime,
    metadata,
    avatar,
    signing,
  };
}
