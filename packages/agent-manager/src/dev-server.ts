import { createAgentManagerServer, processGeneratorJobs, processProofJobs, processSchedulerJobs } from "./index";
import { loadManagerConfig } from "./config";

async function main() {
  const cfg = loadManagerConfig();
  const manager = createAgentManagerServer({ port: cfg.port, hostname: cfg.hostname });
  await manager.listen();
  console.log(`AgentManager running at http://${cfg.hostname}:${cfg.port}`);

  // Simple in-process worker loop for the stub
  setInterval(() => {
    processGeneratorJobs(manager.state);
    processProofJobs(manager.state);
    processSchedulerJobs(manager.state);
  }, 1000);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
