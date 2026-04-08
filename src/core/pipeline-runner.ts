import { parseCliOptions, type CliOptions } from "./config.js";
import { makeTempDir, removeDir } from "./fs-utils.js";
import { logger } from "./logger.js";
import { recordSession } from "../capture/record.js";
import { renderPolishedVideo } from "../render/pipeline.js";

export async function runPipeline(rawOptions: unknown): Promise<void> {
  const options: CliOptions = parseCliOptions(rawOptions);
  const tempDir = await makeTempDir();
  logger.info(`Temp workspace: ${tempDir}`);

  try {
    logger.info("Recording Playwright session...");
    const artifacts = await recordSession({
      scriptPath: options.script,
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
      cursorHotspotY: options.cursorHotspotY
    });
    logger.info(`Done: ${options.out}`);
  } finally {
    if (!options.keepTemp) {
      await removeDir(tempDir);
    } else {
      logger.info("Keeping temporary files (--keep-temp enabled).");
    }
  }
}
