# Editing Ledger

A minimal, modern editing income tracker — a self-hosted replacement for the Notion ledger.
Static site, no backend. Deploy free on GitHub Pages.

## Rates (baked in)

- **Reel:** $10 flat
- **YouTube:** $12/min, prorated to the millisecond, rounded to cents
- **Earned income** counts only when status = **Completed**

## Features

- Ledger table with your exact column order (name → type → status → min/sec/ms → date finished → income → earned → month → this month)
- Pipeline kanban (Todo → In Progress → Review → Completed)
- Analytics: earned income by month + reel/YouTube breakdown
- Search, month and type filters
- Data persists in the browser (localStorage) + one-click JSON export/import for backup

## Live sync with Notion (auto)

Notion is the source of truth. A GitHub Action (`.github/workflows/sync-notion.yml`)
pulls the **🎬 Master Ledger** database every 30 minutes (plus a manual "Run workflow"
button) and commits the result to `seed.json`. GitHub Pages redeploys automatically,
and the site picks up the new data on next load — a "Synced from Notion" badge in the
footer shows the last sync time.

One-time setup (needs the repo owner):

1. Create a Notion integration at https://www.notion.so/my-integrations
   → copy the **Internal Integration Secret**.
2. In Notion, open the 🎬 Master Ledger database → **Share** → invite the integration.
3. In the GitHub repo → **Settings → Secrets and variables → Actions** →
   **New repository secret** named `NOTION_TOKEN`, paste the secret.
4. Optional: **Settings → Secrets and variables → Actions → Variables** →
   add `NOTION_DATABASE_ID` to point at a different database
   (default is the Master Ledger).

Edits made directly on the website are local-only — Notion wins on the next sync.

## Put it on GitHub Pages

```bash
cd editing-tracker
git init
git add .
git commit -m "Editing ledger"
gh repo create editing-ledger --public --source=. --push
```

Then in the repo: **Settings → Pages → Deploy from a branch → main / root**.
Your site will be live at `https://<your-username>.github.io/editing-ledger/`.

## Notes

- Data lives in each browser's localStorage — it does not sync between devices.
  Use **Export** regularly and **Import** the backup on your other device.
- No logins, no tracking, no dependencies beyond Google Fonts (graceful offline fallback).
