import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { createCinematicPlan } from "../planning/planner.js";
import { compileCinematicPlan } from "../planning/compile-plan.js";

test("planner builds plan from prompt plus codebase context", async () => {
  const root = join(process.cwd(), ".tmp-planner-context");
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(
    join(root, "src", "jobs.tsx"),
    `export function Jobs() { return <a href="/jobs">Jobs</a>; }`,
    "utf-8"
  );

  const plan = await createCinematicPlan({
    prompt: "go to jobs page\nsearch software engineer\nfilter linkedin",
    codebaseRoot: root
  });
  const compiled = compileCinematicPlan(plan);
  assert.ok(plan.directorNotes.length > 0);
  assert.ok(plan.codebaseSummary.some((line) => line.includes("/jobs")));
  assert.ok(compiled.scenes[0].actions.length >= 3);

  await rm(root, { recursive: true, force: true });
});
