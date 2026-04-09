import { z } from "zod";
import type { RenderStyle } from "../render/style-profile.js";

const cliOptionsSchema = z.object({
  script: z.string().min(1).optional(),
  planFile: z.string().min(1).optional(),
  prompt: z.string().min(1).optional(),
  codebaseRoot: z.string().min(1).default(process.cwd()),
  planOut: z.string().min(1).default(".agentdemo/cinematic-plan.json"),
  planOnly: z.boolean().default(false),
  url: z.url("Expected valid --url value"),
  out: z.string().min(1).default("demo.mp4"),
  fps: z.coerce.number().int().min(24).max(120).default(60),
  interpolate: z.boolean().default(true),
  startupWaitMs: z.coerce.number().int().min(0).max(30000).default(2000),
  tailWaitMs: z.coerce.number().int().min(0).max(30000).default(3000),
  actionDelayMs: z.coerce.number().int().min(0).max(10000).default(450),
  typeCharDelayMs: z.coerce.number().int().min(0).max(1000).default(45),
  microPauseMinMs: z.coerce.number().int().min(0).max(5000).default(100),
  microPauseMaxMs: z.coerce.number().int().min(0).max(5000).default(300),
  humanizeSeed: z.coerce.number().int().min(0).max(0xffff_ffff).default(1),
  composite: z.boolean().default(true),
  cursorPng: z.string().optional(),
  cursorHotspotX: z.coerce.number().int().min(0).max(2048).default(4),
  cursorHotspotY: z.coerce.number().int().min(0).max(2048).default(2),
  style: z.enum(["polished", "classic"]).default("polished"),
  keepTemp: z.boolean().default(false)
});

export type CliOptions = z.infer<typeof cliOptionsSchema>;

export function parseCliOptions(options: unknown): CliOptions {
  const raw = { ...(options as Record<string, unknown>) };
  const noComposite = raw.noComposite === true;
  delete raw.noComposite;
  const composite = noComposite ? false : raw.composite !== false;
  const style: RenderStyle = raw.classic === true ? "classic" : ((raw.style as RenderStyle | undefined) ?? "polished");
  delete raw.classic;
  if (raw.cursorPng === "" || raw.cursorPng === undefined) {
    delete raw.cursorPng;
  }
  const parsed = cliOptionsSchema.parse({ ...raw, composite, style });
  if (!parsed.script && !parsed.planFile && !parsed.prompt) {
    throw new Error("Expected one of --script, --plan-file, or --prompt.");
  }
  if (parsed.planOnly && !parsed.prompt && !parsed.planFile) {
    throw new Error("--plan-only requires --prompt or --plan-file.");
  }
  if (parsed.microPauseMaxMs < parsed.microPauseMinMs) {
    throw new Error("microPauseMaxMs must be >= microPauseMinMs");
  }
  return parsed;
}
