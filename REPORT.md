# Dependency security report

Branch: `overnight/deps` — ready for draft PR review; no deployment or merge.

- Updated Astro 6.1.2 → 7.4.5 and Tailwind 4.2.2 → 4.3.4 with pnpm and the existing lockfile. All 51 open alert entries (1 critical, 25 high) are covered by patched versions or removed packages; `pnpm audit` reports zero vulnerabilities.
- Fixed Astro 7 gallery compilation; added `pnpm lint` (Astro check), Node types and compatible TypeScript 6. Removed an unused script import.
- Passed: `pnpm install --frozen-lockfile`, `pnpm lint` (zero diagnostics), `pnpm build` (including 74-service price CSV check), `pnpm audit`, and `git diff --check`. No existing test suite.
- Ran the site and compared homepage, pricing and 404 at 1280 px and 390 px. Before/after PNGs are in `docs/deps-screenshots/`. Mobile menu and pricing accordion work; no horizontal overflow. Minor compiler whitespace change in hero heading; layout/content preserved.

Run: `pnpm install --frozen-lockfile && pnpm dev`; verify with `pnpm lint && pnpm build && pnpm audit`.

Assumptions/details: `NOTES.md`. Alert inventory and audit evidence: `docs/`.
Left: review/merge the draft PR when ready; GitHub closes alerts after default-branch re-scan. No decisions required overnight.
