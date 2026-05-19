# UnTangle marketing website

Static landing page and waitlist for [UnTangle](https://www.untangleself.com).

The product app (emotional flow, chat UI, LLM API) lives in the separate **`untangle-product`** repository. This repo contains only the marketing site.

## What is in this repo

- `index.html` — landing page copy, layout, styles, and waitlist form (Zapier)
- `public/` — logos and demo video referenced as `/public/...` in the HTML
- `me.png` — founder photo
- `CNAME` — custom domain for GitHub Pages (`www.untangleself.com`)
- `.nojekyll` — GitHub Pages helper

## Local development

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Build and preview

```bash
npm run build
npm run preview
```

`npm run build` writes to `dist/`:

- `index.html`
- `public/` (marketing assets, same URL paths as in development)
- `me.png`, `CNAME`, `.nojekyll`

## Deployment

Production is typically deployed from this repository via **GitHub Pages** (root or `dist/`, depending on your Pages source setting). Do not expect a React bundle or `/api/*` routes from this repo.
