#!/usr/bin/env node
import { Command } from "commander";
import { runPipeline } from "../core/pipeline-runner.js";
import { logger } from "../core/logger.js";
import { runFromDiff } from "../integrations/cursor/run-from-diff.js";

const program = new Command();
program.name("auto-demo").description("Record and render local demo videos.");

program
  .command("run")
  .requiredOption("--script <path>", "Playwright script path")
  .requiredOption("--url <url>", "Base URL for local app")
  .option("--out <path>", "Final mp4 output path", "demo.mp4")
  .option("--fps <number>", "Output frame rate (24-120)", "60")
  .option("--no-interpolate", "Disable frame interpolation during render")
  .option("--startup-wait-ms <number>", "Extra wait after initial load for late content", "2000")
  .option("--tail-wait-ms <number>", "Extra wait before stopping recording", "3000")
  .option("--action-delay-ms <number>", "Delay after each scripted action", "450")
  .option("--type-char-delay-ms <number>", "Delay per typed character", "45")
  .option("--no-composite", "Skip pixel compositing (faster; ffmpeg transcode only)")
  .option("--cursor-png <path>", "Path to cursor PNG (default: assets/cursor.png in repo root)")
  .option("--cursor-hotspot-x <n>", "Cursor hot spot X in PNG pixels", "4")
  .option("--cursor-hotspot-y <n>", "Cursor hot spot Y in PNG pixels", "2")
  .option("--keep-temp", "Keep temporary artifacts", false)
  .action(async (options) => {
    try {
      await runPipeline(options);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

program
  .command("from-diff")
  .requiredOption("--url <url>", "Base URL for local app")
  .option("--out <path>", "Final mp4 output path", "demo.mp4")
  .option("--base <ref>", "Base git ref used for diff", "origin/master")
  .option("--script-path <path>", "Path for generated Playwright script", ".autodemo/tmp/generated-demo.ts")
  .option("--cursor-png <path>", "Path to cursor PNG (default: assets/cursor.png in repo root)")
  .option("--cursor-hotspot-x <n>", "Cursor hot spot X in PNG pixels", "4")
  .option("--cursor-hotspot-y <n>", "Cursor hot spot Y in PNG pixels", "2")
  .action(async (options) => {
    try {
      const result = await runFromDiff({
        url: options.url,
        out: options.out,
        baseRef: options.base,
        scriptPath: options.scriptPath,
        cursorPng: options.cursorPng,
        cursorHotspotX: Number(options.cursorHotspotX),
        cursorHotspotY: Number(options.cursorHotspotY)
      });
      logger.info(`Generated script: ${result.scriptPath} (${result.fileCount} changed files analyzed)`);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

await program.parseAsync(process.argv);
