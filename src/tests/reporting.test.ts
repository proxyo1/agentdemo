import test from "node:test";
import assert from "node:assert/strict";
import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { writeBlockerReport } from "../core/reporting.js";
import { SceneExecutionError } from "../capture/errors.js";

test("writes structured blocker report for scene failure", async () => {
  const out = join(process.cwd(), ".tmp-agentdemo-test", "demo.mp4");
  const reportPath = await writeBlockerReport({
    outputPath: out,
    tempDir: join(process.cwd(), ".tmp-agentdemo-test"),
    error: new SceneExecutionError("scene-2", "a8", new Error("locator not found"))
  });

  const report = JSON.parse(await readFile(reportPath, "utf-8")) as {
    status: string;
    sceneId?: string;
    actionId?: string;
    message?: string;
  };
  assert.equal(report.status, "blocked");
  assert.equal(report.sceneId, "scene-2");
  assert.equal(report.actionId, "a8");
  assert.match(report.message ?? "", /locator not found/i);

  await rm(join(process.cwd(), ".tmp-agentdemo-test"), { recursive: true, force: true });
});
