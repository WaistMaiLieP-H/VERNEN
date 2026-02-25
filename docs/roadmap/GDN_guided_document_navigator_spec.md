# VERNEN™ Guided Document Navigator (GDN) — Technical Specification
# © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
# VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
# IP Manifest Filed: February 2, 2026

---

## 1. PURPOSE

The Guided Document Navigator (GDN) is a multilingual, form-level guidance system
that helps pro se litigants complete California court forms correctly. It provides:

- Field-by-field annotations with plain-language guidance in 13 languages
- Scenario-based routing (which forms to file for which situation)
- Legal glossary terms linked to California statutes
- Integration with the VERNEN™ S.o.C. Audit Engine for post-completion review

## 2. SUPPORTED LANGUAGES (13)

| Code | Language     |
|------|-------------|
| en   | English     |
| es   | Spanish     |
| zh   | Chinese     |
| vi   | Vietnamese  |
| so   | Somali      |
| ti   | Tigrinya    |
| am   | Amharic     |
| ar   | Arabic      |
| ht   | Haitian Creole |
| ko   | Korean      |
| pt   | Portuguese  |
| ru   | Russian     |
| tl   | Tagalog     |

## 3. DATA ARCHITECTURE

### 3.1 Form Registry (`form_registry.json`)
Master index of all supported court forms. Each entry contains:
```json
{
  "form_id": "FL-100",
  "form_title": { "en": "...", "es": "...", ... },
  "category": "dissolution|custody|dv|support|general",
  "tier": "A|B|C",
  "statutory_authority": "Family Code § ...",
  "filing_fee": "$...",
  "related_forms": ["FL-110", "FL-120"],
  "scenarios": ["scenario_id_1", "scenario_id_2"]
}
```

### 3.2 Scenario Index (`scenario_index.json`)
Maps user situations to required form bundles:
```json
{
  "scenario_id": "divorce_with_children",
  "scenario_title": { "en": "...", "es": "...", ... },
  "description": { "en": "...", "es": "...", ... },
  "required_forms": ["FL-100", "FL-110", "FL-105"],
  "optional_forms": ["FL-150", "FL-160"],
  "statutory_basis": "Family Code § 2330",
  "category": "dissolution"
}
```

### 3.3 Field Annotations (`annotations/<FORM_ID>.json`)
Per-form, per-field guidance files. Schema:
```json
{
  "meta": {
    "form_id": "FL-100",
    "form_title": "Petition — Marriage/Domestic Partnership",
    "statutory_authority": "Family Code §§ 2310-2313, 2320",
    "languages": ["en","es","zh","vi","so","ti","am","ar","ht","ko","pt","ru","tl"],
    "version": "1.0.0",
    "tier": "A"
  },
  "sections": [
    {
      "section_id": "petitioner_info",
      "fields": [
        {
          "field_id": "fl100_petitioner_name",
          "field_label": "Your name (petitioner)",
          "field_type": "text|checkbox|date|select|radio",
          "required": true,
          "guidance": {
            "en": "Enter your full legal name exactly as it appears...",
            "es": "Ingrese su nombre legal completo..."
          },
          "validation": {
            "pattern": "regex or null",
            "min_length": null,
            "max_length": null
          },
          "legal_reference": "Family Code § 2330(a)",
          "common_errors": {
            "en": "Do not use nicknames or shortened names...",
            "es": "No use apodos o nombres abreviados..."
          },
          "tips": {
            "en": "If your name has changed, use your current legal name...",
            "es": "Si su nombre ha cambiado, use su nombre legal actual..."
          }
        }
      ]
    }
  ]
}
```

### 3.4 Legal Glossary (`glossaries/legal_glossary_<lang>.json`)
Per-language glossary files mapping legal terms to plain-language definitions:
```json
{
  "term_id": "petitioner",
  "term": { "en": "Petitioner", "es": "Peticionario" },
  "definition": { "en": "The person who files...", "es": "La persona que presenta..." },
  "statutory_reference": "CCP § 422.40",
  "related_terms": ["respondent", "plaintiff"]
}
```

## 4. FORM TIERS

| Tier | Forms | Priority | Description |
|------|-------|----------|-------------|
| A | FL-100, FL-110, FL-120, FL-300, FL-305, FL-320, FL-311, FL-312, FL-341, DV-100, DV-110, DV-109, MC-031, FW-001, FW-003 | Highest | Core family law, DV, fee waivers |
| B | FL-150, FL-142, FL-160, FL-341(E), DV-130, SC-100, APP-002, FL-320(E) | High | Income/support, small claims, appeals |
| C | Future expansion (TX, NY, FL state forms) | Medium | Multi-state coverage |

## 5. BUILD PHASES

| Phase | Deliverable | Status |
|-------|-------------|--------|
| 1 | Form Registry (form_registry.json) | ✅ Complete |
| 2 | Scenario Index (scenario_index.json) | 🔄 Rebuild needed |
| 3 | Tier A Field Annotations (15 forms) | 🔄 5/15 complete |
| 4 | Legal Glossaries (13 languages) | 🔄 Rebuild needed |
| 5 | Tier B Registry + Scenarios + Annotations | 🔄 Rebuild needed |
| 6 | Frontend GDN UI integration | ❌ Not started |
| 7 | Multi-state expansion (Module 5) | ❌ Not started |

## 6. COPYRIGHT & IP

All GDN data, schemas, annotations, and specifications are the intellectual
property of Michael Vernen Thomas Hartmann. IP Manifest filed February 2, 2026.
VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
© 2024–2026 All Rights Reserved.
