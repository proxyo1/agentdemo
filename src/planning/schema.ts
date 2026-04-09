import { z } from "zod";
import type { CinematicPlan } from "./types.js";

const selectorRefSchema = z.object({
  role: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  exact: z.boolean().optional(),
  testId: z.string().min(1).optional(),
  css: z.string().min(1).optional(),
  text: z.string().min(1).optional()
});

const effectCueSchema = z.object({
  zoomScale: z.number().min(1).max(3).optional(),
  cursorScale: z.number().min(0.25).max(5).optional(),
  rippleRadius: z.number().min(4).max(320).optional(),
  rippleDurationMs: z.number().int().min(80).max(3000).optional(),
  holdMs: z.number().int().min(0).max(10_000).optional()
});

const plannedActionSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["navigate", "click", "dblclick", "type", "hover", "wait", "assert_url"]),
  target: selectorRefSchema.optional(),
  value: z.string().optional(),
  waitMs: z.number().int().min(0).max(120_000).optional(),
  cue: effectCueSchema.optional()
});

const cinematicSceneSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  goal: z.string().min(1),
  actions: z.array(plannedActionSchema).min(1)
});

export const cinematicPlanSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string().min(1),
  prompt: z.string().min(1),
  codebaseSummary: z.array(z.string()),
  directorNotes: z.array(z.string()).min(1),
  failurePolicy: z.literal("immediate_stop"),
  scenes: z.array(cinematicSceneSchema).min(1)
});

export function parseCinematicPlan(raw: unknown): CinematicPlan {
  return cinematicPlanSchema.parse(raw) as CinematicPlan;
}
