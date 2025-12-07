type UpstreamConfig = {
  storysphereBackendUrl?: string;
  tokens: {
    storysphere?: string;
  };
};

export function loadConfig(): UpstreamConfig {
  return {
    storysphereBackendUrl: process.env.STORYSPHERE_BACKEND_URL,
    tokens: {
      storysphere: process.env.STORYSPHERE_TOKEN
    }
  };
}
