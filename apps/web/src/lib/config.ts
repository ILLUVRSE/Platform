type UpstreamConfig = {
  kernelUrl?: string;
  marketplaceUrl?: string;
  financeUrl?: string;
  artifactPublisherUrl?: string;
  storysphereBackendUrl?: string;
  tokens: {
    kernel?: string;
    marketplace?: string;
    finance?: string;
    artifactPublisher?: string;
    storysphere?: string;
  };
};

export function loadConfig(): UpstreamConfig {
  return {
    kernelUrl: process.env.KERNEL_URL,
    marketplaceUrl: process.env.MARKETPLACE_URL,
    financeUrl: process.env.FINANCE_URL,
    artifactPublisherUrl: process.env.ARTIFACT_PUBLISHER_URL,
    storysphereBackendUrl: process.env.STORYSPHERE_BACKEND_URL,
    tokens: {
      kernel: process.env.KERNEL_TOKEN,
      marketplace: process.env.MARKETPLACE_TOKEN,
      finance: process.env.FINANCE_TOKEN,
      artifactPublisher: process.env.ARTIFACT_PUBLISHER_TOKEN,
      storysphere: process.env.STORYSPHERE_TOKEN
    }
  };
}
