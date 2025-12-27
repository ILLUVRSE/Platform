type UpstreamConfig = {
  storysphereBackendUrl?: string;
  agentManagerUrl?: string;
  tokens: {
    storysphere?: string;
    agentManager?: string;
  };
};

export function loadConfig(): UpstreamConfig {
  return {
    storysphereBackendUrl: process.env.STORYSPHERE_BACKEND_URL,
    agentManagerUrl: process.env.AGENT_BACKEND_URL ?? process.env.AGENT_MANAGER_URL ?? "http://localhost:4040",
    tokens: {
      storysphere: process.env.STORYSPHERE_TOKEN,
      agentManager: process.env.AGENT_BACKEND_TOKEN
    }
  };
}
