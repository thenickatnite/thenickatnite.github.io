# nickbrown.live

Nick Brown's personal site: live music, the Grateful Dead, John Carpenter, and other eccentricities. Built with [Eleventy](https://www.11ty.dev/) as plain static HTML and CSS.

## Develop

```sh
nvm use        # Node 24+
npm ci
npm start      # http://localhost:8080
npm run build  # outputs to _site/
npm run check  # HTML validation, internal links, security headers
```

## Deploys

The site is hosted on Cloudflare as a static-assets Worker (`wrangler.jsonc`). CI (`.github/workflows/ci.yml`) runs on every PR and push to `master`:

- **Checks:** `npm audit` (high and critical only), build, `npm run check`, and Lighthouse (accessibility must score 100, plus performance and page-weight budgets).
- **External links:** checked by lychee as a non-blocking job.
- **PRs:** get a preview at `pr-<n>-nickbrown-live.<subdomain>.workers.dev`, posted as a PR comment.
- **Merges to `master`:** deploy to https://nickbrown.live.

Security headers (CSP, HSTS, etc.) live in `src/_headers`. `scripts/check-headers.js` fails CI if they're loosened.

Actions are pinned to commit SHAs. Dependabot updates npm packages and actions weekly, but only adopts releases at least 14 days old.

## Layout

- `src/` holds pages (Markdown) and `_includes/` holds templates.
- `src/_data/site.js` sets the site title, URL and nav.
- `src/assets/` is copied as-is: CSS, images and the resume.

See [PLAN.md](PLAN.md) for the roadmap.

## Adding things to pages

**GIFs.** Every GIF has a still frame for visitors whose devices ask for reduced motion.

1. Save the GIF as `src/assets/gifs/<name>.gif`.
2. Run `scripts/gif-still.sh src/assets/gifs/<name>.gif` to create `<name>-still.png` (macOS).
3. Use it in a page with `{% gif "<name>", "Alt text describing it", width, height %}`.

The link check fails if the still frame is missing.
