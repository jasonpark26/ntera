# ntera.ca — GitHub Pages (minimal static)

## What this is
A single-page site that loads precomputed CSV outputs from /data and renders:
- national KPI cards (from data/kpis.json)
- a province summary table
- a sortable/filterable city/system table

## Deploy
1) Create a GitHub repo (public is simplest) and upload the `ntera_site` folder contents to the repo root.
2) GitHub → Settings → Pages → Deploy from a branch (main / root).
3) In Settings → Pages → Custom domain, set: `ntera.ca`

## DNS records (at your registrar)
A (Host: @)
- 185.199.108.153
- 185.199.109.153
- 185.199.110.153
- 185.199.111.153

CNAME (Host: www) → `<YOUR_GITHUB_USERNAME>.github.io`

Then enable “Enforce HTTPS” in GitHub Pages when available.

## Update data
Replace the CSVs in /data and commit.
If you want KPI cards to update, also regenerate `data/kpis.json` from your neighborhood file.
