import test from "node:test";
import assert from "node:assert/strict";
import { parseCinematicPlan } from "../planning/schema.js";
import { compileCinematicPlan } from "../planning/compile-plan.js";

const validPlan = {
  version: "1" as const,
  generatedAt: new Date().toISOString(),
  prompt: "login and search jobs",
  codebaseSummary: ["src/app.tsx: route /jobs"],
  directorNotes: ["Lead with orientation", "Tighten zoom on search"],
  failurePolicy: "immediate_stop" as const,
  scenes: [
    {
      id: "scene-1",
      title: "Find a job",
      goal: "Search jobs list",
      actions: [
        { id: "a1", kind: "navigate" as const, value: "/jobs", cue: { zoomScale: 1.08 } },
        { id: "a2", kind: "click" as const, target: { role: "searchbox" } },
        { id: "a3", kind: "type" as const, target: { role: "searchbox" }, value: "software engineer" }
      ]
    }
  ]
};

test("schema accepts valid cinematic plan", () => {
  const parsed = parseCinematicPlan(validPlan);
  assert.equal(parsed.scenes[0].actions.length, 3);
});

test("compiler returns executable scene/action graph", () => {
  const parsed = parseCinematicPlan(validPlan);
  const compiled = compileCinematicPlan(parsed);
  assert.equal(compiled.failurePolicy, "immediate_stop");
  assert.equal(compiled.scenes[0].actions[0].kind, "navigate");
});

test("compiler rejects invalid action shape", () => {
  const parsed = parseCinematicPlan({
    ...validPlan,
    scenes: [
      {
        ...validPlan.scenes[0],
        actions: [{ id: "bad", kind: "type" as const, target: { role: "textbox" } }]
      }
    ]
  });
  assert.throws(() => compileCinematicPlan(parsed), /requires a text value/i);
});
