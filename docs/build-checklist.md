# ILLUVRSE Platform Build & Handoff Checklist

Use this checklist to get the platform running locally and to align on workstreams (ACE wizard, Playground, StorySphere, Marketplace, agents).

## Prereqs
- Node 20+ and pnpm 10+ installed.
- Clone repo: `git clone https://github.com/ILLUVRSE/Platform.git`
- From repo root: `pnpm install` (workspace-wide).

## Core dev commands
- Web app: `pnpm --filter web dev` (runs Next on :3000)
- Studio (StorySphere) lives under `/studio` in the web app.
- Lint: `pnpm lint`
- Build (CI parity): `pnpm build --filter '!@illuvrse/tests'`
- Tests (unit): `pnpm --filter @illuvrse/tests test:unit`
- Tests (Playwright smoke/integration): `pnpm --filter @illuvrse/tests test` (UI smoke requires RUN_UI_SMOKE=true and servers running)

## Apps & routes
- Web (apps/web):
  - ACE wizard: `/ace/create`
  - Playground: `/playground` (includes 3D/VR prototype)
  - Products: `/products`
  - About: `/about`
  - LiveLoop (web): `/liveloop`
  - Moms Kitchen: `/food`
  - GridStock: `/gridstock`
- Studio (StorySphere): `/studio`
- APIs (web): `/api/kernel/*`, `/api/sentinel/*`, `/api/agent/*` (exec/status/stream stubs), `/api/ace/*` (local registry/handoff), `/api/marketplace/*`, etc.

## ACE wizard status
- 5-step flow with validation gating; autosave to `ace-wizard-draft`, Playground handoff key `ace-playground-manifest`, plus local registry sync to `.ryan/ace` via `/api/ace/registry`.
- Presets include LiveLoop publisher; runtime image/LLM/TTS dropdowns; resource presets (Dev/Staging/Prod).
- Proof snapshot with latency and register retry; policy block messages.
- Import diff confirmation; avatar asset helper + audio preview.
- Needs: unify light theme across sections; integrate real queue/backend for register/exec; fix Playwright worker exit for unit tests.

## Playground status
- Tutorial manifests (StoryWeaver, Scheduler, Proof Guardian, Asset Curator, Voice Stylist, Engagement Monitor) load to storage/cookie; upload accepts signed manifests; local handoff loads from `.ryan/ace` and syncs to storage.
- 3D preview runs via react-three-fiber + XR with VR toggle; nodes show status badges via SSE `/api/agent/stream`; actions: Send to ACE, Generate preview (exec), Publish (stub), Verify (stub); history panel shows proof/policy fields plus action/timestamps. If imports fail, align React 19 with latest react-three versions.
- Custom handoff manifests appear as a dedicated node in the 3D scene for live actions.
- Lightened HUD/tooltips; stored manifest controls (reload/clear); publish drawer triggers checkout/publish/verify stubs.
- World state service (`apps/world-state`) broadcasts presence to the 3D scene when `NEXT_PUBLIC_WORLD_URL` is set.
- Needs: align React 19 + react-three stack to re-enable 3D preview; replace in-memory exec/stream with real queue/backend; add more commands (publish/verify) and status edges; continue theme alignment across 3D panel.

## Agent APIs (stubs)
- `/api/agent/exec`: enqueues command in-memory, simulates queued→running→completed, emits SSE. If `AGENT_BACKEND_URL` is set, registers/enqueues jobs with AgentManager before falling back to stub.
- `/api/agent/status`: returns per-agent status history.
- `/api/agent/stream`: SSE for live status (consumed by 3D nodes), includes action, proofSha, policyVerdict, latency when present; proxies to backend when `AGENT_BACKEND_URL` is set.
- `/api/agent/requests`: approval queue (pending + history).
- `/api/agent/approve`: approve/reject pending requests and execute on approval.
- Approval gate: `/api/agent/exec` requires `approvedBy` when `AGENT_APPROVAL_REQUIRED` is not `false`.
- Needs: hook to real bus/queue and executor; stream proof/policy data from backend.

## StorySphere status
- LiveLoop page restored in web app with schedule helpers (`buildLiveLoopSchedule`, `mapLiveLoopEvents`).
- Studio styling uses shared preset (CJS); type shim added; `@ts-expect-error` present in config.
- Needs: confirm Tailwind preset typing approach.

## Marketplace status
- Pages intact; APIs stubbed (`/api/marketplace/*`, `/api/finance/*`), proof flows present.

## Outstanding issues / TODOs
- Agent approvals persist to Postgres after running `pnpm --filter @illuvrse/db prisma:migrate:dev` and `pnpm --filter @illuvrse/db prisma:generate`.
- CI warnings: git gc warnings (unreachable loose objects) on local; Tailwind preset typing still has @ts-expect-error.
- Clean artifacts: `packages/tests/test-results/.last-run.json` is a test artifact.

## Quick start to handoff
1) `pnpm install`
2) `pnpm --filter web dev`
3) Visit `/ace/create` and `/playground`; use tutorial nodes to load manifests.
4) If contributing: create feature branch, run `pnpm lint` and `pnpm build --filter '!@illuvrse/tests'` before PR.
5) For agents: swap the AgentManager stub for a real queue + executor when ready; the 3D actions already stream status/proof data.
