# VERNEN™ BACKUP MANIFEST
## Updated: February 24, 2026
## Author: Michael Vernen Thomas Hartmann
## IP Manifest Filed: February 2, 2026

---

## LIVE DEPLOYMENTS (PUBLIC — TIMESTAMPED)

| URL | Content | Deploy Date |
|-----|---------|-------------|
| vernen-legal.netlify.app | Landing page, methodology PDF, report template | Feb 23, 2026 |
| vernen-legal.netlify.app/VERNEN_SoC_Audit_Protocol.pdf | S.o.C. methodology doc (shareable) | Feb 23, 2026 |
| vernen-legal.netlify.app/report-template.html | Branded audit report template | Feb 23, 2026 |
| vernen-audit.netlify.app | Autonomous Audit Engine (working product) | Feb 22, 2026 |

Netlify account: app.netlify.com — project name: vernen-legal

### Unified Deployment (READY — pending Netlify drag-and-drop)
- Desktop: C:\Users\SagFi\Desktop\VERNEN_unified_deploy.zip (82 KB)
- Structure: / (landing) + /app (audit engine) + /protocol (PDF) + /template (report)
- Deploy to: vernen-legal.netlify.app → Deploys → drag zip

---

## GITHUB (OFFSITE BACKUP — PUSHED Feb 24, 2026)

| Repository | URL |
|------------|-----|
| VERNEN | https://github.com/WaistMaiLieP-H/VERNEN |

Latest commits:
- 1ce911c — Unified deployment (landing + engine + protocol + template)
- af5269b — build_soc_protocol.py and deployment scripts
- ff041cf — Public deployment assets (Feb 23, 2026)

---

## WINDOWS MACHINE: C:\Users\SagFi\VERNEN\

### Project Root (Git Repo — synced to GitHub)
- .git/ — full version history
- src/components/ — Core JSX (Audit Engine, Case Manager, Simulator)
- src/pages/ — Routing pages
- src/data/ — Annotations, forms, glossaries (13 languages)
- dist/ — Compiled React build output
- scripts/ — build_soc_protocol.py, b64 chunks

### Public Assets: public/
- vernen_landing.html (19,839 bytes)
- VERNEN_SoC_Audit_Protocol.pdf (16,252 bytes)
- vernen_report_template.html (10,883 bytes)
- vernen-site-deploy.zip (21,208 bytes)
- _redirects — Netlify routing rules

### Unified Deploy Package: unified-deploy/
- index.html (landing page)
- app/ (React audit engine + assets)
- VERNEN_SoC_Audit_Protocol.pdf
- vernen_report_template.html
- _redirects (unified routing)

---

## RECOVERY PRIORITY

1. GitHub repo — full source + deployment assets (offsite, timestamped)
2. Live Netlify sites survive independently
3. Netlify dashboard allows re-download of deployed files
4. Windows local: C:\Users\SagFi\VERNEN\ (complete working copy)
5. Windows downloads: C:\Users\SagFi\Downloads\ (deploy packages)

## STATUS: Feb 24, 2026

✅ GitHub offsite backup — COMPLETE
✅ build_soc_protocol.py — backed up (scripts/, GitHub, Downloads)
✅ Unified deployment package — BUILT, ready for Netlify deploy
⏳ Netlify site unification — deploy zip pending (drag-and-drop)
⏳ Public disclosure — sites live but not announced

---

(c) 2024-2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
IP manifest filed February 2, 2026.