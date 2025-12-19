# Assumptions

- `./illuvrse up` currently boots the web app only (`pnpm dev`). Other services will be added as the local stack grows.
- `./illuvrse down`, `./illuvrse status`, and `./illuvrse logs` track services started with `./illuvrse up --detach`. Only the `web` service is tracked today.
- `./illuvrse up` prefers Docker Compose only when a compose file exists in the repo root and Docker Compose is installed.
- `./illuvrse test` runs `pnpm test:smoke` when no `test` script exists in the root `package.json`.
- `./illuvrse doctor` checks ports declared in the local service map (currently port 3000 for web).
- Destructive command detection in `./ryan do` is heuristic; use `--yes` only when you are confident the command is safe.
- The `ryan` CLI is implemented in Node.js to stay consistent with the existing repo tooling and avoid extra dependencies.
- `ryan` uses mock mode for planning by default; local LLM integration is not configured yet.
- `ryan do` defaults to a git checkpoint branch; commit checkpoints are supported but require a clean working tree.
- `ryan ask` only writes to `.ryan` (audit log and memory) and does not touch repo source files.
- The start-platform workflow uses a basic HTTP probe against `http://localhost:3000` as its health check; deeper health checks are not yet available.
- The fix-failing-tests workflow only applies automated fixes for lint and snapshot mismatches; other failures require manual changes.
- `better-sqlite3` is used for the local memory store because it is already part of the monorepo and keeps memory offline without new services.
