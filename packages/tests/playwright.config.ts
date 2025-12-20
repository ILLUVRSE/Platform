import { defineConfig } from "@playwright/test";

const webBaseURL = process.env.WEB_URL ?? "http://localhost:3000";
const studioBaseURL = process.env.STUDIO_URL ?? "http://localhost:3001";
const runUISmoke = process.env.RUN_UI_SMOKE === "true";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  reporter: [["list"]],
  use: {
    baseURL: webBaseURL,
    ignoreHTTPSErrors: true
  },
  projects: [
    {
      name: "web",
      use: { baseURL: webBaseURL },
      webServer: runUISmoke
        ? {
            command: "pnpm dev --filter web -- --hostname 0.0.0.0 --port 3000",
            url: webBaseURL,
            reuseExistingServer: true,
            timeout: 120_000
          }
        : undefined
    },
    {
      name: "storysphere",
      use: { baseURL: studioBaseURL },
      webServer: runUISmoke
        ? {
            command: "pnpm dev --filter storysphere -- --hostname 0.0.0.0 --port 3001",
            url: studioBaseURL,
            reuseExistingServer: true,
            timeout: 120_000
          }
        : undefined
    }
  ]
});
