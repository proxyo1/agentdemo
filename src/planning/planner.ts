import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import type { CinematicPlan, PlannedAction } from "./types.js";

interface PlanInput {
  prompt: string;
  codebaseRoot: string;
}

const READ_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".md", ".json", ".html"]);

async function collectCodebaseHints(root: string): Promise<string[]> {
  const hints: string[] = [];
  const queue: string[] = [root];
  const maxFiles = 120;
  while (queue.length > 0 && hints.length < maxFiles) {
    const dir = queue.shift();
    if (!dir) break;
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name.startsWith(".")) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        queue.push(full);
        continue;
      }
      if (!READ_EXT.has(extname(entry.name))) continue;
      const text = await readFile(full, "utf-8").catch(() => "");
      if (!text) continue;
      const routeMatch = text.match(/["'`]\/[a-z0-9\-_/]+["'`]/i);
      const labelMatch = text.match(/getByRole\(["'`](button|link|textbox|searchbox)["'`],\s*\{\s*name:\s*["'`](.+?)["'`]/i);
      const rel = relative(root, full).replace(/\\/g, "/");
      if (routeMatch) hints.push(`${rel}: route ${routeMatch[0].slice(1, -1)}`);
      if (labelMatch) hints.push(`${rel}: ${labelMatch[1]} "${labelMatch[2]}"`);
    }
  }
  return hints.slice(0, 25);
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function buildActionsFromPrompt(prompt: string): PlannedAction[] {
  const actions: PlannedAction[] = [];
  const lines = prompt
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  let idx = 1;
  for (const line of lines) {
    const lower = line.toLowerCase();
    const id = `a${idx++}`;
    if (lower.startsWith("go to ") || lower.includes(" page")) {
      const pageName = line.replace(/^go to\s+/i, "").replace(/\s+page$/i, "").trim();
      const path = `/${slug(pageName) || ""}`;
      actions.push({
        id,
        kind: "navigate",
        value: path === "/" ? "/" : path,
        cue: { zoomScale: 1.04, holdMs: 500 }
      });
      continue;
    }
    if (lower.startsWith("search ")) {
      actions.push({
        id: `${id}-focus`,
        kind: "click",
        target: { role: "searchbox" },
        cue: { zoomScale: 1.16, cursorScale: 1.08 }
      });
      actions.push({
        id,
        kind: "type",
        target: { role: "searchbox" },
        value: line.replace(/^search\s+/i, ""),
        cue: { zoomScale: 1.18, holdMs: 700 }
      });
      continue;
    }
    if (lower.startsWith("filter ") || lower.includes(" then filter ")) {
      const filterName = line.replace(/^filter\s+/i, "").replace(/^.*then filter\s+/i, "");
      actions.push({
        id,
        kind: "click",
        target: { role: "button", name: filterName },
        cue: { zoomScale: 1.2, rippleRadius: 36 }
      });
      continue;
    }
    actions.push({
      id,
      kind: "wait",
      waitMs: 400,
      cue: { holdMs: 400 }
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: "a1",
      kind: "hover",
      target: { css: "body" },
      cue: { zoomScale: 1.03, holdMs: 500 }
    });
  }
  return actions;
}

export async function createCinematicPlan(input: PlanInput): Promise<CinematicPlan> {
  const codebaseSummary = await collectCodebaseHints(input.codebaseRoot);
  return {
    version: "1",
    generatedAt: new Date().toISOString(),
    prompt: input.prompt,
    codebaseSummary,
    directorNotes: [
      "Lead with a quick orientation beat before first high-value action.",
      "Use tighter zoom for form input and search moments.",
      "Hold after meaningful transitions so UI updates are readable."
    ],
    failurePolicy: "immediate_stop",
    scenes: [
      {
        id: "scene-1",
        title: "Primary user journey",
        goal: "Show the requested product flow with cinematic pacing.",
        actions: buildActionsFromPrompt(input.prompt)
      }
    ]
  };
}
