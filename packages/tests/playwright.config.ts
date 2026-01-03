import { defineConfig } from "@playwright/test";

const webBaseURL = process.env.WEB_URL ?? "http://localhost:3000";
const runUISmoke = process.env.RUN_UI_SMOKE === "true";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  reporter: [["list"]],
  workers: 1,
  use: {
    baseURL: webBaseURL,
    ignoreHTTPSErrors: true
  },
  webServer: runUISmoke
    ? {
        command: "pnpm --filter web dev -- --hostname 0.0.0.0 --port 3000",
        url: webBaseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000
      }
    : undefined,
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium", baseURL: webBaseURL }
    }
  ]
});
