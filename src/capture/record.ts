import { readdir, rm } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createJiti } from "jiti";
import { chromium, type BrowserContext, type Locator, type Page } from "playwright";
import { ensureDir } from "../core/fs-utils.js";
import { createLoggedActions } from "./action-logger.js";
import { writeCoords } from "./coords-writer.js";
import type { CaptureArtifacts, CoordEvent, DemoScript } from "./types.js";
import type { CompiledAction, CompiledDemoFlow, SelectorRef } from "../planning/types.js";
import { SceneExecutionError } from "./errors.js";

interface RecordInput {
  scriptPath?: string;
  compiledFlow?: CompiledDemoFlow;
  url: string;
  tempDir: string;
  startupWaitMs: number;
  tailWaitMs: number;
  actionDelayMs: number;
  typeCharDelayMs: number;
  microPauseMinMs: number;
  microPauseMaxMs: number;
  humanizeSeed: number;
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

function isEBUSY(err: unknown): boolean {
  let current: unknown = err;
  const seen = new Set<unknown>();
  while (current && !seen.has(current)) {
    seen.add(current);
    const e = current as NodeJS.ErrnoException;
    if (e.code === "EBUSY") return true;
    if (typeof e.message === "string" && /EBUSY|resource busy or locked/i.test(e.message)) return true;
    current = e && typeof e === "object" && "cause" in e ? (e as { cause?: unknown }).cause : undefined;
  }
  return false;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retrying only context.close() is unsafe: a failed mid-close can leave the context broken and the
 * next attempt throws a different error. On EBUSY we retry the full browser session instead.
 */
async function closeContextWithRetry(context: BrowserContext): Promise<void> {
  const maxAttempts = 20;
  const baseDelayMs = 75;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await context.close();
      return;
    } catch (err) {
      if (!isEBUSY(err) || attempt === maxAttempts) {
        throw err;
      }
      await sleep(baseDelayMs * attempt);
    }
  }
}

function toLocator(page: Page, target: SelectorRef): Locator {
  if (target.testId) return page.getByTestId(target.testId);
  if (target.role) {
    const role = target.role as Parameters<Page["getByRole"]>[0];
    return page.getByRole(role, target.name ? { name: target.name, exact: target.exact } : undefined);
  }
  if (target.text) return page.getByText(target.text, target.exact ? { exact: true } : undefined);
  if (target.css) return page.locator(target.css);
  throw new Error("Action target must provide one selector strategy.");
}

function toCueDetail(action: CompiledAction): Record<string, string | number | boolean> {
  return {
    actionId: action.id,
    cueZoomScale: action.cue?.zoomScale ?? 0,
    cueCursorScale: action.cue?.cursorScale ?? 0,
    cueRippleRadius: action.cue?.rippleRadius ?? 0,
    cueRippleDurationMs: action.cue?.rippleDurationMs ?? 0
  };
}

async function runCompiledFlow(page: Page, actionsApi: ReturnType<typeof createLoggedActions>, flow: CompiledDemoFlow): Promise<void> {
  for (const scene of flow.scenes) {
    for (const action of scene.actions) {
      try {
        if (action.kind === "wait") {
          await page.waitForTimeout(action.waitMs ?? 250);
          continue;
        }
        if (action.kind === "navigate") {
          await page.goto(action.value ?? "/");
          await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
          continue;
        }
        if (action.kind === "assert_url") {
          const expected = action.value ?? "";
          if (!page.url().includes(expected)) {
            throw new Error(`Expected current url to include "${expected}"`);
          }
          continue;
        }
        const target = action.target ? toLocator(page, action.target) : undefined;
        if (!target) throw new Error("Missing selector target.");
        const detail = { sceneId: scene.id, ...toCueDetail(action) };
        if (action.kind === "click") await actionsApi.click(target, detail);
        else if (action.kind === "dblclick") await actionsApi.dblclick(target, detail);
        else if (action.kind === "hover") await actionsApi.hover(target, detail);
        else if (action.kind === "type") await actionsApi.type(target, action.value ?? "", detail);
        if (action.cue?.holdMs && action.cue.holdMs > 0) {
          await page.waitForTimeout(action.cue.holdMs);
        }
      } catch (cause) {
        throw new SceneExecutionError(scene.id, action.id, cause);
      }
    }
  }
}

export async function recordSession(input: RecordInput): Promise<CaptureArtifacts> {
  const videoDir = join(input.tempDir, "raw-video");
  const coordsPath = join(input.tempDir, "coords.json");
  const maxSessionAttempts = process.platform === "win32" ? 4 : 1;

  for (let sessionAttempt = 1; sessionAttempt <= maxSessionAttempts; sessionAttempt++) {
    await rm(videoDir, { recursive: true, force: true }).catch(() => undefined);
    await ensureDir(videoDir);

    const browser = await chromium.launch();
    try {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } }
      });

      const page = await context.newPage();
      const events: CoordEvent[] = [];
      const script = input.compiledFlow ? undefined : await loadDemoScript(input.scriptPath ?? "");
      const actions = createLoggedActions(events, {
        actionDelayMs: input.actionDelayMs,
        typeCharDelayMs: input.typeCharDelayMs,
        microPauseMinMs: input.microPauseMinMs,
        microPauseMaxMs: input.microPauseMaxMs,
        humanizeSeed: input.humanizeSeed
      });

      await page.goto(input.url);
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
      if (input.startupWaitMs > 0) {
        await page.waitForTimeout(input.startupWaitMs);
      }
      if (input.compiledFlow) {
        await runCompiledFlow(page, actions, input.compiledFlow);
      } else if (script) {
        await script({ page, actions });
      } else {
        throw new Error("No executable flow found. Provide --script, --plan-file, or --prompt.");
      }
      if (input.tailWaitMs > 0) {
        await page.waitForTimeout(input.tailWaitMs);
      }
      // Let context.close() stop screencast + finalize video; avoid page.close() first (Windows races).
      await closeContextWithRetry(context);
      await browser.close();
      if (process.platform === "win32") {
        await sleep(300);
      }

      await writeCoords(coordsPath, events);
      const videos = await readdir(videoDir);
      if (videos.length === 0) {
        throw new Error("No recorded video was produced by Playwright.");
      }

      return {
        rawVideoPath: join(videoDir, videos[0]),
        coordsPath
      };
    } catch (err) {
      await browser.close().catch(() => undefined);
      const retry = isEBUSY(err) && sessionAttempt < maxSessionAttempts;
      if (!retry) {
        throw err;
      }
      await sleep(400 * sessionAttempt);
    }
  }

  throw new Error("recordSession: exhausted retries (internal)");
}
