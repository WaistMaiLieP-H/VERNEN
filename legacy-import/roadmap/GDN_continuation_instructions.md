# VERNEN™ GDN BUILD — NEW CHAT CONTINUATION PROMPT
# Copy everything below this line and paste it as your first message in a new Claude chat.

---

## TASK: Build VERNEN™ Guided Document Navigator Phase 2

You have access to my local filesystem via **Filesystem** and **Desktop Commander** MCP tools.

### STEP 1 — Read the spec file using this exact tool call:

**Tool:** `Filesystem:read_text_file`
**Path:** `C:\Users\SagFi\Desktop\VERNEN_IP\Roadmap\GDN_guided_document_navigator_spec.md`

This is the full module specification. Read it entirely before proceeding.

### STEP 2 — Read the first 50 and last 50 lines of the completed Phase 1 file:

**Tool:** `Filesystem:read_text_file`
**Path:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\form_registry.json`
**head:** 50

Then again with **tail:** 50

This is the completed form registry (15 Tier A forms × 12 languages). Match its schema patterns.

### STEP 3 — Build and write `scenario_index.json`

**Tool:** `Filesystem:write_file`
**Path:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\scenario_index.json`

Write Phase 2: a JSON file containing 15 litigation scenarios, each mapping a real-world situation to the correct California Judicial Council form set. Full schema and all 15 scenario definitions are in the spec (Section: "Scenario Index" and "Scenario Coverage — Phase 1").

**Requirements:**
- `meta` block matching form_registry.json style (version, updated, author, module, languages)
- `scenarios` array with 15 entries
- Each scenario has: scenario_id, triggers (3-5 plain English phrases), trigger_translations (×12 languages: es, zh, vi, so, ti, am, ar, ht, ko, pt, ru, tl), primary_forms, supporting_forms, optional_forms, conditions, filing_sequence (step-by-step with notes), deadlines, domain
- Form numbers and legal citations are NEVER translated
- Triggers should be phrases a self-represented litigant would actually type
- Filing sequences must be procedurally accurate per California practice
- File will be large — use `mode: "rewrite"` for first chunk, then `mode: "append"` for subsequent chunks if using Desktop Commander write_file

**The 15 scenarios:**

| ID | Scenario | Primary Forms | Domain |
|----|----------|---------------|--------|
| S-001 | File for divorce/dissolution | FL-100, FL-110 | family_court |
| S-002 | Respond to divorce/dissolution | FL-120 | family_court |
| S-003 | Request custody or visitation change | FL-300, FL-311 | family_court |
| S-004 | Other parent violating custody order | FL-300, FL-311, MC-031 | family_court |
| S-005 | Emergency custody (child in danger) | FL-300, FL-305, FL-320 | family_court |
| S-006 | Request DV restraining order | DV-100 | domestic_violence |
| S-007 | Respond to restraining order | DV-120 | domestic_violence |
| S-008 | Child abduction prevention | FL-312 | family_court |
| S-009 | Request fee waiver | FW-001 | fee_waiver |
| S-010 | File contempt for order violation | FL-300, MC-031 | family_court |
| S-011 | Modify child support | FL-300, FL-150 | family_court |
| S-012 | File declaration in support of motion | MC-031 | family_court |
| S-013 | Appeal a court order | APP-002 | appellate |
| S-014 | CPS involvement — respond to dependency | JV-100 | juvenile |
| S-015 | Unlawful detainer defense | UD-100 | civil |

**12 language codes:** en, es, zh, vi, so, ti, am, ar, ht, ko, pt, ru, tl

### STEP 4 — Verify

After writing, run: `Filesystem:read_text_file` on the new file (head: 30 and tail: 30) and use `findstr "scenario_id"` via Desktop Commander to confirm all 15 entries exist.

### CONTEXT

- **Project:** VERNEN™ — multilingual legal analysis platform
- **Author:** Michael Vernen Thomas Hartmann (middle name Vernen, NOT Vernon)
- **IP manifest filed:** February 2, 2026
- **Phase 1 (form_registry.json):** COMPLETE — 15 forms, 12 languages, 94 KB
- **Phase 2 (scenario_index.json):** THIS IS WHAT YOU ARE BUILDING
- **Phase 3 (annotations/):** NEXT — do not start yet

### EXECUTION RULES

- Do not ask permission. Read the spec, read the registry, build the file.
- Write to my LOCAL filesystem using Filesystem or Desktop Commander tools — NOT to Claude's container.
- If the file is too large for one write, chunk it (rewrite first, append rest).
- Notify me when done with a count of scenarios written and a verification check.
