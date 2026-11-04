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
