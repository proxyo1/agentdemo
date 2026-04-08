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
  - Before writing selectors, **read the codebase** for the pages and components involved in the user’s flow (layout, navbar/header, footer, shells, feature pages). Infer real control labels, URLs, landmarks (`<nav>`, `<main>`, `<footer>` / `contentinfo`), and places where the **same visible text appears twice** (header vs footer, mobile vs desktop).
  - Create or replace a full script file in the repo (for example `.autodemo/demo-flow.ts`).
  - The script must be complete and runnable as-is, including helpers and full flow.
  - No scaffold output, TODOs, placeholders, or partial stubs.
6. Export video (required):

```bash
npx auto-demo run \
  --script <path-to-script.ts> \
  --url <local-url>
```

Use optional flags only when the user asks for overrides (for example `--out`, `--fps`, `--startup-wait-ms`, `--tail-wait-ms`, `--action-delay-ms`, `--type-char-delay-ms`).

7. Verify output:
  - Confirm the final `mp4` exists at the requested output path.
  - If export fails, report the exact blocking step and command error.

## Script Authoring Rules (Important)

When authoring `.autodemo/demo-flow.ts`, treat the demo as a **real user session**: the composited cursor should move and pause the way someone would read the page, use the chrome, then act in content—not a robot jumping only between distant controls.

### Realistic user flow (cursor + pacing)

- **Path:** Alternate between **global UI** (nav, logo) and **in-viewport content** (headings, hero, the section that just scrolled into view, forms). That yields natural arcs for AutoDemo’s interpolated cursor and camera, instead of endless nav-only hops or mystery jumps off-screen.
- **Dwell time:** Use `settle()` after loads and meaningful DOM changes; use `step()` with a **short hold (~350–600ms)** after each action so layout updates and copy are glanceable—like a user scanning before the next click.
- **After navigation or scroll:** Briefly **hover a small, visible content anchor** in the area the user would now be looking at (see below) before the next header/footer click when the story needs it—not instant back-to-nav.
- **Typing:** Prefer `actions.type` on the real input so character delays stay human; avoid pasting or instant fills unless the user asks otherwise.
- **Rhythm:** No burst of clicks with no pauses; order steps as a person would (e.g. land on page → orient → use nav or search → see result).

### Locators and AutoDemo coordinates

- **Playwright strict mode:** every locator must resolve to exactly one element. If the UI duplicates link or button names (common: nav + footer), **scope** with landmarks, for example `page.getByRole("navigation").getByRole("link", { name: "…", exact: true })`, or `getByRole("main")`, or project `data-testid` when the repo uses them. Do not rely on page-wide `getByRole("link", { name: "…" })` when a quick read of components shows repeated labels.
- Keep a `settle()` helper and call it after each meaningful interaction.
- Use a `step()` helper that includes a short hold (`~350-600ms`) so state changes are visible.
- Avoid long chains of top-nav clicks without viewport interaction.
- **Recorded cursor position = locator bounding-box center:** AutoDemo logs each action’s coordinates from the center of that element’s box. If the box is huge or mostly off-screen, the composited cursor will **animate to the bottom of the page or outside the viewport** between steps.
- **Do not** use `actions.hover` on document-scale wrappers whose geometric center is usually off-screen, for example: `main`, `body`, `#__next`, `#root`, or full-page layout containers.
- **Do** move the cursor onto **small, in-viewport anchors** after scroll or in-page navigation: visible headings (`getByRole("heading", { level: 1 })` in the hero, `page.locator("#section-id").getByRole("heading").first()`, etc.), the active section’s primary block, a card, or the search `form`—chosen from the codebase so the target exists and stays unique (strict mode).
- After hash / in-page jumps (e.g. `/#features`), prefer a heading or block **inside that section** so the hover point matches what the user sees; after returning to the top of the home page, prefer the hero heading or hero content again.
- Prefer interaction targets in the visible content area when possible, not only header/nav controls.

## Quality Bar

- The generated script must be complete and runnable.
- The produced demo should feel like a **credible user flow** (pace, cursor path, and focus on content), not a stress test of the navbar.
- The produced demo should avoid obvious framing artifacts:
  - camera hugging only the cursor in nav
  - abrupt snap-pans
  - cursor disconnected from scroll/read area
  - cursor path jumping off-screen or to the viewport edge because a hover target’s box center lies below the fold
- If the captured result still looks poor, iterate on script structure (not manual patching in generated output repos) and rerun export.

