type UpstreamConfig = {
  kernelUrl?: string;
  sentinelUrl?: string;
  marketplaceUrl?: string;
  financeUrl?: string;
  artifactPublisherUrl?: string;
  memoryUrl?: string;
  worldStateUrl?: string;
  avatarRegistryUrl?: string;
  voiceUrl?: string;
  storysphereBackendUrl?: string;
  tokens: {
    kernel?: string;
    sentinel?: string;
    marketplace?: string;
    finance?: string;
    artifactPublisher?: string;
    memory?: string;
    world?: string;
    voice?: string;
    storysphere?: string;
  };
};

export function loadConfig(): UpstreamConfig {
  return {
    kernelUrl: process.env.KERNEL_URL,
    sentinelUrl: process.env.SENTINEL_URL,
    marketplaceUrl: process.env.MARKETPLACE_URL,
    financeUrl: process.env.FINANCE_URL,
    artifactPublisherUrl: process.env.ARTIFACT_PUBLISHER_URL,
    memoryUrl: process.env.MEMORY_URL,
    worldStateUrl: process.env.WORLD_STATE_URL,
    avatarRegistryUrl: process.env.AVATAR_REGISTRY_URL,
    voiceUrl: process.env.VOICE_URL,
    storysphereBackendUrl: process.env.STORYSPHERE_BACKEND_URL,
    tokens: {
      kernel: process.env.KERNEL_TOKEN,
      sentinel: process.env.SENTINEL_TOKEN,
      marketplace: process.env.MARKETPLACE_TOKEN,
      finance: process.env.FINANCE_TOKEN,
      artifactPublisher: process.env.ARTIFACT_PUBLISHER_TOKEN,
      memory: process.env.MEMORY_TOKEN,
      world: process.env.WORLD_TOKEN,
      voice: process.env.VOICE_TOKEN,
      storysphere: process.env.STORYSPHERE_TOKEN
    }
  };
}
