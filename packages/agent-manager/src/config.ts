export type ManagerConfig = {
  port: number;
  hostname: string;
  queueConcurrency: number;
};

export function loadManagerConfig(): ManagerConfig {
  return {
    port: Number(process.env.AGENT_MANAGER_PORT ?? 4040),
    hostname: process.env.AGENT_MANAGER_HOST ?? "0.0.0.0",
    queueConcurrency: Number(process.env.AGENT_MANAGER_CONCURRENCY ?? 2)
  };
}
