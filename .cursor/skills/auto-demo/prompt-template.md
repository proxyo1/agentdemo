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

Constraints:
- No random waits.
- No network mocking.
- Keep execution under 60 seconds.

Return only the script code.
