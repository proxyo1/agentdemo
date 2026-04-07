import type { DemoScript } from "../../src/capture/types.js";

const script: DemoScript = async ({ page, actions }) => {
  await page.waitForLoadState("domcontentloaded");
  const body = page.locator("body");
  await actions.hover(body);
};

export default script;
