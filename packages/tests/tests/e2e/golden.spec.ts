import { test, expect } from "@playwright/test";

const webBase = process.env.WEB_URL ?? "http://localhost:3000";
const studioBase = process.env.STUDIO_URL ?? "http://localhost:3001";
const runUI = process.env.RUN_UI_SMOKE === "true";

let webAvailable = false;
let studioAvailable = false;

async function isReachable(url: string, request: any) {
  try {
    const res = await request.get(url);
    return res.ok();
  } catch {
    return false;
  }
}

test.beforeAll(async ({ request }) => {
  webAvailable = await isReachable(webBase, request);
  studioAvailable = await isReachable(studioBase, request);
});

test.describe("ILLUVRSE golden paths (smoke)", () => {
  test.skip(!runUI, "Set RUN_UI_SMOKE=true and run dev servers to execute UI smoke tests.");

  test("web home shows trust and product tiles", async ({ page }) => {
    test.skip(!webAvailable, `Web server not running at ${webBase}`);
    await page.goto(webBase);
    await expect(page.getByRole("heading", { name: /Create, sign, deliver/i })).toBeVisible();
    await expect(page.getByText("Signed, auditable, policy-enforced")).toBeVisible();
    await expect(page.getByText("IDEA").first()).toBeVisible();
    await expect(page.getByText("Marketplace").first()).toBeVisible();
  });

  test("LiveLoop on-air badge tracks mocked UTC hour", async ({ browser }) => {
    test.skip(!webAvailable, `Web server not running at ${webBase}`);

    const hoursToCheck = [3, 9];
    for (const hour of hoursToCheck) {
      const context = await browser.newContext();
      await context.addInitScript(({ fixed }) => {
        const fixedMs = fixed;
        const OriginalDate = Date;
        class MockDate extends OriginalDate {
          constructor(...args: any[]) {
            if (args.length === 0) {
              return new OriginalDate(fixedMs);
            }
            return new OriginalDate(...args);
          }
          static now() {
            return fixedMs;
          }
        }
        MockDate.parse = OriginalDate.parse;
        MockDate.UTC = OriginalDate.UTC;
        // @ts-ignore
        window.Date = MockDate as DateConstructor;
      }, { fixed: Date.UTC(2024, 0, 1, hour, 0, 0) });

      const page = await context.newPage();
      await page.goto(`${webBase}/liveloop`);

      const hourLabel = `LiveLoop · ${String(hour).padStart(2, "0")}:00`;
      const windowLabel = `${String(hour).padStart(2, "0")}:00–${String((hour + 1) % 24).padStart(2, "0")}:00`;

      await expect(page.getByText(hourLabel)).toBeVisible();

      const onAirEvent = page.locator("div", {
        hasText: `Day 1 · LiveLoop (UTC) · ${windowLabel}`
      }).first();
      await expect(onAirEvent.getByText("Live")).toBeVisible();

      await context.close();
    }
  });

  test("web API kernel verify returns proof", async ({ request }) => {
    test.skip(!webAvailable, `Web server not running at ${webBase}`);
    const res = await request.post(`${webBase}/api/kernel/verify`, {
      data: { sha256: "abc123", signature: "stub" }
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.valid).toBe(true);
    expect(json.sha256).toBe("abc123");
  });

  test("StorySphere studio shows generate panel and fetches jobs", async ({ page }) => {
    test.skip(!studioAvailable, `StorySphere server not running at ${studioBase}`);
    await page.goto(studioBase);
    await expect(page.getByRole("heading", { name: /Prompt → Preview/i })).toBeVisible();
    await expect(page.getByText("Generate 7s preview")).toBeVisible();
  });

  test("StorySphere API generate + publish", async ({ request }) => {
    test.skip(!studioAvailable, `StorySphere server not running at ${studioBase}`);
    const genRes = await request.post(`${studioBase}/api/v1/generate`, {
      data: { prompt: "smoke test", duration: 7, publishToLiveLoop: true }
    });
    expect(genRes.ok()).toBeTruthy();
    const genJson = await genRes.json();
    expect(genJson.jobId).toBeTruthy();
    expect(genJson.status).toBe("queued");
    expect(genJson.proofSha).toBeTruthy();
    expect(genJson.policyVerdict).toBeTruthy();

    const jobsRes = await request.get(`${studioBase}/api/v1/jobs`);
    expect(jobsRes.ok()).toBeTruthy();
    const jobsJson = await jobsRes.json();
    const fromQueue = (jobsJson.jobs ?? []).find((j: any) => j.id === genJson.jobId);
    expect(fromQueue?.proofSha ?? fromQueue?.proof?.sha).toBe(genJson.proofSha);
    expect((fromQueue?.policyVerdict ?? "") as string).toContain("Sentinel");

    const publishAssetId = "asset-smoke";
    const publishRes = await request.post(`${studioBase}/api/v1/liveloop/publish`, {
      data: { assetId: publishAssetId }
    });
    expect(publishRes.ok()).toBeTruthy();
    const pubJson = await publishRes.json();
    expect(pubJson.proof).toBeTruthy();
    expect(pubJson.proof.sha256).toBeDefined();
    expect(pubJson.proofSha ?? pubJson.proof.sha256).toBeDefined();
    expect(pubJson.proof.policyVerdict).toBeTruthy();

    const playlistRes = await request.get(`${studioBase}/api/v1/liveloop/playlist`);
    expect(playlistRes.ok()).toBeTruthy();
    const playlistJson = await playlistRes.json();
    const published = (playlistJson.playlist ?? []).find((item: any) => item.id === publishAssetId || item.title === publishAssetId);
    expect(published?.proofSha ?? published?.sha).toBe(pubJson.proofSha ?? pubJson.proof.sha256);
    expect(published?.policyVerdict ?? "").toBe(pubJson.proof.policyVerdict);
  });

  test("Marketplace checkout + Finance receipt", async ({ request }) => {
    test.skip(!webAvailable, `Web server not running at ${webBase}`);
    const manifestProof = {
      sha256: "d3be:11ff...9ae1",
      signer: "kernel-multisig",
      timestamp: new Date().toISOString(),
      policyVerdict: "SentinelNet PASS"
    };
    const checkoutRes = await request.post(`${webBase}/api/marketplace/checkout`, {
      data: {
        sku: "agent-bundle-grid-analyst",
        price: 49,
        currency: "USD",
        sha256: "d3be:11ff...9ae1",
        manifestProof
      }
    });
    expect(checkoutRes.ok()).toBeTruthy();
    const json = await checkoutRes.json();
    expect(json.receipt?.id).toBeTruthy();
    expect(json.finance?.receipt?.sha256 ?? json.sha256).toBeTruthy();
    expect(json.delivery?.downloadUrl ?? json.finance?.delivery?.downloadUrl).toBeTruthy();
    expect(json.payment?.status).toBeTruthy();
    expect(json.manifestProof?.sha256 ?? json.proof?.sha256).toBeTruthy();
  });

  test("Artifact publish delivers proof", async ({ request }) => {
    test.skip(!webAvailable, `Web server not running at ${webBase}`);
    const res = await request.post(`${webBase}/api/artifact/publish`, {
      data: { sha256: "abc123", destination: "buyer1" }
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.delivery?.proof).toBeTruthy();
  });
});
