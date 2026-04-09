import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { ensureDir } from "./fs-utils.js";
import { SceneExecutionError } from "../capture/errors.js";

interface BlockerInput {
  outputPath: string;
  tempDir: string;
  error: unknown;
}

export async function writeBlockerReport(input: BlockerInput): Promise<string> {
  const reportPath = `${resolve(input.outputPath)}.blocker.json`;
  await ensureDir(dirname(reportPath));
  const message = input.error instanceof Error ? input.error.message : String(input.error);
  const sceneId = input.error instanceof SceneExecutionError ? input.error.sceneId : undefined;
  const actionId = input.error instanceof SceneExecutionError ? input.error.actionId : undefined;
  await writeFile(
    reportPath,
    JSON.stringify(
      {
        status: "blocked",
        generatedAt: new Date().toISOString(),
        tempDir: input.tempDir,
        message,
        sceneId,
        actionId,
        likelyReason: "A scene or action failed during cinematic execution.",
        nextStep: "Fix the failing selector/state and rerun the pipeline."
      },
      null,
      2
    ),
    "utf-8"
  );
  return reportPath;
}
