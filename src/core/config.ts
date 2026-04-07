import { z } from "zod";

const cliOptionsSchema = z.object({
  script: z.string().min(1, "Expected --script path"),
  url: z.url("Expected valid --url value"),
  out: z.string().min(1).default("demo.mp4"),
  keepTemp: z.boolean().default(false)
});

export type CliOptions = z.infer<typeof cliOptionsSchema>;

export function parseCliOptions(options: unknown): CliOptions {
  return cliOptionsSchema.parse(options);
}
