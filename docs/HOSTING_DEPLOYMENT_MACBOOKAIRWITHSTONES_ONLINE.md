# Hosting and Deployment Guide

## 1) Scope

This document explains how `template-generator` is hosted publicly on:

- `https://www.macbookairwithstones.online`

Current hosting model:

- Application process managed by PM2 on Windows host.
- Public ingress handled by Cloudflare Tunnel (`cloudflared` service).

## 2) Final Target Topology

1. Node app listens on `http://localhost:3000`.
2. Cloudflared tunnel forwards `www.macbookairwithstones.online` to local app.
3. Cloudflare DNS `www` points to tunnel route (`*.cfargotunnel.com`).

## 3) Commands Executed During Recovery

The following are the exact command categories executed to recover and publish:

### A. Local health verification

```powershell
(Invoke-WebRequest -UseBasicParsing http://localhost:3000/health).Content
```

Expected:

- `{"status":"ok","templateExists":true}`

### B. Cloudflared verification

When PATH did not resolve `cloudflared`, full path was used:

```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" --version
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel list
```

Recovered tunnel:

- Name: `template-generator`
- UUID: `38cce13f-32c0-4853-a0bc-b05995ecc4e9`

### C. DNS route verification/creation

```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel route dns template-generator www.macbookairwithstones.online
```

Observed outcome:

- Hostname already mapped to the same tunnel (idempotent success).

### D. Config correction

File:

- `C:\Users\User\.cloudflared\config.yml`

Set to:

```yaml
tunnel: 38cce13f-32c0-4853-a0bc-b05995ecc4e9
credentials-file: C:\Users\User\.cloudflared\38cce13f-32c0-4853-a0bc-b05995ecc4e9.json

ingress:
  - hostname: www.macbookairwithstones.online
    service: http://localhost:3000
  - service: http_status:404
```

Credential file existence validated with:

```powershell
Test-Path "C:\Users\User\.cloudflared\38cce13f-32c0-4853-a0bc-b05995ecc4e9.json"
```

### E. Tunnel runtime validation

```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel run template-generator
```

Then public check:

```powershell
(Invoke-WebRequest -UseBasicParsing https://www.macbookairwithstones.online).StatusCode
```

Expected: `200`

### F. Service persistence setup

Install as Windows service (requires admin):

```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" service install
```

If non-admin terminal returns access denied, rerun elevated:

```powershell
Start-Process -FilePath "C:\Program Files (x86)\cloudflared\cloudflared.exe" -ArgumentList "service install" -Verb RunAs
```

Service status check:

```powershell
Get-Service -Name cloudflared
```

Expected: `Running`

## 4) PM2 Application Process

Application process is managed by PM2:

```powershell
pm2 list
```

Expected app entry:

- Name: `template-generator`
- Status: `online`

If needed:

```powershell
pm2 start "npm.cmd" --name "template-generator" -- run dev
pm2 save
```

## 5) DNS Records Guidance

For tunnel routing of `www`, avoid conflicting DNS records.

Keep:

- Root/apex `A` records (if still used for other purposes).
- TXT records used by other services.

Must not conflict:

- Existing `www` A/AAAA/CNAME not owned by tunnel route (for example old GitHub Pages CNAME).

## 6) Daily Verification Checklist

Run these checks:

```powershell
pm2 list
Get-Service cloudflared
(Invoke-WebRequest -UseBasicParsing http://localhost:3000/health).StatusCode
(Invoke-WebRequest -UseBasicParsing https://www.macbookairwithstones.online).StatusCode
```

Healthy state:

- PM2 app online
- `cloudflared` service running
- both local and public endpoints return `200`

## 7) Troubleshooting

### `cloudflared` not recognized

Use full executable path or add install directory to PATH:

- `C:\Program Files (x86)\cloudflared\`

### `credentials file ... doesn't exist`

- Verify tunnel UUID in `config.yml`.
- Ensure matching `.json` exists in `C:\Users\User\.cloudflared\`.

### `A, AAAA, or CNAME record with that host already exists`

- Remove conflicting `www` record in Cloudflare DNS.
- Re-run `tunnel route dns ...`.

### Public URL down but local app healthy

- Check `Get-Service cloudflared`
- Restart service if needed:

```powershell
Restart-Service cloudflared
```

### Public URL up but generation fails

- Check backend logs:

```powershell
pm2 logs template-generator --lines 100
```

- Verify template and LibreOffice dependency.

## 8) Operational Attention Points

- Keep both layers healthy: PM2 app + cloudflared service.
- Run Cloudflared either as service or manual foreground process, not both long-term.
- Monitor `output/` growth and rotate/clean old artifacts.
- Ensure LibreOffice `soffice` remains available in PATH for PDF export.
- Revalidate tunnel config after any tunnel recreation (UUID changes).
