# ILLUVRSE Monorepo

Monorepo for the governed creator platform and StorySphere studio.

## Apps
- `apps/web` – unified ILLUVRSE Platform hosting all surfaces:
  - `/` marketing shell (Home, Products, Marketplace, Developers, Control-Panel, etc.).
  - `/studio` StorySphere studio (prompt→MP4, LiveLoop, Player, GameGrid, Library, Settings).
  - `/news` ILLUVRSE News (articles, features, video, radio, admin).
- `Food/apps/moms-kitchen` – FoodNetwork-style kitchen app (recipes, menus, meal planning).
- `GridStock` – CNBC/Bloomberg-style market terminal (dashboard, portfolio, games).

## Shared packages
- `@illuvrse/ui` – design tokens and shared UI primitives.
- `@illuvrse/config` – shared tsconfig and Tailwind preset.

## Scripts
- `pnpm dev` – start the unified platform (Next.js) on port 3000.
- `pnpm build` – build the unified platform.
- `pnpm start:platform` – start the production build on port 3000 (requires `pnpm build` first).
- `pnpm lint` – lint the unified platform.
- `pnpm test:smoke` – Playwright smoke tests (skipped by default). Set `RUN_UI_SMOKE=true WEB_URL=http://localhost:3000 STUDIO_URL=http://localhost:3000/news` and run `pnpm dev`.

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
- `MARKETPLACE_URL` – forward listing/checkout to a real Marketplace endpoint (defaults to stub).
- `STORYSPHERE_BACKEND_URL` – forward generate/publish to a StorySphere backend (defaults to stub).
- `FINANCE_URL` – forward Finance receipt/verify to a Finance service.
- `ARTIFACT_PUBLISHER_URL` – forward artifact publish to a publisher service.
- `AGENT_BACKEND_URL` – AgentManager base URL for `/api/agent/*` (exec/status/stream polling).
- `AGENT_APPROVAL_REQUIRED` – set to `false` to bypass operator approval gating (defaults to required).
- `AGENT_APPROVER` – comma-separated list of approved operator names (defaults to `Ryan Lueckenotte`).
- `DATABASE_URL` – Postgres connection for News (required for `/news`).
- `NEXTAUTH_URL` / `NEXTAUTH_SECRET` – required for News auth (`/news/api/auth`).
- `INTERNAL_API_TOKEN` – shared secret for `/news/api/internal/*`.
- `NEXT_PUBLIC_PLATFORM_URL` – base URL used by Food/GridStock platform bar links.
- `NEXT_PUBLIC_FOOD_URL` – optional Food app URL for cross-linking.
- `NEXT_PUBLIC_GRIDSTOCK_URL` – optional GridStock app URL for cross-linking.
- `FOOD_UPSTREAM_URL` – upstream base for `/food` rewrites (e.g., `http://localhost:4001`).
- `GRIDSTOCK_UPSTREAM_URL` – upstream base for `/gridstock` rewrites (e.g., `http://localhost:4002`).
- Agent approvals persist to Postgres when `DATABASE_URL` is set; run `pnpm --filter @illuvrse/db prisma:migrate:dev` and `pnpm --filter @illuvrse/db prisma:generate`.
- If unset, all routes return local stub data suitable for localhost:3000.

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
