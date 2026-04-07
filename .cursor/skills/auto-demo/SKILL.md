---
name: autodemo-custom-user-flow
description: Create and export an AutoDemo video for a user-specified app flow, end-to-end. Use when the user asks for a recorded demo video of a specific interaction flow in their local app.
---

# AutoDemo - Custom User Flow

Use this skill when the user wants a recorded demo video of a specific flow they describe.

Do not stop at writing the script. The task is complete only when a video file exists, or you have clearly reported a blocking error after attempting the workflow below.

Assume the user's app repository is the current workspace. AutoDemo is a dependency in that repo, not the product being built.

## Required Inputs

Use sensible defaults unless the user specifies overrides:

- Local app URL defaults to `http://localhost:3000`.
- Output video path defaults to `demo.mp4` in project root.
- Timing values use workflow defaults unless the user requests custom pacing.

Ask follow-up questions only when a provided value is ambiguous/invalid, or when preflight checks fail and an override is needed.

## End-to-End Workflow

1. Resolve inputs:
   - Use defaults for URL/output/timing when not explicitly provided.
   - Confirm only user-provided overrides.
2. Preflight app reachability:
   - Verify the app is running and reachable at the resolved URL.
   - If unreachable, report the error and do not claim export success.
3. Preflight AutoDemo availability:
   - Check `package.json` first (`dependencies`, `devDependencies`, or `scripts`) for `autodemo` usage before installing anything.
   - If `autodemo` is already present, run via `npx auto-demo ...` from project root.
   - If `autodemo` is not present, ask the user whether to install it in the current repo or use an existing setup from another repo/path.
   - Only run `npm install autodemo` in the current repo after explicit user confirmation.
   - If `npx auto-demo` fails due to package/build issues, install a release that ships `dist/`, or follow Maintainers flow when applicable.
4. Preflight Playwright browser:
   - If run fails with missing Chromium/browser executable errors, execute `npx playwright install chromium`.
   - Retry from project root.
5. Script creation (agent-authored only):
   - Create or replace a full script file in the repo (for example `.autodemo/demo-flow.ts`).
   - The script must be complete and runnable as-is, including helpers and full flow.
   - No scaffold output, TODOs, placeholders, or partial stubs.
6. Export video (required):

```bash
npx auto-demo run \
  --script <path-to-script.ts> \
  --url <local-url> \
  --out <output.mp4> \
  --fps 60 \
  --startup-wait-ms 2000 \
  --tail-wait-ms 3000 \
  --action-delay-ms 450 \
  --type-char-delay-ms 45
```

7. Verify output:
   - Confirm the final `mp4` exists at the requested output path.
   - If export fails, report the exact blocking step and command error.

## Script Authoring Rules (Important)

When authoring `.autodemo/demo-flow.ts`, optimize for realistic camera framing and user-like behavior:

- Keep a `settle()` helper and call it after each meaningful interaction.
- Use a `step()` helper that includes a short hold (`~350-600ms`) so state changes are visible.
- Avoid long chains of top-nav clicks without viewport interaction.
- After navigation actions that trigger scrolling or section changes, move the cursor into page content (for example: `await actions.hover(page.locator("main").first())`) before the next step.
- Prefer interaction targets in the visible content area when possible, not only header/nav controls.
- Keep flow pace human and legible; do not spam rapid actions.

## Quality Bar

- The generated script must be complete and runnable.
- The produced demo should avoid obvious framing artifacts:
  - camera hugging only the cursor in nav
  - abrupt snap-pans
  - cursor disconnected from scroll/read area
- If the captured result still looks poor, iterate on script structure (not manual patching in generated output repos) and rerun export.