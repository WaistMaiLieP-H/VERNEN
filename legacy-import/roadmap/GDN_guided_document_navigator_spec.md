# VERNEN™ MODULE SPEC: Guided Document Navigator
**Created:** 2026-02-03
**Author:** Michael Vernen Thomas Hartmann
**Status:** SCOPING

---

## PROBLEM STATEMENT

Self-represented litigants — in every language — face the same barrier: standing
outside a courtroom with a stack of forms that don't map to their actual situation.

- "My situation doesn't fit any of these boxes"
- "Can I check this box?"
- "Where do I describe [specific circumstance]?"
- "What other forms do I need to file with this one?"

Existing court form instructions assume legal literacy. Judicial Council forms include
literature, but that literature is written for an audience that already knows which
form they need and why. The gap is BEFORE the form — discovery, selection, and
field-level guidance.

This is not a translation problem. This is a navigation problem that exists in
English first, then compounds across all 12 supported languages.

---

## MODULE DEFINITION

**Guided Document Navigator (GDN)**

Situation-based document discovery + annotated field guidance + supporting filing
chain identification. Available in all 12 VERNEN™ languages.

### Core Flow

```
USER DESCRIBES SITUATION
        ↓
  Scenario Matching Engine
  (maps situation → applicable forms)
        ↓
  DOCUMENT LIST (ranked by relevance)
  - Form ID, title, plain-language purpose
  - "Why this form applies to you"
        ↓
  USER SELECTS DOCUMENT
        ↓
  ANNOTATED FORM VIEW
  - Section-by-section guidance
  - Field-level "what goes here" explanations
  - Checkbox guidance: "Check this IF [scenario]"
  - "This doesn't apply to you because [reason]"
        ↓
  SUPPORTING FILINGS
  - "You'll also need: [form] because [reason]"
  - Filing sequence / order of operations
  - Deadline awareness (e.g., 16 court days for OSC)
```

---

## DATA ARCHITECTURE

### 1. Form Registry (`form_registry.json`)

Master catalog of all forms the platform serves.

```json
{
  "form_id": "FL-300",
  "jurisdiction": "california_state",
  "issuer": "judicial_council",
  "category": "family_court",
  "title": {
    "en": "Request for Order",
    "es": "Solicitud de Orden",
    "zh": "命令请求书",
    "vi": "Yêu cầu Lệnh Tòa",
    "...": "..."
  },
  "purpose": {
    "en": "Used to ask the court to make or change an order about custody, visitation, child support, spousal support, property, attorney fees, or other family law issues.",
    "es": "...",
    "...": "..."
  },
  "url_official": "https://www.courts.ca.gov/documents/fl300.pdf",
  "url_instructions": "https://www.courts.ca.gov/documents/fl300info.pdf",
  "related_forms": ["FL-301", "FL-305", "FL-311", "FL-312", "MC-031"],
  "prerequisite_forms": ["FL-100"],
  "citations": ["Family Code § 3022", "Family Code § 3044", "CRC 5.92"],
  "filing_fee": true,
  "fee_waiver_form": "FW-001"
}
```

### 2. Scenario Index (`scenario_index.json`)

Maps real-world situations to form sets.

```json
{
  "scenario_id": "custody_order_violated",
  "triggers": [
    "other parent not following custody order",
    "parent won't return child",
    "denied visitation",
    "custodial interference"
  ],
  "trigger_translations": {
    "es": ["el otro padre no sigue la orden de custodia", "..."],
    "...": ["..."]
  },
  "primary_forms": ["FL-300", "FL-311"],
  "supporting_forms": ["MC-031", "FL-320"],
  "optional_forms": ["DV-100"],
  "conditions": {
    "DV-100": "If the violation involves threats, violence, or fear of harm"
  },
  "filing_sequence": [
    {"step": 1, "form": "FL-300", "note": "File first — this is the request"},
    {"step": 2, "form": "FL-311", "note": "Attach — details your custody proposal"},
    {"step": 3, "form": "MC-031", "note": "Attach — your declaration of facts"},
    {"step": 4, "form": "FL-320", "note": "If requesting emergency/ex parte relief"}
  ],
  "deadlines": {
    "service": "16 court days before hearing (regular OSC)",
    "ex_parte": "By 10:00 AM the court day before (or same day with shortened time)"
  },
  "domain": "family_court"
}
```

### 3. Field Annotations (`annotations/FL-300.json`)

Per-form, per-field guidance.

```json
{
  "form_id": "FL-300",
  "sections": [
    {
      "section_id": "header",
      "fields": [
        {
          "field_label": "Attorney or Party Without Attorney",
          "guidance": {
            "en": "If you don't have a lawyer, enter YOUR full legal name, address, phone number, and email. Write 'In Pro Per' where it says 'State Bar Number'.",
            "es": "...",
            "...": "..."
          }
        }
      ]
    },
    {
      "section_id": "item_4",
      "field_label": "Child Custody",
      "checkbox_guidance": [
        {
          "box": "4a",
          "label": "Legal custody to (name)",
          "check_if": {
            "en": "Check this if you are asking the court to give ONE parent the right to make all major decisions (health, education, welfare) for the child. If you want sole legal custody, enter YOUR name.",
            "es": "...",
            "...": "..."
          },
          "do_not_check_if": {
            "en": "Do not check this if you want both parents to share decision-making. Use 4b instead.",
            "es": "...",
            "...": "..."
          }
        },
        {
          "box": "4b",
          "label": "Joint legal custody",
          "check_if": {
            "en": "Check this if you want both parents to share the right to make major decisions about the child.",
            "es": "...",
            "...": "..."
          }
        }
      ]
    }
  ]
}
```

