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

    const publishRes = await request.post(`${studioBase}/api/v1/liveloop/publish`, {
      data: { assetId: "asset-smoke" }
    });
    expect(publishRes.ok()).toBeTruthy();
    const pubJson = await publishRes.json();
    expect(pubJson.proof).toBeTruthy();
    expect(pubJson.proof.sha256).toBeDefined();
  });

  test("Marketplace checkout + Finance receipt", async ({ request }) => {
    test.skip(!webAvailable, `Web server not running at ${webBase}`);
    const checkoutRes = await request.post(`${webBase}/api/marketplace/checkout`, {
      data: { sku: "agent-bundle-grid-analyst", price: 49, currency: "USD", sha256: "d3be:11ff...9ae1" }
    });
    expect(checkoutRes.ok()).toBeTruthy();
    const json = await checkoutRes.json();
    expect(json.receipt?.id).toBeTruthy();
    expect(json.finance?.receipt?.sha256 ?? json.sha256).toBeTruthy();
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
