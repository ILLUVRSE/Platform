import assert from "node:assert";
import { createAgentManagerServer, AgentManagerClient } from "./index";

async function main() {
  const server = createAgentManagerServer({ port: 5055 });
  await server.listen();

  const client = new AgentManagerClient("http://localhost:5055");
  const manifest = {
    id: "agent.test.001",
    name: "TestAgent",
    version: "0.0.1",
    capabilities: ["generator"],
    runtime: { container: { image: "illuvrse/test:dev" } }
  };

  const registered = await client.register(manifest);
  assert.ok(registered.ok);

  const job = await client.enqueueJob(manifest.id, "generate", { prompt: "hello" });
  assert.ok(job.jobId);

  const fetched = await client.getJob(job.jobId);
  assert.strictEqual(fetched.status, "queued");

  console.log("Integration stub passed", { agentId: registered.agentId, jobId: job.jobId });
  server.server.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
