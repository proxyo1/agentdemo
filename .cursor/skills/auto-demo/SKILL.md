# AutoDemo — custom user flow

Use this skill when the user wants a recorded demo video of a **specific flow** they describe.

**Do not stop at writing the script.** The task is complete only when a video file exists (or you have clearly reported a blocking error after trying the steps below).

Assume the user’s **own app repo** is the current workspace. AutoDemo is a **dependency** they installed (or will install) there—not the project they are building.

**Script source:** The DemoScript must be **written end-to-end by you (the agent)**—full file on disk, runnable as-is. Do not use `scaffold`, boilerplate CLI output, or TODO stubs for the user to finish. If the flow changes, you rewrite the script.

---

## End-to-end workflow (do all applicable steps)

1. **Clarify inputs** (ask if missing):
   - Local app URL (e.g. `http://localhost:3000`).
   - Desired output path (default: `demo.mp4` in the user’s project root or a path they specify).
   - Any timing needs (slow app → higher `--startup-wait-ms` / `--tail-wait-ms`).

2. **Preflight — app must be reachable**
   - The app should be running so `--url` loads in a browser.
   - If a quick check fails (e.g. connection refused), say so and do not pretend the export succeeded.

3. **Preflight — AutoDemo installed**
   - Ensure the user’s project has AutoDemo available, e.g. `npm install autodemo` (or the published package name and version they use).
   - Run `npm install` in the **user’s project** if needed.
   - **CLI:** use the `auto-demo` binary via **`npx auto-demo …`** (works whether or not it is listed in `package.json` scripts).
   - If `npx auto-demo` fails because the package has no usable build, install a release that ships `dist/`, or see **Maintainers** at the bottom.

4. **Preflight — Playwright browser (first-time / CI)**
   - If `run` fails with missing browser / executable errors:
     - `npx playwright install chromium`
   - Retry from the **user’s project** directory.

5. **Script file (in the user’s repo) — agent-generated only**
   - **Create or replace** the full script at a path you choose, e.g. `.autodemo/demo-flow.ts`, `scripts/autodemo/demo.ts`, or `playwright/demo-flow.ts`.
   - The file must include everything needed to run: helpers (`settle`, `demoStep`, etc.), the default export, and the complete flow—no placeholders.
   - Follow **Script authoring** below for selectors, pacing, navigation rules, and typing.

6. **Export the video (required)**
   - From the **user’s project root**, run `run` with explicit pacing (tune if the app is slow):

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

   - For faster iteration (no pixel compositing): add `--no-composite`.

7. **Verify success**
   - Confirm `<output.mp4>` exists (size > 0 if you can check).
   - Tell the user the path to the mp4 (workspace-relative or absolute).
   - Mention the sidecar `*.zoom.json` next to the mp4 when present.

8. **On failure**
   - Surface CLI stderr / exit code; fix selectors or waits; retry.
   - Do not claim the demo exported if `run` did not succeed.

---

## Script authoring (what to write in the file)

**Infer from the user:** the ordered steps, screens, interactions, and what to emphasize. The `--url` page is **already loaded** when your script starts.

**Implementation checklist**

1. Turn that into a short sequence of user-visible actions.
2. Pick resilient selectors for each step.
3. Write **one complete module** on disk: local helpers if needed (`settle`, `demoStep`, etc.), then `export default async function ({ page, actions }) { ... }` with the **full** flow—no TODOs or stubs.
4. Use `actions.hover`, `actions.click`, `actions.dblclick`, `actions.type` so coordinates are recorded. Avoid raw `locator.click()` unless there is no wrapped equivalent.
5. Group work into semantic steps; settle between major steps (navigation, modal open, submit, etc.).

**Selectors (priority order)**

- `getByRole`, `getByLabel`, `getByTestId`, then cautious text fallback.

**Settling and pacing**

- No long or random sleeps; no network mocking.
- After route changes: `waitForLoadState("networkidle")` where appropriate.
- For dynamic UI: visibility / hidden assertions instead of blind waits.
- Optional short showcase pauses (about 300–700ms) only after major state changes when it helps readability.
- Keep total scripted time roughly **15–45 seconds** unless the user asks otherwise; stay under **~60 seconds** unless they want longer.

**Navigation**

- Do **not** `page.goto` the initial landing URL; the recorder already did. Use `goto` only for **additional** routes the flow needs (or a deliberate reload the user requested).

**Typing**

- Prefer a plain `export default async function ({ page, actions }) { ... }` unless the project already has a resolvable `DemoScript` type import.

---

## Maintainers (AutoDemo source clone only)

If the workspace **is** the AutoDemo package source (not a consumer app), use `npm run build` and `node dist/cli/index.js run …` from that clone instead of `npx auto-demo`. (The `scaffold` CLI is for manual use without an agent; this skill still expects you to author the whole script.)
