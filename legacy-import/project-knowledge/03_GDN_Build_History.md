# VERNEN™ — GDN Build History & Phase Status
## Extracted from Claude.ai conversation history — February 2026

---

## GUIDED DOCUMENT NAVIGATOR (GDN) — OVERVIEW

The GDN is VERNEN™'s core user-facing engine. It provides situation-based
document discovery, multilingual form guidance, and annotated field-level
help for California Judicial Council forms.

**Problem solved:** Self-represented litigants in courthouse hallways don't
know which forms to file, in what order, or how to fill them out — in ANY
language. The GDN solves this programmatically.

## 12 SUPPORTED LANGUAGES

English (en), Spanish (es), Chinese (zh), Vietnamese (vi), Somali (so),
Tigrinya (ti), Amharic (am), Arabic (ar), Haitian Creole (ht), Korean (ko),
Portuguese (pt), Russian (ru), Tagalog (tl)

## BUILD PHASES

| Phase | Deliverable | File | Status |
|-------|-------------|------|--------|
| 1 | Form Registry — 15 Tier A forms × 12 langs | `form_registry.json` (94 KB) | ✅ DONE |
| 2 | Scenario Index — 15 scenarios × 12 langs | `scenario_index.json` (77 KB) | ✅ DONE |
| 3 | Field Annotations — 15 forms | `annotations/*.json` | ⬜ NEXT |
| 4 | Translation pass — Phases 1-3 × 12 langs | — | ⬜ |
| 5 | Tier B forms + scenarios | — | ⬜ |
| 6 | Tier C forms + scenarios | — | ⬜ |

## PHASE 1 — FORM REGISTRY (COMPLETE)

**File:** `Source_Code/form_registry.json`
**Size:** 94 KB
**Content:** 15 Tier A California Judicial Council forms, each with:
- Form ID, official title, URL
- Purpose description in all 12 languages
- Filing context and statutory authority
- Common scenarios linking to scenario_index

**15 Tier A Forms:**
FL-100, FL-110, FL-120, FL-300, FL-305, FL-311, FL-320,
DV-100, DV-109, DV-110, DV-130, MC-031, FL-150, FW-001, FL-105

## PHASE 2 — SCENARIO INDEX (COMPLETE)

**File:** `Source_Code/scenario_index.json`
**Size:** 77 KB (699 lines)
**Content:** 15 litigation scenarios, each with:
- Situation description in all 12 languages
- Required form sets with filing sequence
- Verified California deadlines and statutory citations

**15 Scenarios:**
| ID | Scenario | Domain |
|----|----------|--------|
| S-001 | File for divorce | family_court |
| S-002 | Respond to divorce | family_court |
| S-003 | Request custody change | family_court |
| S-004 | Custody order violated | family_court |
| S-005 | Emergency custody | family_court |
| S-006 | Request DV restraining order | domestic_violence |
| S-007 | Respond to restraining order | domestic_violence |
| S-008 | Child abduction prevention | family_court |
| S-009 | Request fee waiver | fee_waiver |
| S-010 | File contempt | family_court |
| S-011 | Modify child support | family_court |
| S-012 | File declaration | family_court |
| S-013 | Appeal court order | appellate |
| S-014 | CPS/dependency response | juvenile |
| S-015 | Unlawful detainer defense | civil |

## PHASE 3 — FIELD ANNOTATIONS (NEXT)

**Output:** `Source_Code/annotations/` (one JSON per form)
**Schema:** Section → Field → field_type + multilingual guidance
**Field types:** text_block, text_field, checkbox, checkbox_group,
date_field, number_field, signature, attachment_indicator
**Checkboxes require:** `check_if` AND `do_not_check_if` in all 13 langs

**Batched into 5 tasks (3 forms each):**
- Task A: FL-100, FL-110, FL-120 (Dissolution basics)
- Task B: FL-300, FL-305, FL-311 (Custody & RFO core)
- Task C: DV-100, DV-109, DV-110 (DV restraining orders)
- Task D: DV-130, FL-320, MC-031 (Response & declaration)
- Task E: FL-150, FW-001, FL-105 (Financial & jurisdictional)

**Task files:** `Roadmap/Phase3_Task_A.md` through `Phase3_Task_E.md`

## KEY SPECS & DOCS

- GDN Spec: `Roadmap/GDN_guided_document_navigator_spec.md`
- Phase 3 Project Instructions: `Roadmap/Phase3_Project_Instructions.md`
- Continuation Instructions: `Roadmap/GDN_continuation_instructions.md`
- Phase 3 Continuation: `Roadmap/GDN_phase3_continuation_instructions.md`
