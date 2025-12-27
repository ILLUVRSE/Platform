# North-Star Demo Runbook

## Goal
A single end-to-end flow that shows the AI company in action: agent creation, approval, execution, proof, and in-world presence.

## Prereqs
- Platform running (`pnpm dev`).
- Services: Kernel, Sentinel, AgentManager, Marketplace, Finance, ArtifactPublisher, World State, Memory, Voice.
- `NEXT_PUBLIC_WORLD_URL` set for in-world presence.

## Demo Script
1) Open `/ace/create` and generate an agent manifest with tools + memory policy.
2) Click **Validate & Run Checks** to get Kernel + Sentinel verdicts.
3) Click **Send to Playground** and open `/playground`.
4) In the 3D control room, select the agent and run **Generate preview**.
5) Watch live status updates and proof fields (SSE) in the 3D UI.
6) Open `/control-panel` and verify approval + audit entries.
7) Confirm the agent appears as a presence orb in-world via World State.

## Success Criteria
- Signed manifest and policy verdict shown in ACE.
- Job enqueued, status streamed, proof/latency displayed in Playground.
- Approval entry persisted and visible in Control-Panel.
- Presence orb visible in 3D scene.
