#!/usr/bin/env node
import { Command } from "commander";
import { resolve } from "node:path";
import { runPipeline } from "../core/pipeline-runner.js";
import { logger } from "../core/logger.js";
import { scaffoldDemoScript } from "../integrations/demo-flow/scaffold.js";

const program = new Command();
program.name("agentdemo").description("Record and render local demo videos.");

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
  .option(
    "--micro-pause-min-ms <number>",
    "Min idle ms after cursor reaches target before click/type (humanization)",
    "100"
  )
  .option(
    "--micro-pause-max-ms <number>",
    "Max idle ms after cursor reaches target before click/type (humanization)",
    "300"
  )
  .option("--humanize-seed <number>", "Seed for deterministic micro-pause randomness", "1")
  .option("--no-composite", "Skip pixel compositing (faster; ffmpeg transcode only)")
  .option("--cursor-png <path>", "Path to cursor PNG (default: assets/cursor.png in repo root)")
  .option("--cursor-hotspot-x <n>", "Cursor hot spot X in PNG pixels", "4")
  .option("--cursor-hotspot-y <n>", "Cursor hot spot Y in PNG pixels", "2")
  .option("--style <mode>", "Render style profile: polished|classic", "polished")
  .option("--classic", "Use legacy classic style profile")
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
  .command("scaffold")
  .description("Write a starter DemoScript file for a custom user flow")
  .option("--out <path>", "Output path for the new script", ".agentdemo/tmp/demo-flow.ts")
  .action(async (options) => {
    try {
      const out = resolve(options.out);
      await scaffoldDemoScript(out);
      logger.info(`Wrote starter script: ${out}`);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

await program.parseAsync(process.argv);
