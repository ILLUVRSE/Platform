import { expect, it } from "vitest";
import { pushStatus, statusByAgent, statusEmitter, type AgentStatus } from "@web/app/api/agent/store";

it("pushStatus stores and emits proof/policy/latency", async () => {
  const sample: AgentStatus = {
    id: "agent-1-1",
    action: "publish.manifest",
    status: "completed",
    agentId: "agent-1",
    timestamp: Date.now(),
    message: "done",
    proofSha: "demo-sha",
    policyVerdict: "PASS",
    latencyMs: 120
  };

  const emitted = await new Promise<AgentStatus>((resolve) => {
    statusEmitter.once("status", resolve);
    pushStatus(sample.agentId, sample);
  });

  expect(statusByAgent[sample.agentId][0]).toMatchObject({
    proofSha: "demo-sha",
    policyVerdict: "PASS",
    latencyMs: 120
  });
  expect(emitted.proofSha).toBe("demo-sha");
  expect(emitted.policyVerdict).toBe("PASS");
});
