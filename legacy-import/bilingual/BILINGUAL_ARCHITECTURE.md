# Hartmann Legal Analytics — Bilingual Architecture

## Platform: VERNEN™ Engine | Hartmann Legal Analytics (Public Brand)

### Overview
Bilingual (EN/ES) legal compliance audit platform powered by Claude API.
All UI, audit outputs, and document generation support English and Spanish natively.

---

## System Architecture

```
┌─────────────────────────────────────────────┐
│              USER INTERFACE                   │
│  React + Tailwind + i18n (EN/ES toggle)      │
│  Auto-detect browser language                 │
│  All UI strings externalized to locale files  │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│              API LAYER                        │
│  Express.js / Next.js API routes              │
│  - Accepts: language preference + document    │
│  - Injects: bilingual system prompt           │
│  - Routes to: Claude API (Sonnet 4.5)         │
│  - Returns: audit results in user's language  │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│           CLAUDE API (Anthropic)              │
│  System prompt includes:                      │
│  - VERNEN™ audit skills                       │
│  - Language instruction (respond in XX)       │
│  - Legal glossary (EN↔ES terms)              │
│  - S.o.C. methodology                         │
│  Prompt caching: skills + glossary cached     │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│           OUTPUT GENERATION                   │
│  - Bilingual PDF/DOCX reports                 │
│  - Dual-language audit findings               │
│  - Legal citation references (original lang)  │
│  - Glossary tooltips in UI                    │
└─────────────────────────────────────────────┘
```

---

## i18n Strategy

### Approach: Externalized string files + API-level language routing

1. **UI Strings**: All interface text in `/src/i18n/en.json` and `/src/i18n/es.json`
2. **Language Detection**: Browser `navigator.language` → fallback to EN
3. **User Override**: Toggle in header, persisted to localStorage
4. **API Routing**: `lang` parameter sent with every API call
5. **Claude Response**: System prompt instructs response language
6. **Legal Citations**: Always in original language (statutes don't translate)
7. **Glossary Tooltips**: Hover on legal terms shows translation

### Critical Rule: Legal citations remain in original language
- "Family Code § 3044" stays as-is in both EN and ES output
- Explanatory text around citations translates
- This maintains legal accuracy

---

## File Structure

```
hartmann-legal-analytics/
├── docs/
│   └── ARCHITECTURE.md
├── public/
│   └── index.html
├── src/
│   ├── i18n/
│   │   ├── en.json          # English UI strings
│   │   ├── es.json          # Spanish UI strings
│   │   └── LanguageProvider.jsx
│   ├── glossary/
│   │   └── legal-glossary.json  # EN↔ES legal terms
│   ├── components/
│   │   ├── App.jsx           # Main application
│   │   ├── LanguageToggle.jsx
│   │   ├── AuditForm.jsx     # Document upload + audit request
│   │   ├── AuditResults.jsx  # Bilingual results display
│   │   ├── GlossaryTooltip.jsx
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   └── api/
│       ├── claude-client.js  # Anthropic API integration
│       └── system-prompts.js # Bilingual system prompts
├── package.json
└── README.md
```

---

## Supported Languages (Phase 1)

| Language | Code | Status |
|----------|------|--------|
| English  | en   | Primary |
| Spanish  | es   | Full support |

### Phase 2 Expansion (future)
- Tagalog (tl) — large CA population
- Vietnamese (vi)
- Chinese Simplified (zh-CN)
- Korean (ko)

---

## Cost Impact of Bilingual

Bilingual adds ~500 tokens to system prompt (glossary + language instruction).
With prompt caching: ~$0.00015 per call additional cost.
Negligible impact on per-query pricing.

---

## Legal Compliance Note

California Government Code § 68092.1 requires courts to provide
language access. This platform extends that principle to legal
analysis tools, serving a population underserved by existing
English-only legal tech.

---

© 2026 Michael Vernen Thomas Hartmann. All rights reserved.
VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
