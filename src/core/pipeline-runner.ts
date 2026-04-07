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
      tempDir
    });

    logger.info("Rendering final mp4...");
    await renderPolishedVideo({
      rawVideoPath: artifacts.rawVideoPath,
      coordsPath: artifacts.coordsPath,
      outputPath: options.out
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
