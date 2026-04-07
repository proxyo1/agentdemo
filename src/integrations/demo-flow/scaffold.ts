import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

/** Starter script for any user-defined flow; fill in steps after `scaffold`. */
export function demoFlowTemplate(): string {
  return `import type { DemoScript } from "../../src/capture/types.js";

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
  await page.waitForTimeout(450);
}

const script: DemoScript = async ({ page, actions }) => {
  // Recorder already loads --url before this runs. Replace the steps below with the flow the user wants.

  await demoStep(page, async () => {
    await actions.hover(page.locator("body"));
  });

  // Examples (uncomment and adapt):
  // await demoStep(page, async () => {
  //   await page.goto("/other-path");
  // });
  // await demoStep(page, async () => {
  //   await actions.click(page.getByRole("button", { name: /submit/i }));
  // });
};

export default script;
`;
}

export async function scaffoldDemoScript(outputPath: string): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, demoFlowTemplate(), "utf-8");
}
