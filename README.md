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
