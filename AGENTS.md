# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

UnTangle is an AI-powered emotional clarity web app. It has two deployable surfaces:

1. **Landing page** (`index.html`) — static marketing site deployed to GitHub Pages
2. **React SPA** (`src/`) — the core product, a chat-like emotional clarity tool deployed to Vercel with serverless API functions in `api/`

### Development commands

All standard commands are in `package.json`:

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Preview build | `npm run preview` |

### Important caveats

- **`index.html` is the landing page only.** It does NOT include the React SPA entry point (`<div id="root">` / `<script type="module" src="/src/main.tsx">`). Running `npm run dev` serves the marketing landing page, not the React app. To test the React SPA locally, you need to temporarily add `<div id="root"></div>` and `<script type="module" src="/src/main.tsx"></script>` to the `<body>` of `index.html` — but do NOT commit those changes.
- **API endpoints require a local proxy.** The `api/` directory contains Vercel serverless functions (`api/llm.ts`, `api/alignment.ts`, `api/generate.ts`). `vercel dev` is the canonical way to serve them but requires interactive Vercel CLI authentication. As an alternative, create a small Node.js HTTP server (using `tsx`) that imports the handlers and serves them on port 3001, then run Vite with a config that proxies `/api` to `http://localhost:3001`.
- **`OPENAI_API_KEY` is required** for the API endpoints to function. Without it, the frontend loads but API calls return 401/500 errors.
- **ESLint has 8 pre-existing errors** (unused vars, `no-explicit-any`). These are in the existing codebase, not regressions.
- **No automated test suite exists** in this project. Validation is done through lint + TypeScript type-checking + manual testing.
