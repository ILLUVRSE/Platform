import {
  AceAgentManifest,
  AceCapability,
  AceTrigger,
  AceModelBindings,
  AcePermissions,
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
      if (method !== undefined && typeof method !== "string") throw new Error("trigger.method must be a string");
      return {
        type,
        path: expectString(obj.path, "trigger.path"),
        method: method as AceTrigger["method"],
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
          params: llm.params && expectObject(llm.params, "modelBindings.llm.params"),
        }
      : undefined,
    tts: tts
      ? {
          id: expectString(tts.id, "modelBindings.tts.id"),
          provider: tts.provider ? expectString(tts.provider, "modelBindings.tts.provider") : undefined,
          voice: tts.voice ? expectString(tts.voice, "modelBindings.tts.voice") : undefined,
          params: tts.params && expectObject(tts.params, "modelBindings.tts.params"),
        }
      : undefined,
    vision: vision
      ? {
          id: expectString(vision.id, "modelBindings.vision.id"),
          provider: vision.provider ? expectString(vision.provider, "modelBindings.vision.provider") : undefined,
          params: vision.params && expectObject(vision.params, "modelBindings.vision.params"),
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

export function validateAceAgentManifest(manifest: unknown): AceAgentManifest {
  const obj = expectObject(manifest, "manifest");

  const capabilities = parseCapabilities(obj.capabilities);
  const runtime = parseRuntime(obj.runtime);
  const triggers = parseTriggers(obj.triggers);
  const modelBindings = parseModelBindings(obj.modelBindings);
  const permissions = parsePermissions(obj.permissions);
  const resources = parseResources(obj.resources);
  const metadata = obj.metadata ? expectObject(obj.metadata, "metadata") : undefined;
  const avatar = parseAvatar(obj.avatar);

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
    resources,
    runtime,
    metadata,
    avatar,
    signing: obj.signing && expectObject(obj.signing, "signing"),
  };
}
