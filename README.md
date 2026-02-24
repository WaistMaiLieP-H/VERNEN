# VERNEN™ — AI-Powered Legal Analysis Platform

**Multilingual legal document auditing for pro se litigants.**

© 2024-2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
IP Manifest filed February 2, 2026.

---

## Live Platform

| URL | Description |
|-----|-------------|
| [vernen-legal.netlify.app](https://vernen-legal.netlify.app) | Landing page |
| [vernen-legal.netlify.app/app](https://vernen-legal.netlify.app/app) | Autonomous Audit Engine |
| [vernen-legal.netlify.app/protocol](https://vernen-legal.netlify.app/protocol) | S.o.C. Audit Protocol |

## What It Does

VERNEN™ applies the **Standard of Creation (S.o.C.) methodology** to legal documents:

1. **S.o.C. Identification** — Determines governing statute, regulation, or professional code
2. **Statutory Retrieval** — Live lookup via MCP legal research server
3. **Structural Compliance** — Format, required elements, signatures
4. **Substantive Analysis** — Statutory requirements, procedural rules
5. **Bias & Fraud Detection** — One-sided language, omissions, misrepresentations
6. **Final Report** — Scored findings (Critical/Major/Minor/Advisory) with citations

## Architecture

- **Frontend**: React + Vite (Autonomous Audit Engine)
- **Landing**: Static HTML (dark theme, 13-language overview)
- **API**: Express.js with Anthropic SDK + Stripe
- **MCP Server**: VERNEN Legal MCP on Render (live statute lookup)
- **28 Audit Skill Modules**: Domain-specific compliance frameworks
- **14 Audit Categories**: Family law, civil rights, law enforcement, insurance, medical, and more
- **Export**: TXT + DOCX professional report generation

## Quick Start

```bash
npm install
cp .env.example .env  # Add your API keys
npm run dev            # Frontend dev server
npm start              # API server (port 3001)
```

## Deployment

```bash
npm run build
npx netlify deploy --prod --dir=unified-deploy --site=YOUR_SITE_ID --no-build
```

## License

UNLICENSED — All rights reserved. Unauthorized reproduction prohibited.
