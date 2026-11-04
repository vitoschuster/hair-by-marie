# Overnight dependency maintenance

## Assumptions
- Treat all 51 currently open alerts as scope, including 1 critical and 25 high.
- Keep pnpm and its existing v9 lockfile format; record pnpm 12.16.1 for reproducibility.
- No lint/test script existed. Add Astro check as lint; use the existing price CSV validation and production build plus browser smoke checks.
- TypeScript 6 is intentional: Astro check rejects TypeScript 7.
- Key routes are / and /404; pricing is the key interactive section of the single-page site.

## Findings
- Astro 6.1.2 → 7.4.5; Tailwind 4.2.2 → 4.3.4. Transitives refresh without overrides.
- All alerted packages exceed patched thresholds or leave the tree (js-yaml, esbuild). Audit: zero vulnerabilities.
- Astro 7 rejects the HTML comment before the gallery fallback in a conditional expression; removed only the comment.
- Initial pnpm install reported ignored old esbuild/sharp build scripts; updated frozen install succeeds without exceptions.
- Screenshot pairs: docs/deps-screenshots/{before,after}-{1280,390}-{home,pricing,404}.png. Pricing re-captured with instant scrolling after fonts loaded to avoid smooth-scroll timing differences. Baseline pricing uses the original Git revision in a temporary directory.
- Visually checked: matching layout, colors, content and 404 wrapping. Homepage has a small inline whitespace difference around “by”/star from the new compiler; no clipping or lost content.
- Mobile menu opens/closes; pricing accordion opens with aria-expanded=true; mobile page has no horizontal overflow. No external bookings submitted.
- No deployment, merge, or changes to production. GitHub alerts remain open until default-branch integration/re-scan.

## Editorial redesign
- User requested a full visual refresh and less clichéd Croatian copy. Direction: warm paper, dark ink, burgundy, Instrument Serif + DM Sans, real local salon/work photography, clear rules and an editorial grid.
- Created `overnight/redesign` from `overnight/deps`; draft PR targets the dependency branch to keep the design diff reviewable. Retarget after the dependency PR merges.
- Kept the business name, address, phone, existing hours, booking destination, company details, service data, anchor prices/date, and downloadable price-list archive. No new business claims or testimonials added.
- Removed unverified testimonials, rating totals and satisfaction claims. Replaced generic trend/beauty/premium promises with service descriptions and direct booking instructions. Used informal Croatian consistently.
- Pricing uses native details/summary and works without JS. Service arrows open the corresponding category with a small hash handler. Mobile navigation uses native dialog for focus containment, Escape dismissal and focus return; scroll is unlocked on close. Reduced-motion preferences and skip navigation are supported.
- Kept Google Fonts delivery already used by the project; system/Georgia fallbacks remain. No new packages or generated/stock photos.
- Production-build screenshots in `docs/redesign-screenshots/`: homepage, services, gallery, salon, pricing and contact at 1440 and 390 px. Inspected layout/crops/type and corrected mobile service alignment. Checked overflow at 320, 390, 768, 1024 and 1440 px.
- Browser checks: menu open/Escape/focus return, service category deep link, CSV HTTP 200 with 75 lines (header + 74 services), all 74 rendered price rows, no broken images, valid HairSalon JSON-LD and noindex 404 with home link. External booking/map destinations preserved, no reservation submitted.
- `pnpm lint`: zero errors/warnings/hints. `pnpm build`: passes including CSV validation. `git diff --check`: clean. Stopped preview/dev servers after review. No deployment.
