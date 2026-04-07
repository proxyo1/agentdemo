import { z } from "zod";

const cliOptionsSchema = z.object({
  script: z.string().min(1, "Expected --script path"),
  url: z.url("Expected valid --url value"),
  out: z.string().min(1).default("demo.mp4"),
  fps: z.coerce.number().int().min(24).max(120).default(60),
  interpolate: z.boolean().default(true),
  startupWaitMs: z.coerce.number().int().min(0).max(30000).default(2000),
  tailWaitMs: z.coerce.number().int().min(0).max(30000).default(3000),
  composite: z.boolean().default(true),
  keepTemp: z.boolean().default(false)
});

export type CliOptions = z.infer<typeof cliOptionsSchema>;

export function parseCliOptions(options: unknown): CliOptions {
  const raw = { ...(options as Record<string, unknown>) };
  const noComposite = raw.noComposite === true;
  delete raw.noComposite;
  const composite = noComposite ? false : raw.composite !== false;
  return cliOptionsSchema.parse({ ...raw, composite });
}
