# Hair by Marie

Static Astro site for `hairbymarie.hr`.

## Deployment

This project is a plain static Astro build.

- Build command: `pnpm build`
- Output directory: `dist`
- Node version: `20+` recommended

### Vercel

Current recommended deployment target while testing.

- Framework preset: `Astro`
- Install command: `pnpm install`
- Build command: `pnpm build`
- Output directory: `dist`

No `wrangler`, Workers, or server adapter is needed.

### Cloudflare Pages

When the site is ready for `hairbymarie.hr`, deploy it to Cloudflare Pages with the same static build:

- Framework preset: `Astro`
- Build command: `pnpm build`
- Build output directory: `dist`

Do not deploy this repo as a Cloudflare Worker unless the site later adds server-side functionality.

## Local development

```bash
pnpm install
pnpm dev
```

## Price list maintenance

`src/data/pricing.json` is the shared source for the displayed menu and downloadable CSV. The confirmed reference date for services is **10 September 2026**. Update current `price` amounts only; retain the confirmed `anchorPrice` amounts and reference date. All initial prices are regular prices, with no promotion applied.

After changing prices:

1. Run `pnpm export-prices` to create a dated UTF-8 CSV in `public/cjenici/` and update `src/data/price-lists.json`.
2. Commit the price data, new CSV, and metadata together. Keep previous snapshots publicly available for at least 30 days; the exporter preserves them automatically.
3. Deploy the changed price list by **08:00 Europe/Zagreb on its effective date**.

The exporter writes a new snapshot only when exported data changes. `pnpm export-prices --force` explicitly publishes another snapshot without a price change. `pnpm build` checks that the latest CSV matches the current data and that archived snapshots are intact before building. Do not edit generated CSVs or metadata by hand.

CSV columns are category, service name, numeric retail EUR amount, promotion flag (`true`/`false`), promotion name, numeric reference EUR amount, reference date, and currency. Amounts use a decimal point and two decimal places. If a promotion is introduced, also set `discountApplied: true` and its `discountName` in the service data. New services introduced after the reference date need their first regular price and its date displayed in the price list as well as the CSV.

Official requirements: [additional prices, NN 101/2026-1212](https://narodne-novine.nn.hr/clanci/sluzbeni/2026_09_101_1212.html), [CSV/XML publication, NN 101/2026-1213](https://narodne-novine.nn.hr/clanci/sluzbeni/2026_09_101_1213.html). Both obligations begin **17 November 2026**, under the [additional-price postponement](https://narodne-novine.nn.hr/clanci/sluzbeni/2026_09_110_1309.html) and [publication postponement](https://narodne-novine.nn.hr/clanci/sluzbeni/2026_09_110_1310.html).

## Salon photos

The hero/about salon visuals should be local optimized assets, not remote stock photos.

Current optimized asset paths:

- `public/salon/salon-hero-v2.jpg`
- `public/salon/salon-interior-v3.jpg`
