#!/usr/bin/env node
/**
 * Simple environment validator for local dev and CI.
 *
 * Usage:
 *   pnpm env:check
 *   pnpm env:check -- --allow-stubs   # treat service URLs/tokens as warnings (for local stub mode)
 */

const allowStubs = process.argv.includes("--allow-stubs");

const groups = {
  services: [
    { key: "KERNEL_URL", hint: "Kernel signing/verify endpoint (e.g. http://localhost:4000)" },
    { key: "SENTINEL_URL", hint: "Sentinel policy evaluation endpoint (e.g. http://localhost:4105)" },
    { key: "MARKETPLACE_URL", hint: "Marketplace endpoint (e.g. http://localhost:4100)" },
    { key: "FINANCE_URL", hint: "Finance receipts endpoint (e.g. http://localhost:4300)" },
    { key: "ARTIFACT_PUBLISHER_URL", hint: "Artifact publisher endpoint (e.g. http://localhost:4400)" },
    { key: "AGENT_BACKEND_URL", hint: "AgentManager base URL for exec/status/stream" },
    { key: "MEMORY_URL", hint: "Agent memory service base URL" },
    { key: "WORLD_STATE_URL", hint: "World state service base URL" },
    { key: "VOICE_URL", hint: "Voice pipeline service base URL" },
    { key: "AVATAR_REGISTRY_URL", hint: "Avatar registry base URL" },
    { key: "STORYSPHERE_BACKEND_URL", hint: "StorySphere backend for generation" }
  ],
  tokens: [
    { key: "KERNEL_TOKEN", hint: "Service-to-service token for Kernel" },
    { key: "SENTINEL_TOKEN", hint: "Service-to-service token for Sentinel" },
    { key: "MARKETPLACE_TOKEN", hint: "Service-to-service token for Marketplace" },
    { key: "FINANCE_TOKEN", hint: "Service-to-service token for Finance" },
    { key: "ARTIFACT_PUBLISHER_TOKEN", hint: "Service-to-service token for Artifact Publisher" },
    { key: "AGENT_BACKEND_TOKEN", hint: "Token for AgentManager" },
    { key: "MEMORY_TOKEN", hint: "Token for memory service" },
    { key: "WORLD_TOKEN", hint: "Token for world state service" },
    { key: "VOICE_TOKEN", hint: "Token for voice service" }
  ],
  auth: [
    { key: "NEXTAUTH_URL", hint: "External URL for NextAuth callbacks (e.g. http://localhost:3000)" },
    { key: "NEXTAUTH_SECRET", hint: "Random 32+ char secret for NextAuth" }
  ],
  database: [
    { key: "DATABASE_URL", hint: "Postgres connection string for News + approvals" }
  ]
};

const missing = [];
const warnings = [];

for (const [groupName, entries] of Object.entries(groups)) {
  for (const { key, hint } of entries) {
    const value = process.env[key];
    if (value && value.trim().length > 0) continue;

    const message = `${key} (${hint})`;
    if (allowStubs && (groupName === "services" || groupName === "tokens")) {
      warnings.push(message);
    } else {
      missing.push(message);
    }
  }
}

if (missing.length > 0) {
  console.error("❌ Missing required environment variables:\n");
  for (const item of missing) {
    console.error(`- ${item}`);
  }
  console.error("\nSet the variables above in .env.local or your deployment environment.");
  console.error(
    "If you are intentionally running in stub mode, rerun with `pnpm env:check -- --allow-stubs` to downgrade service URLs/tokens to warnings."
  );
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn("⚠️  Stub mode enabled; the following service URLs/tokens are unset:");
  for (const item of warnings) {
    console.warn(`- ${item}`);
  }
  console.warn("Stubbed routes will be used where available.");
}

console.log("✅ Environment looks good.");