---

## FORM COVERAGE — PHASE 1 (Family Court Priority)

Based on self-represented litigant frequency and VERNEN™ case domain:

### Tier A — Critical Path Forms
| Form | Title | Priority |
|------|-------|----------|
| FL-100 | Petition — Marriage/Domestic Partnership | A |
| FL-110 | Summons | A |
| FL-120 | Response — Marriage/Domestic Partnership | A |
| FL-300 | Request for Order | A |
| FL-305 | Temporary Emergency Orders | A |
| FL-311 | Child Custody and Visitation Application | A |
| FL-312 | Request for Child Abduction Prevention Orders | A |
| FL-320 | Request for Order (Ex Parte) | A |
| FL-341 | Child Custody and Visitation Order | A |
| MC-031 | Declaration | A |
| DV-100 | Request for Domestic Violence Restraining Order | A |
| DV-110 | Temporary Restraining Order | A |
| DV-109 | Notice of Court Hearing | A |
| FW-001 | Request to Waive Court Fees | A |
| FW-003 | Order on Court Fee Waiver | A |

### Tier B — Supporting / Responsive
| Form | Title | Priority |
|------|-------|----------|
| FL-150 | Income and Expense Declaration | B |
| FL-142 | Schedule of Assets and Debts | B |
| FL-160 | Property Declaration | B |
| FL-341(D) | Child Custody — Children's Holiday Schedule | B |
| FL-335 | Proof of Service by Mail | B |
| FL-330 | Proof of Personal Service | B |
| SC-100 | Plaintiff's Claim and ORDER to Go to Small Claims Court | B |
| APP-002 | Notice Designating Record on Appeal | B |

### Tier C — Specialized / Cross-Domain
| Form | Title | Priority |
|------|-------|----------|
| JV-100 | Juvenile Dependency Petition | C |
| CH-100 | Civil Harassment Restraining Order | C |
| UD-100 | Complaint — Unlawful Detainer | C |
| EA-100 | Elder Abuse Restraining Order | C |
| CR-160 | Victim's Statement of Restitution | C |

---

## SCENARIO COVERAGE — PHASE 1

| ID | Scenario | Primary Forms |
|----|----------|---------------|
| S-001 | File for divorce/dissolution | FL-100, FL-110 |
| S-002 | Respond to divorce/dissolution | FL-120 |
| S-003 | Request custody or visitation change | FL-300, FL-311 |
| S-004 | Other parent violating custody order | FL-300, FL-311, MC-031 |
| S-005 | Emergency custody (child in danger) | FL-300, FL-305, FL-320 |
| S-006 | Request domestic violence restraining order | DV-100 |
| S-007 | Respond to restraining order | DV-120 |
| S-008 | Child abduction prevention | FL-312 |
| S-009 | Request fee waiver | FW-001 |
| S-010 | File contempt for order violation | FL-300, MC-031 |
| S-011 | Modify child support | FL-300, FL-150 |
| S-012 | File declaration in support of motion | MC-031 |
| S-013 | Appeal a court order | APP-002 |
| S-014 | CPS involvement — respond to dependency | JV-100 |
| S-015 | Sue landlord (unlawful detainer defense) | UD-100 |

---

## LANGUAGE MATRIX

All GDN content authored in English first, then produced in all 12 languages:

en, es, zh, vi, so, ti, am, ar, ht, ko, pt, ru, tl

Legal citations, form numbers, and statutory references are NEVER translated.

---

## DEPENDENCIES

- `legal_glossary_en_*.json` (12 files) — term definitions referenced in annotations
- `scenario_index.json` — routes user input to form sets
- `form_registry.json` — master catalog
- `annotations/*.json` — per-form field guidance (1 file per form)

---

## BUILD SEQUENCE

| Phase | Deliverable | Est. Files |
|-------|-------------|------------|
| 1 | `form_registry.json` — Tier A forms (15) | 1 |
| 2 | `scenario_index.json` — Phase 1 scenarios (15) | 1 |
| 3 | `annotations/` — Tier A form annotations (15) | 15 |
| 4 | Translation pass — all Phase 1 content × 12 languages | ~30 |
| 5 | Tier B forms + scenarios | ~15 |
| 6 | Tier C forms + scenarios | ~10 |

---

## WHAT THIS IS NOT

- NOT a form-filling automation tool (does not populate PDFs)
- NOT legal advice (explains process and form purpose, not strategy)
- NOT a replacement for court self-help centers (complements them)

This is a **discovery and comprehension layer** — it answers:
1. "Which documents do I need?"
2. "What is this document for?"
3. "What does this field/checkbox mean for MY situation?"
4. "What else do I need to file with this?"
5. "In what order, and by when?"

In the user's language.
