export type SignatureProof = {
  sha256: string;
  signer: string;
  timestamp: string;
  ledgerUrl?: string;
  policyVerdict?: string;
};

export type KernelSignRequest = {
  sha256: string;
  metadata?: Record<string, unknown>;
};

export type KernelSignResponse = SignatureProof & {
  signature: string;
  expiry?: string;
  requestId?: string;
};

export type KernelVerifyRequest = {
  sha256: string;
  signature: string;
};

export type KernelVerifyResponse = SignatureProof & {
  valid: boolean;
};

export type AceCapability =
  | "generator"
  | "catalog"
  | "scheduler"
  | "liveloop"
  | "proof"
  | "moderator"
  | "monitor"
  | "assistant"
  | "custom";

export type AceTrigger =
  | { type: "cron"; cron: string; timezone?: string }
  | { type: "event"; event: string; filter?: Record<string, unknown> }
  | { type: "http"; path: string; method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" };

export type AceModelBindings = {
  llm?: { id: string; provider?: string; params?: Record<string, unknown> };
  tts?: { id: string; provider?: string; voice?: string; params?: Record<string, unknown> };
  vision?: { id: string; provider?: string; params?: Record<string, unknown> };
};

export type AcePermissions = {
  storage?: { read?: string[]; write?: string[] };
  network?: { outbound?: boolean; domains?: string[] };
  secrets?: string[];
  scopes?: string[];
};

export type AceTool = {
  id: string;
  name?: string;
  description?: string;
  actions: string[];
  scopes?: string[];
  metadata?: Record<string, unknown>;
};

export type AceMemoryPolicy = {
  shortTerm?: { ttlDays?: number; maxEntries?: number };
  longTerm?: { enabled?: boolean; retentionDays?: number; vectorStore?: string; namespace?: string };
  citations?: boolean;
};

export type AcePresence = {
  realm?: string;
  room?: string;
  priority?: "low" | "normal" | "high";
  schedule?: string[];
  timezone?: string;
};

export type AceResources = {
  cpu?: string;
  memory?: string;
  gpu?: { count?: number; model?: string };
  storage?: string;
};

export type AceRuntime = {
  container: { image: string; command?: string[]; args?: string[]; env?: Record<string, string> };
  entrypoint?: string;
};

export type AceAvatar = {
  profileId?: string;
  appearance?: { assets?: string[]; stylePreset?: string; rig?: string };
  voice?: { sampleUrl?: string; configId?: string; activationLine?: string };
  personality?: { traits?: string[]; archetype?: string; emotionalRange?: string[] };
};

export type AceAgentManifest = {
  id: string;
  name: string;
  version: string;
  description?: string;
  archetype?: string;
  capabilities: AceCapability[];
  triggers?: AceTrigger[];
  modelBindings?: AceModelBindings;
  permissions?: AcePermissions;
  tools?: AceTool[];
  resources?: AceResources;
  memory?: AceMemoryPolicy;
  presence?: AcePresence;
  runtime: AceRuntime;
  metadata?: Record<string, unknown>;
  avatar?: AceAvatar;
  signing?: {
    proof?: SignatureProof & { signature?: string };
    policyVerdict?: string;
  };
};

export const aceAgentManifestSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "AceAgentManifest",
  type: "object",
  required: ["id", "name", "version", "capabilities", "runtime"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    version: { type: "string" },
    description: { type: "string" },
    archetype: { type: "string" },
    capabilities: {
      type: "array",
      items: {
        type: "string",
        enum: ["generator", "catalog", "scheduler", "liveloop", "proof", "moderator", "monitor", "assistant", "custom"],
      },
      minItems: 1,
    },
    triggers: {
      type: "array",
      items: {
        oneOf: [
          {
            type: "object",
            required: ["type", "cron"],
            properties: { type: { const: "cron" }, cron: { type: "string" }, timezone: { type: "string" } },
            additionalProperties: false,
          },
          {
            type: "object",
            required: ["type", "event"],
            properties: {
              type: { const: "event" },
              event: { type: "string" },
              filter: { type: "object", additionalProperties: true },
            },
            additionalProperties: false,
          },
          {
            type: "object",
            required: ["type", "path"],
            properties: {
              type: { const: "http" },
              path: { type: "string" },
              method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE", "PATCH"] },
            },
            additionalProperties: false,
          },
        ],
      },
    },
    modelBindings: {
      type: "object",
      properties: {
        llm: { type: "object", properties: { id: { type: "string" }, provider: { type: "string" }, params: { type: "object" } } },
        tts: { type: "object", properties: { id: { type: "string" }, provider: { type: "string" }, voice: { type: "string" }, params: { type: "object" } } },
        vision: { type: "object", properties: { id: { type: "string" }, provider: { type: "string" }, params: { type: "object" } } },
      },
      additionalProperties: false,
    },
    permissions: {
      type: "object",
      properties: {
        storage: {
          type: "object",
          properties: {
            read: { type: "array", items: { type: "string" } },
            write: { type: "array", items: { type: "string" } },
          },
          additionalProperties: false,
        },
        network: {
          type: "object",
          properties: {
            outbound: { type: "boolean" },
            domains: { type: "array", items: { type: "string" } },
          },
          additionalProperties: false,
        },
        secrets: { type: "array", items: { type: "string" } },
        scopes: { type: "array", items: { type: "string" } },
      },
      additionalProperties: false,
    },
    tools: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "actions"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          actions: { type: "array", items: { type: "string" } },
          scopes: { type: "array", items: { type: "string" } },
          metadata: { type: "object" },
        },
        additionalProperties: false,
      },
    },
    resources: {
      type: "object",
      properties: {
        cpu: { type: "string" },
        memory: { type: "string" },
        gpu: {
          type: "object",
          properties: { count: { type: "number" }, model: { type: "string" } },
          additionalProperties: false,
        },
        storage: { type: "string" },
      },
      additionalProperties: false,
    },
    memory: {
      type: "object",
      properties: {
        shortTerm: {
          type: "object",
          properties: {
            ttlDays: { type: "number" },
            maxEntries: { type: "number" },
          },
          additionalProperties: false,
        },
        longTerm: {
          type: "object",
          properties: {
            enabled: { type: "boolean" },
            retentionDays: { type: "number" },
            vectorStore: { type: "string" },
            namespace: { type: "string" },
          },
          additionalProperties: false,
        },
        citations: { type: "boolean" },
      },
      additionalProperties: false,
    },
    presence: {
      type: "object",
      properties: {
        realm: { type: "string" },
        room: { type: "string" },
        priority: { type: "string", enum: ["low", "normal", "high"] },
        schedule: { type: "array", items: { type: "string" } },
        timezone: { type: "string" },
      },
      additionalProperties: false,
    },
    runtime: {
      type: "object",
      required: ["container"],
      properties: {
        container: {
          type: "object",
          required: ["image"],
          properties: {
            image: { type: "string" },
            command: { type: "array", items: { type: "string" } },
            args: { type: "array", items: { type: "string" } },
            env: { type: "object", additionalProperties: { type: "string" } },
          },
          additionalProperties: false,
        },
        entrypoint: { type: "string" },
      },
      additionalProperties: false,
    },
    metadata: { type: "object" },
    avatar: {
      type: "object",
      properties: {
        profileId: { type: "string" },
        appearance: {
          type: "object",
          properties: {
            assets: { type: "array", items: { type: "string" } },
            stylePreset: { type: "string" },
            rig: { type: "string" },
          },
          additionalProperties: false,
        },
        voice: {
          type: "object",
          properties: {
            sampleUrl: { type: "string" },
            configId: { type: "string" },
            activationLine: { type: "string" },
          },
          additionalProperties: false,
        },
        personality: {
          type: "object",
          properties: {
            traits: { type: "array", items: { type: "string" } },
            archetype: { type: "string" },
            emotionalRange: { type: "array", items: { type: "string" } },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
    signing: {
      type: "object",
      properties: {
        proof: {
          type: "object",
          properties: {
            sha256: { type: "string" },
            signer: { type: "string" },
            timestamp: { type: "string" },
            ledgerUrl: { type: "string" },
            policyVerdict: { type: "string" },
            signature: { type: "string" },
          },
          additionalProperties: false,
        },
        policyVerdict: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const;

export type MarketplaceListing = {
  sku: string;
  price: number;
  currency: string;
  sha256: string;
  status: "ready" | "canary" | "preview";
  signed: boolean;
  manifest?: Record<string, unknown>;
  proof?: SignatureProof;
};

export type StorySphereGenerateRequest = {
  prompt: string;
  duration: number;
  publishToLiveLoop?: boolean;
};

export type StorySphereGenerateResponse = {
  jobId: string;
  status: "queued" | "rendering" | "complete";
  previewEtaSeconds?: number;
  publishToLiveLoop?: boolean;
  proof?: SignatureProof;
  proofSha?: string;
  policyVerdict?: string;
};

export type LiveLoopPublishRequest = {
  assetId: string;
  schedule?: string;
};

export type LiveLoopPublishResponse = {
  assetId: string;
  scheduledFor: string;
  status: string;
  proof: SignatureProof;
};

export type AgentJobKind = "generate" | "proof" | "schedule";

export type AgentJobStatus = "queued" | "running" | "complete" | "failed";

export type AgentJob = {
  id: string;
  kind: AgentJobKind;
  agentId: string;
  payload: Record<string, unknown>;
  status: AgentJobStatus;
  result?: Record<string, unknown>;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

export type AgentHeartbeat = {
  agentId: string;
  status: "running" | "error" | "stopped";
  timestamp: string;
};
