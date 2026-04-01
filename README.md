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

## Salon photos

The hero/about salon visuals should be local optimized assets, not remote stock photos.

Current optimized asset paths:

- `public/salon/salon-hero-v2.jpg`
- `public/salon/salon-interior-v2.jpg`
