import { test, expect } from "@playwright/test";

const webBase = process.env.WEB_URL ?? "http://localhost:3000";
const runUI = process.env.RUN_UI_SMOKE === "true";

test.describe("StorySphere studio generate flow", () => {
  test.skip(!runUI, "Set RUN_UI_SMOKE=true to run studio smoke tests.");

  test("enqueues a job from the Generate preview action", async ({ page }) => {
    await page.goto(`${webBase}/studio`);

    const promptInput = page.getByTestId("studio-prompt-input");
    const generateButton = page.getByTestId("studio-generate-button");
    const queueItems = page.getByTestId("studio-render-queue-item");

    await expect(promptInput).toBeVisible();
    const initialCount = await queueItems.count();

    const uniquePrompt = `Smoke prompt ${Date.now()}`;
    await promptInput.fill(uniquePrompt);
    await generateButton.click();

    await expect(generateButton).toBeEnabled({ timeout: 15_000 });
    await expect(queueItems).toHaveCount(initialCount + 1, { timeout: 15_000 });

    const newJob = queueItems.first();
    await expect(newJob).toContainText(uniquePrompt);
    const jobId = await newJob.getAttribute("data-job-id");
    expect(jobId?.length ?? 0).toBeGreaterThan(0);
  });
});
