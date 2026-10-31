# nickbrown.live

Nick Brown's personal site: live music, the Grateful Dead, John Carpenter, and other eccentricities. Built with [Eleventy](https://www.11ty.dev/) as plain static HTML and CSS.

## Develop

```sh
nvm use        # Node 24+
npm ci
npm start      # http://localhost:8080
npm run build  # outputs to _site/
```

## Layout

- `src/` holds pages (Markdown) and `_includes/` holds templates.
- `src/_data/site.js` sets the site title, URL and nav.
- `src/assets/` is copied as-is: CSS, images and the resume.

See [PLAN.md](PLAN.md) for the roadmap.
