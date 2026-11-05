# Website refresh report

Branch: `overnight/redesign`, based on `overnight/deps`. No deployment or merge.

- Rebuilt the page with an editorial layout, warm paper/ink/burgundy palette, new typography, real work photography, a staggered gallery and a simpler service list.
- Rewrote Croatian copy around actual services and booking. Removed generic beauty promises, unverified reviews, ratings and satisfaction claims.
- Preserved all 74 services, current/anchor prices, CSV downloads/archive, contact details, booking links and structured data. Added native accessible menu/price accordions, category deep links, skip navigation and reduced-motion support.
- Passed `pnpm lint` (zero diagnostics), `pnpm build` (including price CSV check) and `git diff --check`. Ran and reviewed the production build; menu focus/Escape, category links, CSV and 404 checks pass. No horizontal overflow at 320–1440 px.
- Desktop/phone screenshots: `docs/redesign-screenshots/`. Earlier appearance: `docs/deps-screenshots/`. Design decisions and assumptions: `NOTES.md`.

Run: `pnpm install --frozen-lockfile && pnpm dev`. Verify: `pnpm lint && pnpm build`.

Left: review the draft design PR. It targets `overnight/deps` so the redesign is separate from the security PR; retarget after that PR merges. No overnight decisions needed.
