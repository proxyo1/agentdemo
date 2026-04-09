import { parseCliOptions, type CliOptions } from "./config.js";
import { ensureDir, makeTempDir, removeDir } from "./fs-utils.js";
import { logger } from "./logger.js";
import { recordSession } from "../capture/record.js";
import { renderPolishedVideo } from "../render/pipeline.js";
import { dirname, resolve } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { parseCinematicPlan } from "../planning/schema.js";
import { createCinematicPlan } from "../planning/planner.js";
import { compileCinematicPlan } from "../planning/compile-plan.js";
import type { CinematicPlan } from "../planning/types.js";
import { writeBlockerReport } from "./reporting.js";

async function loadOrCreatePlan(options: CliOptions): Promise<CinematicPlan | undefined> {
  if (options.planFile) {
    const raw = await readFile(resolve(options.planFile), "utf-8");
    return parseCinematicPlan(JSON.parse(raw));
  }
  if (!options.prompt) {
    return undefined;
  }

  const plan = await createCinematicPlan({
    prompt: options.prompt,
    codebaseRoot: resolve(options.codebaseRoot)
  });
  const outPath = resolve(options.planOut);
  await ensureDir(dirname(outPath));
  await writeFile(outPath, JSON.stringify(plan, null, 2), "utf-8");
  const notesPath = outPath.replace(/\.json$/i, ".notes.md");
  const notes = `# Director Notes\n\n${plan.directorNotes.map((note) => `- ${note}`).join("\n")}\n`;
  await writeFile(notesPath, notes, "utf-8");
  logger.info(`Wrote cinematic plan: ${outPath}`);
  logger.info(`Wrote director notes: ${notesPath}`);
  return plan;
}

export async function runPipeline(rawOptions: unknown): Promise<void> {
  const options: CliOptions = parseCliOptions(rawOptions);
  const tempDir = await makeTempDir();
  logger.info(`Temp workspace: ${tempDir}`);

  try {
    const plan = await loadOrCreatePlan(options);
    if (options.planOnly) {
      logger.info("Plan-only mode complete.");
      return;
    }
    const compiledFlow = plan ? compileCinematicPlan(plan) : undefined;
    logger.info("Recording Playwright session...");
    const artifacts = await recordSession({
      scriptPath: options.script,
      compiledFlow,
      url: options.url,
      tempDir,
      startupWaitMs: options.startupWaitMs,
      tailWaitMs: options.tailWaitMs,
      actionDelayMs: options.actionDelayMs,
      typeCharDelayMs: options.typeCharDelayMs,
      microPauseMinMs: options.microPauseMinMs,
      microPauseMaxMs: options.microPauseMaxMs,
      humanizeSeed: options.humanizeSeed
    });

    logger.info("Rendering final mp4...");
    await renderPolishedVideo({
      rawVideoPath: artifacts.rawVideoPath,
      coordsPath: artifacts.coordsPath,
      outputPath: options.out,
      fps: options.fps,
      interpolate: options.interpolate,
      composite: options.composite,
      cursorPng: options.cursorPng,
      cursorHotspotX: options.cursorHotspotX,
      cursorHotspotY: options.cursorHotspotY,
      style: options.style,
      plan
    });
    logger.info(`Done: ${options.out}`);
  } catch (error) {
    const reportPath = await writeBlockerReport({
      outputPath: options.out,
      error,
      tempDir
    });
    logger.error(`Stopped after blocker. Report: ${reportPath}`);
    throw error;
  } finally {
    if (!options.keepTemp) {
      await removeDir(tempDir);
    } else {
      logger.info("Keeping temporary files (--keep-temp enabled).");
    }
  }
}
