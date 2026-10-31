# thenickatnite — site rebuild plan

A small, playful personal site with a tasteful web 1.0 look. It works on phones, is static and secure, and every change ships through CI.

## Decisions

| Area | Decision |
|---|---|
| Foundation | Scorched earth: delete al-folio in one commit. Git history keeps the old site. |
| Stack | Eleventy 3 (Markdown + Nunjucks templates) that outputs plain HTML/CSS. Vanilla JS only where needed. |
| Look | Tasteful homage: pixel/bitmap accents, 88x31 buttons, a fake hit counter, a few GIFs. Modern responsive CSS underneath. |
| Hosting | Cloudflare (static assets) at `nickbrown.live`, bought through Cloudflare Registrar. `thenickatnite.github.io` redirects to it. |
| Map | MapLibre GL + self-hosted PMTiles in an R2 bucket. Custom retro style. |
| Dynamic features | None. The counter and similar touches are jokes. No backend. |
| Analytics | Cloudflare Web Analytics (cookieless, no banner). |
| Deploys | PRs into a protected `master`. Every PR gets a preview URL, and merging deploys. |

## Sections

1. **Home / about**: who Nick is (the fun version), a fake visitor counter, an "under construction" corner and a site map.
2. **Live music map**: a zoomable map of every venue, with pins clustered by city. Clicking a pin shows the venue, dates, bands and notes. A list view below the map works without JS and for screen readers.
3. **Grateful Dead shrine**: favorite shows (date, venue, why it rules, archive.org link). Dead-family shows from the music data are highlighted on the map.
4. **Movie corner**: a few hand-written takes plus a "recently watched" box pulled from Letterboxd RSS at build time.
5. **Links / buttons**: a links page with 88x31 buttons.
6. **The boring page**: one short work blurb and the resume PDF, labeled as boring.

## Repo layout (target)

```
.
├── src/
│   ├── _data/
│   │   ├── venues.yaml        # id, name, city, lat, lng: one entry per venue
│   │   ├── shows.yaml         # date, venue_id, bands[], notes, tags[] (e.g. dead-family)
│   │   ├── dead_favorites.yaml
│   │   └── letterboxd.js      # fetches RSS at build and falls back to cached copy
│   ├── _includes/             # base layout, nav, footer, counter
│   ├── assets/                # css, fonts (self-hosted), img, gifs, map style json
│   ├── music/  movies/  dead/  links/  boring/
│   └── index.md
├── schemas/                   # JSON Schemas for the YAML data files
├── public/_headers            # CSP, HSTS and other security headers
├── scripts/                   # tile extract + R2 upload helpers
├── .github/workflows/
├── eleventy.config.js
├── package.json / package-lock.json
└── README.md
```

Venues and shows live in separate files so coordinates are entered once per venue and each show stays a short entry.

```yaml
# shows.yaml
- date: 2019-07-14
  venue: alpine-valley
  bands: [Dead & Company]
  tags: [dead-family]
  notes: "Fire on the Mountain went 15 minutes."
```

## Map details

- Extract a basemap with `pmtiles extract` from a Protomaps build. Cover North America up to about z10, and let MapLibre overzoom past that. The goal is a file in the tens to low hundreds of MB, not GB.
- Host the file in an R2 bucket on a subdomain (`tiles.nickbrown.live`), with CORS and range requests enabled. It is **not** in git, because Cloudflare caps static files at 25 MiB.
- Use a custom style JSON with a limited palette, a few road and label layers, and a pixel font for labels (self-hosted glyphs).
- Generate venue GeoJSON at build time from `venues.yaml` and `shows.yaml`, with clustering on.
- Privacy defaults: publish shows only after they happen (never live), and name companions only with their consent.

## Security

- No third-party JS at runtime. MapLibre, fonts and glyphs are all self-hosted. The only outside request is the Cloudflare analytics beacon.
- A strict CSP set in `_headers`: `default-src 'self'`, with tiles allowed from the R2 subdomain, the analytics beacon allowed, `frame-ancestors 'none'`, and no `unsafe-inline` scripts.
- HSTS, `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy` also go in `_headers`.
- Letterboxd RSS content is **escaped or sanitized at build**. It is never injected as raw HTML.
- Exact-pinned npm deps, a committed lockfile, and Dependabot for npm and GitHub Actions.
- GitHub Actions pinned to commit SHAs, `permissions: contents: read` by default, and the deploy token scoped only to this project.
- GitHub secret scanning and push protection on. Branch protection on `master` requires passing checks.

## CI/CD

**On every PR** (all of these block merging):
1. `npm ci` and the Eleventy build.
2. Validate the data YAML files against JSON Schema (lat/lng ranges, dates, that every show's venue id exists).
3. HTML validation.
4. Link checks: internal links block the merge, external links only warn.
5. axe accessibility checks on built pages.
6. Lighthouse CI with page-weight budgets. The map page gets its own budget.
7. `npm audit` (high and above).
8. Check that `_headers` contains the expected CSP and security headers.
9. Deploy a preview and comment the URL on the PR.

**On merge to `master`**: build, then deploy to production with `wrangler`.

**Scheduled daily**: rebuild and redeploy so the Letterboxd box stays fresh.

**Manual**: a `tiles` workflow that re-extracts and uploads the PMTiles to R2. Rarely needed.

Deploys go through GitHub Actions instead of Cloudflare's Git integration, so the CI gates always run before a deploy.

## Phases

1. ✅ **Teardown + skeleton** (branch `rebuild`): delete al-folio. Add Eleventy, the base layout, nav, home page and the boring page with the resume.
2. ✅ **CI/CD + hosting**: buy the domain, set up the Cloudflare project, workflows, headers, branch protection, Dependabot and the github.io redirect.
3. ✅ **Look and feel** (kept the original look; added favicon, 88x31 button, GIF support): palette, fonts, buttons, counter, GIF accents, mobile pass.
4. 🔨 **Movie corner + Dead shrine** (Letterboxd box and shrine template done; content pending): content pages and the Letterboxd data file.
5. **Music map v1**: data schema, venue and show list page (works without JS), and a MapLibre map using a temporary public demo basemap.
6. **Map v2**: self-hosted PMTiles on R2, the custom retro style, and Dead-family highlighting.
7. **Content backfill**: ongoing.

## Open items for Nick

- [ ] Domain: **`nickbrown.live`**. Buy it through Cloudflare Registrar, then turn on auto-renew and DNSSEC. Tiles will live at `tiles.nickbrown.live`.
- [x] Letterboxd username: `thenickatnite` (feed: `https://letterboxd.com/thenickatnite/rss/`).
- [ ] Backfill the show list. The source is an Apple Notes table. Paste it as tab-separated text, and Claude converts it to `venues.yaml` + `shows.yaml`, looks up venue coordinates, and flags anything ambiguous for Nick to check.
- [x] Map coverage: North America. Extract a bounding box of about lon -170 → -50, lat 7 → 72, up to ~z10.
- [ ] Gather assets: favorite Dead shows, movie takes, any GIFs or buttons you love.
- [ ] Repo name: keep `thenickatnite.github.io` (needed for the redirect) or rename it.
