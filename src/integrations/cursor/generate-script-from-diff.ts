import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { execa } from "execa";

interface GenerateFromDiffInput {
  baseRef: string;
  outputScriptPath: string;
  url: string;
}

interface DiffPlan {
  files: string[];
  routeCandidates: string[];
  labels: string[];
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function inferRouteCandidates(files: string[]): string[] {
  const routes: string[] = [];
  for (const file of files) {
    const parts = file.replaceAll("\\", "/").split("/");
    const keyIndex = parts.findIndex((p) => p === "pages" || p === "app" || p === "routes");
    if (keyIndex >= 0 && parts[keyIndex + 1]) {
      const segment = parts[keyIndex + 1].replace(/\.(tsx|ts|jsx|js|css|scss|mdx)$/i, "");
      if (segment !== "index" && segment !== "page" && segment !== "layout") {
        routes.push(`/${segment.toLowerCase()}`);
      }
    }
  }
  return unique(routes).slice(0, 3);
}

function inferLabels(files: string[]): string[] {
  const labels = files
    .map((f) => f.split(/[\\/]/).pop() ?? "")
    .map((name) => name.replace(/\.(tsx|ts|jsx|js|css|scss|mdx)$/i, ""))
    .map((name) => name.replace(/[-_]/g, " ").trim())
    .filter((name) => name.length >= 3 && !["index", "page", "layout"].includes(name.toLowerCase()));
  return unique(labels).slice(0, 6);
}

async function buildDiffPlan(baseRef: string): Promise<DiffPlan> {
  const { stdout } = await execa("git", ["diff", "--name-only", `${baseRef}...HEAD`]);
  const files = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return {
    files,
    routeCandidates: inferRouteCandidates(files),
    labels: inferLabels(files)
  };
}

function scriptTemplate(plan: DiffPlan, url: string): string {
  const routeArrayLiteral = JSON.stringify(plan.routeCandidates);
  const labelArrayLiteral = JSON.stringify(plan.labels);
  const fileArrayLiteral = JSON.stringify(plan.files.slice(0, 25));

  return `import type { DemoScript } from "../../src/capture/types.js";

const baseUrl = ${JSON.stringify(url)};
const routeCandidates: string[] = ${routeArrayLiteral};
const labelCandidates: string[] = ${labelArrayLiteral};
const changedFiles: string[] = ${fileArrayLiteral};

async function settle(page: Parameters<DemoScript>[0]["page"]): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(350);
}

async function demoStep(
  page: Parameters<DemoScript>[0]["page"],
  name: string,
  fn: () => Promise<void>
): Promise<void> {
  await fn();
  // Keep pacing human-readable for review videos.
  await settle(page);
  await page.waitForTimeout(500);
}

const script: DemoScript = async ({ page, actions }) => {
  await demoStep(page, "Open app", async () => {
    await page.goto(baseUrl);
  });

  await demoStep(page, "Initial focus", async () => {
    await actions.hover(page.locator("body"));
  });

  for (const route of routeCandidates) {
    await demoStep(page, \`Navigate \${route}\`, async () => {
      await page.goto(new URL(route, baseUrl).toString());
    });
  }

  for (const label of labelCandidates) {
    await demoStep(page, \`Inspect \${label}\`, async () => {
      const lower = label.toLowerCase();
      const heading = page.getByRole("heading", { name: new RegExp(lower, "i") }).first();
      if (await heading.count()) {
        await actions.hover(heading);
        return;
      }
      const button = page.getByRole("button", { name: new RegExp(lower, "i") }).first();
      if (await button.count()) {
        await actions.hover(button);
      }
    });
  }

  // Final linger to avoid abrupt ending and help reviewer context.
  await page.waitForTimeout(1200);
  // Keep context for generated-script debugging.
  console.log("AutoDemo changed files:", changedFiles.join(", "));
};

export default script;
`;
}

export async function generateScriptFromDiff(input: GenerateFromDiffInput): Promise<{ fileCount: number }> {
  const plan = await buildDiffPlan(input.baseRef);
  await mkdir(dirname(input.outputScriptPath), { recursive: true });
  await writeFile(input.outputScriptPath, scriptTemplate(plan, input.url), "utf-8");
  return { fileCount: plan.files.length };
}
