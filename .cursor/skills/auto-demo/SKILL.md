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
- Avoid arbitrary sleeps. Use Playwright waits tied to UI state.
- Keep the flow short (15-45 seconds of interaction).
- Prefer a single narrative path that demonstrates the changed UI.

## Script Contract
- Script must `export default async function ({ page, actions }) { ... }`.
- Use `actions.hover`, `actions.click`, `actions.dblclick`, `actions.type` so AutoDemo captures coordinates.

## Output
- Write script to `.autodemo/tmp/generated-demo.ts`.
- Print the command to run AutoDemo.
