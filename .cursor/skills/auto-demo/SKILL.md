# AutoDemo Script Generator

Use this skill to generate a temporary Playwright script for UI diffs, then run AutoDemo.

## Goal
- Inspect recent git diffs.
- Infer likely user-visible flows to showcase changed UI.
- Generate a deterministic Playwright script with stable selectors.
- Run:
  - `npm run build`
  - `node dist/cli/index.js run --script <generated-script> --url <local-url> --out demo.mp4`

## Rules
- Always use `getByRole`, `getByLabel`, or `data-testid` selectors first.
- Prefer semantic settling over arbitrary sleeps:
  - use `waitForLoadState("networkidle")` after navigations,
  - use visibility/hidden assertions for dynamic UI readiness,
  - use only short showcase pauses (roughly 300-700ms) after major state changes.
- Keep the flow short (15-45 seconds of interaction).
- Prefer a single narrative path that demonstrates the changed UI.
- Keep pacing human-readable: major actions should feel like a reviewer is watching, not a benchmark run.

## Script Contract
- Script must `export default async function ({ page, actions }) { ... }`.
- Use `actions.hover`, `actions.click`, `actions.dblclick`, `actions.type` so AutoDemo captures coordinates.
- Avoid raw `locator.click()` unless there is no wrapped equivalent.
- Group actions into semantic steps (`open`, `navigate`, `show change`, `verify`) and settle between steps.

## Output
- Write script to `.autodemo/tmp/generated-demo.ts`.
- Preferred execution:
  - `node dist/cli/index.js from-diff --url <local-url> --out demo.mp4 --base origin/master`
- Fallback execution:
  - `node dist/cli/index.js run --script .autodemo/tmp/generated-demo.ts --url <local-url> --out demo.mp4`
