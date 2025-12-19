# RYAN Agent

RYAN is a local, offline-first operator CLI. It records requests, produces a deterministic plan in mock mode, and logs actions to `.ryan/audit.log`.

## Commands

### ask
Analysis-only mode. It never modifies repo files. It can optionally run read-only helper tools when `--allow-shell` is passed.

Usage:
```
./ryan ask "<prompt>" [--allow-shell] [--scan] [--grep <pattern>]
```

Examples:
```
./ryan ask "Summarize the repo" 
./ryan ask "Find AgentManager code" --allow-shell --grep "AgentManager"
```

### do
Action mode. It creates a git checkpoint (branch by default) before running helper tools. Use `--dry-run` to only print the plan and skip commands/checkpoints.

Usage:
```
./ryan do "<task>" [--dry-run] [--checkpoint branch|commit] [--scan] [--grep <pattern>] [--test]
```

Examples:
```
./ryan do "Investigate failing tests" --test
./ryan do "Locate audit log handling" --scan --grep "audit"
```

### memory
Shows a summary and recent memory entries, or adds notes.

Usage:
```
./ryan memory [--add "<note>"]
./ryan memory add "<note>"
./ryan memory list --limit 50
```

### log
Tails recent audit entries.

Usage:
```
./ryan log --tail 50
```

## Mock Mode
RYAN uses mock mode by default. It:
- Records the request in local memory.
- Prints a deterministic execution plan.
- Runs helper tools only when explicitly requested.

## Workflows
`ryan do "start platform"` runs a local startup workflow:
1. `./illuvrse up --detach`
2. `./illuvrse status`
3. Basic health probe on `http://localhost:3000`
4. Collect logs for unhealthy services
5. Output a short diagnosis and fixes

`ryan do "fix failing tests"` runs an iterative workflow:
1. `./illuvrse test`
2. Parse failures and identify likely files
3. Apply safe fixers when possible (lint, snapshots)
4. Re-run tests up to `--max-iters`

`ryan do "doctor + autofix"` runs an offline autofix workflow:
1. `./illuvrse doctor --json`
2. Apply safe fixes (with confirmation unless `--yes` is passed)
3. Re-run doctor and summarize fixed checks and remaining issues

## Indexing
Build a local repo index for fast summaries of services, ports, env vars, entrypoints, and routes.
The index is stored at `.ryan/index.json`.

Examples:
```
./ryan index build
./ryan index show
./ryan index show --services
```

## Architecture Map
Generate a markdown architecture map from the repo index.

Examples:
```
./ryan map generate
```

## Checkpoints
`ryan do` creates a git checkpoint before actions:
- **branch (default):** creates `ryan/checkpoint/<timestamp>`.
- **commit:** creates an empty commit (requires a clean working tree).

Configure the mode with `--checkpoint` or `RYAN_CHECKPOINT_MODE`.

## Guardrails
`ryan do` enforces guardrails for risky commands and sensitive files. Use `--yes` to auto-approve prompts.

## Audit Log
All actions are appended to `.ryan/audit.log` as JSON Lines. Each entry includes:
- timestamp
- task or prompt
- actions taken
- commands run
- files changed (best-effort via git status)

## Memory Store
Memory is stored in `.ryan/memory.db` (SQLite via `better-sqlite3`). Use `ryan memory` to view summaries or add notes.

## Extending Tools
Helper tools live in `tools/ryan/cli.js`. Add new tools by:
1. Implementing a deterministic helper function.
2. Adding a flag to `ask` or `do` parsing.
3. Recording the action in the audit log.
