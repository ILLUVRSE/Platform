# ILLUVRSE Platform Build & Handoff Checklist

Use this checklist to get the platform running locally and to align on workstreams (ACE wizard, Playground, StorySphere, Marketplace, agents).

## Prereqs
- Node 20+ and pnpm 10+ installed.
- Clone repo: `git clone https://github.com/ILLUVRSE/Platform.git`
- From repo root: `pnpm install` (workspace-wide).

## Core dev commands
- Web app: `pnpm --filter web dev` (runs Next on :3000)
- StorySphere app: `pnpm --filter storysphere dev` (Next on :3001)
- Lint: `pnpm lint`
- Build (CI parity): `pnpm build --filter '!@illuvrse/tests'`
- Tests (Playwright unit/integration): `pnpm --filter @illuvrse/tests test` (UI smoke requires RUN_UI_SMOKE=true and servers running)

## Apps & routes
- Web (apps/web):
  - ACE wizard: `/ace/create`
  - Playground: `/playground` (includes 3D/VR prototype)
  - Products: `/products`
  - About: `/about`
  - LiveLoop (web): `/liveloop`
- StorySphere (apps/storysphere): main studio; LiveLoop page at `/liveloop`.
- APIs (web): `/api/kernel/*`, `/api/sentinel/*`, `/api/agent/*` (exec/status/stream stubs), `/api/marketplace/*`, etc.

## ACE wizard status
- 5-step flow with validation gating; autosave to `ace-wizard-draft`, Playground handoff key `ace-playground-manifest`.
- Presets include LiveLoop publisher; runtime image/LLM/TTS dropdowns; resource presets (Dev/Staging/Prod).
- Proof snapshot with latency and register retry; policy block messages.
- Import diff confirmation; avatar asset helper + audio preview.
- Needs: unify light theme across sections; integrate real queue/backend for register/exec; fix Playwright worker exit for unit tests.

## Playground status
- Tutorial manifests (StoryWeaver, Scheduler, Proof Guardian, Asset Curator, Voice Stylist, Engagement Monitor) load to storage/cookie.
- 3D scene (react-three-fiber + XR) with VR toggle; nodes show status badges via SSE `/api/agent/stream`; actions: Send to ACE, Generate preview (exec).
- Needs: replace in-memory exec/stream with real queue/backend; add more commands (publish/verify) and status edges; lighten remaining dark UI.

## Agent APIs (stubs)
- `/api/agent/exec`: enqueues command in-memory, simulates queued→running→completed, emits SSE.
- `/api/agent/status`: returns per-agent status history.
- `/api/agent/stream`: SSE for live status (consumed by 3D nodes).
- Needs: hook to real bus/queue and executor; stream proof/policy data from backend.

## StorySphere status
- LiveLoop page restored in web app with schedule helpers (`buildLiveLoopSchedule`, `mapLiveLoopEvents`).
- StorySphere Tailwind config uses shared preset (CJS); type shim added; `@ts-expect-error` present in config.
- Needs: confirm Tailwind preset typing approach; full light theme alignment if desired.

## Marketplace status
- Pages intact; APIs stubbed (`/api/marketplace/*`, `/api/finance/*`), proof flows present.

## Outstanding issues / TODOs
- Theme: align light theme across TopNav/Footer/cards/wizard/playground; many components still dark.
- Tests: Playwright unit runner exits unexpectedly; fix config or move utils to a Jest/Vitest harness.
- Agent backend: replace in-memory exec/stream with real queue (Redis/NATS) and executor service; add proof/policy fields in status.
- CI warnings: git gc warnings (unreachable loose objects) on local; Tailwind preset typing still has @ts-expect-error.
- Clean artifacts: `packages/tests/test-results/.last-run.json` is a test artifact.

## Quick start to handoff
1) `pnpm install`
2) `pnpm --filter web dev` (and optionally `pnpm --filter storysphere dev`)
3) Visit `/ace/create` and `/playground`; use tutorial nodes to load manifests.
4) If contributing: create feature branch, run `pnpm lint` and `pnpm build --filter '!@illuvrse/tests'` before PR.
5) For agents: start by swapping `/api/agent/exec`/`/stream` to a real queue + executor; wire 3D actions to backend.
