#!/usr/bin/env node
import { Command } from "commander";
import { runPipeline } from "../core/pipeline-runner.js";
import { logger } from "../core/logger.js";

const program = new Command();
program.name("auto-demo").description("Record and render local demo videos.");

program
  .command("run")
  .requiredOption("--script <path>", "Playwright script path")
  .requiredOption("--url <url>", "Base URL for local app")
  .option("--out <path>", "Final mp4 output path", "demo.mp4")
  .option("--keep-temp", "Keep temporary artifacts", false)
  .action(async (options) => {
    try {
      await runPipeline(options);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

await program.parseAsync(process.argv);
