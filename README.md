# ILLUVRSE Monorepo

Monorepo for the governed creator platform and StorySphere studio.

## Apps
- `apps/web` – unified ILLUVRSE Platform hosting all surfaces:
  - `/` marketing shell (Home, Products, Marketplace, Developers, Control-Panel, etc.).
  - `/studio` StorySphere studio (prompt→MP4, LiveLoop, Player, GameGrid, Library, Settings).
  - `/news` ILLUVRSE News (articles, features, video, radio, admin).
  - `/food` Moms Kitchen (recipes, menus, meal planning).
  - `/gridstock` GridStock market terminal (dashboard, portfolio, games).

## Services
- `apps/kernel` – Kernel signing/verify service (default :4000).
- `apps/sentinel` – Sentinel policy evaluation (default :4105).
- `apps/marketplace` – Marketplace listing/checkout (default :4100).
- `apps/finance` – Finance receipts/verify (default :4300).
- `apps/artifact-publisher` – Artifact delivery proofs (default :4400).
- `apps/agent-manager` – Agent job queue + SSE (default :4040).
- `apps/memory` – Agent memory service (default :4500).
- `apps/world-state` – World state + realtime presence (default :4600).
- `apps/avatar-registry` – Avatar registry (default :4700).
- `apps/voice` – TTS/STT + viseme stub service (default :4800).
- Docker builds: `Dockerfile.service` with build args (see `docs/services.md`).

## Shared packages
- `@illuvrse/ui` – design tokens and shared UI primitives.
- `@illuvrse/config` – shared tsconfig and Tailwind preset.

## Scripts
- `pnpm dev` – start the unified platform (Next.js) on port 3000.
- `pnpm build` – build the unified platform.
- `pnpm start:platform` – start the production build on port 3000 (requires `pnpm build` first).
- `pnpm lint` – lint the unified platform.
- `pnpm test:smoke` – Playwright smoke tests (skipped by default). Set `RUN_UI_SMOKE=true WEB_URL=http://localhost:3000` and run `pnpm dev`.

## Codespaces / Devcontainers
- The repo ships with a `.devcontainer` tuned for GitHub Codespaces and VS Code Remote (Node 20 + pnpm 10).
- Quick start:
  1. Click **Code → Codespaces → Create codespace** (or reopen locally via VS Code Remote Containers).
  2. Wait for the container to install dependencies (`pnpm install --frozen-lockfile` runs automatically).
  3. Run `pnpm --filter web dev` to start the platform on port 3000 (ports are forwarded automatically in Codespaces).
  4. Optional: run `pnpm env:check -- --allow-stubs` to see which external URLs/tokens are needed for a real backend (stub defaults are allowed with the flag).

## Infra (Terraform)
See `infra/README.md` for AWS + Cloudflare provisioning and secret bootstrapping.

## Local operator (RYAN)
RYAN runs offline and logs actions in `.ryan/audit.log`. Memory is stored locally in `.ryan/memory.db` (via `better-sqlite3`).

Examples:
- `./ryan ask "What should I tackle next?"`
- `./ryan do "Run lint checks" --dry-run`
- `./ryan do "Investigate failing tests" --test`
- `./ryan index build`
- `./ryan index show --services`
- `./ryan map generate`
- `./ryan memory add "Decision: keep local operator offline-first."`
- `./ryan memory list --limit 20`
- `./ryan memory get <memory-id>`
- `./ryan memory delete <memory-id>`
- `./ryan log --tail 50`

## Local control (illuvrse)
Examples:
- `./illuvrse up`
- `./illuvrse down`
- `./illuvrse status`
- `./illuvrse doctor`
- `./illuvrse logs web --tail 200`
- `./illuvrse test`

## Environment
- `KERNEL_URL` – forward Kernel sign/verify requests to a real Kernel endpoint (defaults to stub).
- `SENTINEL_URL` – forward policy evaluation to Sentinel service (defaults to stub).
- `MARKETPLACE_URL` – forward listing/checkout to a real Marketplace endpoint (defaults to stub).
- `STORYSPHERE_BACKEND_URL` – forward generate/publish to a StorySphere backend (defaults to stub).
- `FINANCE_URL` – forward Finance receipt/verify to a Finance service.
- `ARTIFACT_PUBLISHER_URL` – forward artifact publish to a publisher service.
- `AGENT_BACKEND_URL` – AgentManager base URL for `/api/agent/*` (exec/status/stream polling).
- `MEMORY_URL` – Agent memory service base URL.
- `WORLD_STATE_URL` – World state service base URL.
- `VOICE_URL` – Voice pipeline service base URL.
- `AVATAR_REGISTRY_URL` – Avatar registry base URL.
- `KERNEL_TOKEN` / `SENTINEL_TOKEN` / `MARKETPLACE_TOKEN` / `FINANCE_TOKEN` / `ARTIFACT_PUBLISHER_TOKEN` / `AGENT_BACKEND_TOKEN` – service-to-service auth tokens.
- `MEMORY_TOKEN` – auth token for the memory service.
- `WORLD_TOKEN` – auth token for the world state service.
- `VOICE_TOKEN` – auth token for the voice service.
- `KERNEL_KMS_KEY_ID` – KMS key for Kernel signing (required for production signing).
- `AGENT_APPROVAL_REQUIRED` – set to `false` to bypass operator approval gating (defaults to required).
- `AGENT_APPROVER` – comma-separated list of approved operator names (defaults to `Ryan Lueckenotte`).
- `DATABASE_URL` – Postgres connection for News (required for `/news`).
- `NEXTAUTH_URL` / `NEXTAUTH_SECRET` – required for News auth (`/news/api/auth`).
- `INTERNAL_API_TOKEN` – shared secret for `/news/api/internal/*`.
- `NEXT_PUBLIC_PLATFORM_URL` – base URL used by Food/GridStock platform bar links.
- `NEXT_PUBLIC_FOOD_URL` – optional Food app URL for cross-linking.
- `NEXT_PUBLIC_GRIDSTOCK_URL` – optional GridStock app URL for cross-linking.
- Agent approvals persist to Postgres when `DATABASE_URL` is set; run `pnpm --filter @illuvrse/db prisma:migrate:dev` and `pnpm --filter @illuvrse/db prisma:generate`.
- If unset, all routes return local stub data suitable for localhost:3000.

## API stubs
- `POST /api/kernel/verify` – stub signature verification.
- `POST /api/sentinel/evaluate` – stub policy verdict.
- `GET /api/marketplace/listing` – stub listing with signed manifest.
- `POST /studio/api/v1/generate` – stub StorySphere generate job.
- `POST /studio/api/v1/liveloop/publish` – stub publish flow.

Golden path reminders:
1. IDEA builds artifact → Kernel signs manifest.
2. ArtifactPublisher publishes signed manifest → Marketplace lists and completes checkout → Finance issues receipt.
3. StorySphere prompt → preview → MP4 → publish to LiveLoop with proofs.

## Local dev flow (AgentManager + Studio)
1. Start AgentManager stub: `pnpm --filter @illuvrse/agent-manager test:integration` (or run the server via `createAgentManagerServer` at port 4040).
2. Run the platform: `pnpm dev` (StorySphere lives under `/studio` in the web app).
3. Use Playground/Developers pages to drop a manifest and verify Kernel + Sentinel proofs (local stubs).
4. Hit `POST /studio/api/v1/generate` to enqueue a job in AgentManager; track it on `/studio/jobs`.
5. Publish via `POST /studio/api/v1/liveloop/publish` to push into playlist with stub proof.
