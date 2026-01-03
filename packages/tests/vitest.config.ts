import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"]
  },
  resolve: {
    alias: {
      "@web": path.resolve(__dirname, "..", "..", "apps", "web", "src"),
      "@studio": path.resolve(__dirname, "..", "..", "apps", "web", "src", "app", "studio"),
      "@food": path.resolve(__dirname, "..", "..", "apps", "web", "src", "food"),
      "@gridstock": path.resolve(__dirname, "..", "..", "apps", "web", "src", "gridstock"),
      "@news": path.resolve(__dirname, "..", "..", "apps", "web", "src", "news")
    }
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, "..", "..")]
    }
  }
});
