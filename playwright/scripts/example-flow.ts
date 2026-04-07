import type { DemoScript } from "../../src/capture/types.js";

async function settle(page: Parameters<DemoScript>[0]["page"]): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(350);
}

async function demoStep(
  page: Parameters<DemoScript>[0]["page"],
  fn: () => Promise<void>
): Promise<void> {
  await fn();
  await settle(page);
  // Short showcase hold so the result is readable in demos.
  await page.waitForTimeout(450);
}

const script: DemoScript = async ({ page, actions }) => {
  await demoStep(page, async () => {
    await settle(page);
  });

  const searchInput = page.getByPlaceholder(/Search roles/i);
  await demoStep(page, async () => {
    await actions.click(searchInput);
    // actions.type uses character-by-character typing for human pacing.
    await actions.type(searchInput, "software engineer");
  });

  const searchButton = page.getByRole("button", { name: /^search$/i });
  await demoStep(page, async () => {
    await actions.click(searchButton);
  });
};

export default script;
