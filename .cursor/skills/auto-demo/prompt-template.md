You are generating a Playwright demo script for AutoDemo.

Inputs:
- Recent git diff (focus on UI changes).
- Local base URL.

Steps:
1. Identify changed user-facing flows from the diff.
2. Choose one concise scenario that highlights the change.
3. Generate a script that exports default async function with signature:
   - `({ page, actions }) => Promise<void>`
4. Use `actions.*` wrappers for interactions.
5. Ensure selectors are resilient and deterministic.
6. Structure the script into semantic steps with settling between major actions.

Constraints:
- No long/random waits.
- No network mocking.
- Keep execution under 60 seconds.
- After major actions (navigation, modal open, submit), use deterministic settling:
  - `waitForLoadState("networkidle")` for route transitions,
  - visibility/hidden checks for dynamic UI,
  - optional short showcase pause (300-700ms) to improve demo readability.
- Prefer stability-first selectors:
  - `getByRole`, `getByLabel`, `getByTestId`, then text fallback.

Return only the script code.
