# ILLUVRSE Monorepo

Monorepo for the governed creator platform and StorySphere studio.

## Apps
- `apps/web` – public www.illuvrse.com shell (Home, Products, StorySphere landing, Marketplace, Developers, Control-Panel, etc.).
- `apps/storysphere` – personal studio: prompt→MP4, LiveLoop, Player, GameGrid, Library, Settings.

## Shared packages
- `@illuvrse/ui` – design tokens and shared UI primitives.
- `@illuvrse/config` – shared tsconfig and Tailwind preset.

## Scripts
- `pnpm dev --filter web` – run illuvrse.com shell.
- `pnpm dev --filter storysphere` – run StorySphere studio.
- `pnpm start:ace` – production start for the ACE shell on port 3000 (requires `pnpm build` first).
- `pnpm start:storysphere` – production start for StorySphere studio on port 3001 (requires `pnpm build` first).
- `pnpm lint --filter web|storysphere` – lint apps.
- `pnpm test:smoke` – Playwright smoke tests (skipped by default). Set `RUN_UI_SMOKE=true WEB_URL=http://localhost:3000 STUDIO_URL=http://localhost:3001` and run both dev servers to execute.
  - When `RUN_UI_SMOKE=true`, Playwright can auto-start the dev servers via webServer config; otherwise tests skip.

## Environment
- `KERNEL_URL` – forward Kernel sign/verify requests to a real Kernel endpoint (defaults to stub).
- `MARKETPLACE_URL` – forward listing/checkout to a real Marketplace endpoint (defaults to stub).
- `STORYSPHERE_BACKEND_URL` – forward generate/publish to a StorySphere backend (defaults to stub).
- `FINANCE_URL` – forward Finance receipt/verify to a Finance service.
- `ARTIFACT_PUBLISHER_URL` – forward artifact publish to a publisher service.
- If unset, all routes return local stub data suitable for localhost:3000/3001.

## API stubs
- `POST /api/kernel/verify` – stub signature verification.
- `POST /api/sentinel/evaluate` – stub policy verdict.
- `GET /api/marketplace/listing` – stub listing with signed manifest.
- `POST /storysphere/api/v1/generate` – stub StorySphere generate job.
- `POST /storysphere/api/v1/liveloop/publish` – stub publish flow.

Golden path reminders:
1. IDEA builds artifact → Kernel signs manifest.
2. ArtifactPublisher publishes signed manifest → Marketplace lists and completes checkout → Finance issues receipt.
3. StorySphere prompt → preview → MP4 → publish to LiveLoop with proofs.

## Local dev flow (AgentManager + StorySphere)
1. Start AgentManager stub: `pnpm --filter @illuvrse/agent-manager test:integration` (or run the server via `createAgentManagerServer` at port 4040).
2. Run StorySphere: `pnpm dev --filter storysphere` and web shell: `pnpm dev --filter web`.
3. Use Playground/Developers pages to drop a manifest and verify Kernel + Sentinel proofs (local stubs).
4. Hit `POST /storysphere/api/v1/generate` to enqueue a job in AgentManager; track it on `/jobs`.
5. Publish via `POST /storysphere/api/v1/liveloop/publish` to push into playlist with stub proof.
