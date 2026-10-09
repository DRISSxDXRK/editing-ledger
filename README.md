# Editing Ledger

A premium editing income tracker — React + Vite, deployed as a static site on GitHub Pages.

Live: https://drissxdxrk.github.io/editing-ledger/

> Build note: the app is written in 100% React, but Vite aliases React to
> Preact (React-compatible API) at build time, shrinking the JS bundle from
> ~250KB to ~45KB for instant loads. See `source/vite.config.js`.

## Rates (baked in)

- **Reel:** $10 flat
- **YouTube:** $12/min, prorated to the millisecond, rounded to cents
- **Earned income** counts only when status = **Completed**

## Features

- **Overview** — animated stat cards, revenue-by-month chart, recent videos
- **Ledger** — sortable/filterable table, search, edit, delete
- **Pipeline** — kanban with drag & drop between stages
- **Analytics** — monthly earned bars, format-split donut, breakdown ratios
- **Command palette** — `Ctrl/⌘+K` for commands and video search, `N` for new video
- Data persists in browser localStorage; JSON export/import for backup

## Repo layout

- `/` — built site (what GitHub Pages serves). **Do not edit by hand.**
- `/source` — the Vite + React source. Edit here, then rebuild.
- `/seed.json` — first-run seed data (empty by default).

## Development

```bash
cd source
npm install
npm run dev      # local dev server
npm run build    # outputs to source/dist
# then copy source/dist/* to the repo root and push
```
