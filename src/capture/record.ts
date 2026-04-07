import { readdir } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createJiti } from "jiti";
import { chromium } from "playwright";
import { createLoggedActions } from "./action-logger.js";
import { writeCoords } from "./coords-writer.js";
import type { CaptureArtifacts, CoordEvent, DemoScript } from "./types.js";

interface RecordInput {
  scriptPath: string;
  url: string;
  tempDir: string;
}

async function loadDemoScript(scriptPath: string): Promise<DemoScript> {
  const fullPath = resolve(scriptPath);
  let mod: Record<string, unknown>;
  try {
    mod = (await import(pathToFileURL(fullPath).href)) as Record<string, unknown>;
  } catch {
    // Fallback for .ts scripts when running compiled CLI with plain node.
    const jiti = createJiti(import.meta.url);
    mod = (await jiti.import(fullPath)) as Record<string, unknown>;
  }
  const script = mod.default as DemoScript | undefined;
  if (!script) {
    throw new Error(`Script ${basename(scriptPath)} must export default async function.`);
  }
  return script;
}

export async function recordSession(input: RecordInput): Promise<CaptureArtifacts> {
  const videoDir = join(input.tempDir, "raw-video");
  const coordsPath = join(input.tempDir, "coords.json");
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } }
  });

  const page = await context.newPage();
  const events: CoordEvent[] = [];
  const script = await loadDemoScript(input.scriptPath);
  const actions = createLoggedActions(events);

  await page.goto(input.url);
  await script({ page, actions });
  await context.close();
  await browser.close();

  await writeCoords(coordsPath, events);
  const videos = await readdir(videoDir);
  if (videos.length === 0) {
    throw new Error("No recorded video was produced by Playwright.");
  }

  return {
    rawVideoPath: join(videoDir, videos[0]),
    coordsPath
  };
}
