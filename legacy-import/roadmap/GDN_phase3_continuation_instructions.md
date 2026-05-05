# VERNEN™ GDN PHASE 3 — FIELD ANNOTATIONS
# 15 files across 5 batches (3 forms each). Paste ONE batch per new chat.
# Prerequisite: Phase 1 (form_registry.json) and Phase 2 (scenario_index.json) must be complete.

---

# BATCH INDEX
#
# Batch A — Dissolution:   FL-100, FL-110, FL-120
# Batch B — Motions:       FL-300, FL-305, FL-320
# Batch C — Custody:       FL-311, FL-312, FL-341
# Batch D — DV:            DV-100, DV-110, DV-109
# Batch E — Support:       MC-031, FW-001, FW-003
#
# Copy from ===BATCH X START=== through ===BATCH X END=== into a new chat.

---

===BATCH A START===

## TASK: Build VERNEN™ GDN Phase 3 — Field Annotations (Batch A: Dissolution)

You have access to my local filesystem via **Filesystem** and **Desktop Commander** MCP tools.

### STEP 1 — Read the spec (annotation schema is in "Field Annotations" section):

**Tool:** `Filesystem:read_text_file`
**Path:** `C:\Users\SagFi\Desktop\VERNEN_IP\Roadmap\GDN_guided_document_navigator_spec.md`

### STEP 2 — Read form_registry.json for form metadata:

**Tool:** `Filesystem:read_text_file`
**Path:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\form_registry.json`

### STEP 3 — Create the annotations directory:

**Tool:** `Filesystem:create_directory`
**Path:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations`

### STEP 4 — Build 3 annotation files

Write each file using `Filesystem:write_file`. If a file exceeds one write, use Desktop Commander `write_file` with `mode: "rewrite"` for the first chunk, then `mode: "append"` for the rest.

**File 1:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-100.json`
**File 2:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-110.json`
**File 3:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-120.json`

**ANNOTATION SCHEMA (per file):**

```json
{
  "meta": {
    "form_id": "FL-100",
    "version": "1.0.0",
    "updated": "2026-02-03",
    "author": "Michael Vernen Thomas Hartmann",
    "module": "GDN Field Annotations",
    "languages": ["en","es","zh","vi","so","ti","am","ar","ht","ko","pt","ru","tl"]
  },
  "sections": [
    {
      "section_id": "header",
      "section_label": "Caption / Header Block",
      "fields": [
        {
          "field_label": "Attorney or Party Without Attorney",
          "field_type": "text",
          "guidance": {
            "en": "If you don't have a lawyer...",
            "es": "...", "zh": "...", "vi": "...", "so": "...",
            "ti": "...", "am": "...", "ar": "...", "ht": "...",
            "ko": "...", "pt": "...", "ru": "...", "tl": "..."
          }
        }
      ],
      "checkbox_guidance": [
        {
          "box": "1a",
          "label": "Dissolution (Divorce)",
          "check_if": { "en": "...", "es": "...", ... },
          "do_not_check_if": { "en": "...", "es": "...", ... }
        }
      ]
    }
  ]
}
```

**REQUIREMENTS:**
- Walk through every section and field on each form in order (header → items → signature)
- Include ALL checkboxes with `check_if` and `do_not_check_if` guidance in all 13 languages
- `guidance` text must be plain language a self-represented litigant would understand
- Form numbers, statutory citations, and section references are NEVER translated
- Use your training knowledge of these California Judicial Council forms for field layout
- Official PDFs for reference are in form_registry.json (`url_official` field)

**FORM NOTES:**
- **FL-100 (Petition):** Complex — multiple sections covering marriage facts, children, property, requests for orders. Many checkboxes with conditional logic.
- **FL-110 (Summons):** Simple — mostly boilerplate. Key guidance: what the restraining orders on page 2 mean, service requirements, 30-day response deadline.
- **FL-120 (Response):** Mirrors FL-100 structure. Guidance should note where respondent's answers differ from petitioner's and flag the 30-day deadline.

### STEP 5 — Verify

Read head/tail of each file:
**Tool:** `Filesystem:read_text_file` with **head: 20** and **tail: 20** for each file.

Then count sections via Desktop Commander:
```
findstr "section_id" "C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-100.json"
findstr "section_id" "C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-110.json"
findstr "section_id" "C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-120.json"
```

### CONTEXT

- **Project:** VERNEN™ — multilingual legal analysis platform
- **Author:** Michael Vernen Thomas Hartmann (middle name Vernen, NOT Vernon)
- **IP manifest filed:** February 2, 2026
- **Phase 1 (form_registry.json):** COMPLETE
- **Phase 2 (scenario_index.json):** COMPLETE
- **Phase 3 (annotations/):** THIS IS WHAT YOU ARE BUILDING — Batch A of 5

### EXECUTION RULES

- Do not ask permission. Read the spec, read the registry, build the files.
- Write to my LOCAL filesystem using Filesystem or Desktop Commander tools — NOT to Claude's container.
- If a file is too large for one write, chunk it (rewrite first, append rest).
- Notify me when done with file sizes and section counts per form.

===BATCH A END===

---

===BATCH B START===

## TASK: Build VERNEN™ GDN Phase 3 — Field Annotations (Batch B: Motions)

You have access to my local filesystem via **Filesystem** and **Desktop Commander** MCP tools.

### STEP 1 — Read the spec:

**Tool:** `Filesystem:read_text_file`
**Path:** `C:\Users\SagFi\Desktop\VERNEN_IP\Roadmap\GDN_guided_document_navigator_spec.md`

### STEP 2 — Read form_registry.json:

**Tool:** `Filesystem:read_text_file`
**Path:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\form_registry.json`

### STEP 3 — Read an existing annotation file for schema reference:

**Tool:** `Filesystem:read_text_file`
**Path:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-100.json`
**head:** 60

Match this schema exactly.

### STEP 4 — Build 3 annotation files

**File 1:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-300.json`
**File 2:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-305.json`
**File 3:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-320.json`

Use `Filesystem:write_file` or Desktop Commander `write_file` with chunking if needed.

**REQUIREMENTS:**
- Same schema as Batch A files (see FL-100.json for reference)
- Walk through every section and field on each form in order
- Include ALL checkboxes with `check_if` / `do_not_check_if` in all 13 languages
- Plain language guidance for self-represented litigants
- Form numbers, citations, section references NEVER translated

**FORM NOTES:**
- **FL-300 (Request for Order):** Most complex Tier A form. Covers custody, visitation, support, property, attorney fees. Every checkbox has conditional logic. Items 1-12+ each need detailed guidance.
- **FL-305 (Temporary Emergency Orders):** Court's temporary order form. Guidance should explain what each granted/denied order means and what to do next.
- **FL-320 (Ex Parte Request):** Emergency motion. Key guidance: declaration requirements, why ex parte is justified, notice requirements to other party, 10:00 AM filing deadline.

### STEP 5 — Verify

Read head/tail of each file, then:
```
findstr "section_id" "C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-300.json"
findstr "section_id" "C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-305.json"
findstr "section_id" "C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-320.json"
```

### CONTEXT

- **Project:** VERNEN™ — multilingual legal analysis platform
- **Author:** Michael Vernen Thomas Hartmann (middle name Vernen, NOT Vernon)
- **IP manifest filed:** February 2, 2026
- **Phase 1 (form_registry.json):** COMPLETE
- **Phase 2 (scenario_index.json):** COMPLETE
- **Phase 3 Batch A (FL-100, FL-110, FL-120):** COMPLETE
- **Phase 3 Batch B:** THIS IS WHAT YOU ARE BUILDING

### EXECUTION RULES

- Do not ask permission. Read the spec, read the registry, read FL-100.json for schema, build the files.
- Write to my LOCAL filesystem — NOT to Claude's container.
- Chunk large files (rewrite first, append rest).
- Notify me when done with file sizes and section counts per form.

===BATCH B END===

---

===BATCH C START===

## TASK: Build VERNEN™ GDN Phase 3 — Field Annotations (Batch C: Custody)

You have access to my local filesystem via **Filesystem** and **Desktop Commander** MCP tools.

### STEP 1 — Read the spec:

**Tool:** `Filesystem:read_text_file`
**Path:** `C:\Users\SagFi\Desktop\VERNEN_IP\Roadmap\GDN_guided_document_navigator_spec.md`

### STEP 2 — Read form_registry.json:

**Tool:** `Filesystem:read_text_file`
**Path:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\form_registry.json`

### STEP 3 — Read an existing annotation file for schema reference:

**Tool:** `Filesystem:read_text_file`
**Path:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-300.json`
**head:** 60

Match this schema exactly.

### STEP 4 — Build 3 annotation files

**File 1:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-311.json`
**File 2:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-312.json`
**File 3:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-341.json`

**REQUIREMENTS:**
- Same schema as previous annotation files
- Walk through every section and field in order
- ALL checkboxes with `check_if` / `do_not_check_if` in all 13 languages
- Plain language for self-represented litigants
- Form numbers, citations NEVER translated

**FORM NOTES:**
- **FL-311 (Child Custody and Visitation Application):** Detailed custody schedule form. Must cover legal vs. physical custody distinction, specific visitation schedules, holiday/vacation provisions, transportation arrangements, supervised visitation conditions.
- **FL-312 (Child Abduction Prevention Orders):** Specialized form. Guidance must cover passport surrender, travel restrictions, criminal history declarations, Hague Convention applicability. High-stakes — precision critical.
- **FL-341 (Child Custody and Visitation Order):** Court's final order form. Guidance should explain what each ordered provision means, how to read the order, enforcement mechanisms, and modification process.

### STEP 5 — Verify

Read head/tail of each file, then:
```
findstr "section_id" "C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-311.json"
findstr "section_id" "C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-312.json"
findstr "section_id" "C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-341.json"
```

### CONTEXT

- **Project:** VERNEN™ — multilingual legal analysis platform
- **Author:** Michael Vernen Thomas Hartmann (middle name Vernen, NOT Vernon)
- **IP manifest filed:** February 2, 2026
- **Phase 1 (form_registry.json):** COMPLETE
- **Phase 2 (scenario_index.json):** COMPLETE
- **Phase 3 Batches A-B:** COMPLETE
- **Phase 3 Batch C:** THIS IS WHAT YOU ARE BUILDING

### EXECUTION RULES

- Do not ask permission. Read the spec, read the registry, read FL-300.json for schema, build the files.
- Write to my LOCAL filesystem — NOT to Claude's container.
- Chunk large files (rewrite first, append rest).
- Notify me when done with file sizes and section counts per form.

===BATCH C END===

---

===BATCH D START===

## TASK: Build VERNEN™ GDN Phase 3 — Field Annotations (Batch D: Domestic Violence)

You have access to my local filesystem via **Filesystem** and **Desktop Commander** MCP tools.

### STEP 1 — Read the spec:

**Tool:** `Filesystem:read_text_file`
**Path:** `C:\Users\SagFi\Desktop\VERNEN_IP\Roadmap\GDN_guided_document_navigator_spec.md`

### STEP 2 — Read form_registry.json:

**Tool:** `Filesystem:read_text_file`
**Path:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\form_registry.json`

### STEP 3 — Read an existing annotation file for schema reference:

**Tool:** `Filesystem:read_text_file`
**Path:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-300.json`
**head:** 60

Match this schema exactly.

### STEP 4 — Build 3 annotation files

**File 1:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\DV-100.json`
**File 2:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\DV-110.json`
**File 3:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\DV-109.json`

**REQUIREMENTS:**
- Same schema as previous annotation files
- Walk through every section and field in order
- ALL checkboxes with `check_if` / `do_not_check_if` in all 13 languages
- Plain language for self-represented litigants
- Form numbers, citations NEVER translated

**FORM NOTES:**
- **DV-100 (Request for DV Restraining Order):** Complex and sensitive. Must cover: relationship to restrained person, description of abuse (what counts as abuse under Family Code § 6203), children's information, specific orders requested (stay-away, move-out, property control, custody). Guidance tone must be calm and supportive.
- **DV-110 (Temporary Restraining Order):** Court-issued TRO. Guidance should explain what each granted order means, what "restrained person" must do, penalties for violation (contempt, criminal charges under Penal Code § 273.6), and the hearing date.
- **DV-109 (Notice of Court Hearing):** Hearing notification form. Guidance covers: hearing date/time/department, what to bring, what happens at the hearing, right to request interpreter, continuance procedures.

### STEP 5 — Verify

Read head/tail of each file, then:
```
findstr "section_id" "C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\DV-100.json"
findstr "section_id" "C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\DV-110.json"
findstr "section_id" "C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\DV-109.json"
```

### CONTEXT

- **Project:** VERNEN™ — multilingual legal analysis platform
- **Author:** Michael Vernen Thomas Hartmann (middle name Vernen, NOT Vernon)
- **IP manifest filed:** February 2, 2026
- **Phase 1 (form_registry.json):** COMPLETE
- **Phase 2 (scenario_index.json):** COMPLETE
- **Phase 3 Batches A-C:** COMPLETE
- **Phase 3 Batch D:** THIS IS WHAT YOU ARE BUILDING

### EXECUTION RULES

- Do not ask permission. Read the spec, read the registry, read FL-300.json for schema, build the files.
- Write to my LOCAL filesystem — NOT to Claude's container.
- Chunk large files (rewrite first, append rest).
- Notify me when done with file sizes and section counts per form.

===BATCH D END===

---

===BATCH E START===

## TASK: Build VERNEN™ GDN Phase 3 — Field Annotations (Batch E: Declaration + Fee Waiver)

You have access to my local filesystem via **Filesystem** and **Desktop Commander** MCP tools.

### STEP 1 — Read the spec:

**Tool:** `Filesystem:read_text_file`
**Path:** `C:\Users\SagFi\Desktop\VERNEN_IP\Roadmap\GDN_guided_document_navigator_spec.md`

### STEP 2 — Read form_registry.json:

**Tool:** `Filesystem:read_text_file`
**Path:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\form_registry.json`

### STEP 3 — Read an existing annotation file for schema reference:

**Tool:** `Filesystem:read_text_file`
**Path:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-300.json`
**head:** 60

Match this schema exactly.

### STEP 4 — Build 3 annotation files

**File 1:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\MC-031.json`
**File 2:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FW-001.json`
**File 3:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FW-003.json`

**REQUIREMENTS:**
- Same schema as previous annotation files
- Walk through every section and field in order
- ALL checkboxes with `check_if` / `do_not_check_if` in all 13 languages
- Plain language for self-represented litigants
- Form numbers, citations NEVER translated

**FORM NOTES:**
- **MC-031 (Declaration):** Structurally simple (header + numbered paragraphs + signature under penalty of perjury) but the guidance is critical. Must explain: how to organize facts chronologically, what to include vs. omit, how to reference exhibits, the legal weight of a declaration vs. testimony, penalty of perjury warning (CCP § 2015.5). This form is the backbone of almost every motion.
- **FW-001 (Request to Waive Court Fees):** Financial disclosure form. Must cover: income documentation, public benefits qualification (automatic waiver under Gov. Code § 68632), household size calculations, what counts as "gross monthly income," what to attach. Many litigants qualify but don't know it.
- **FW-003 (Order on Court Fee Waiver):** Court's ruling form. Guidance should explain: what "granted" means practically, what "denied" means and how to request a hearing, partial waivers, how long the waiver lasts, when to show this form to the clerk.

### STEP 5 — Verify

Read head/tail of each file, then:
```
findstr "section_id" "C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\MC-031.json"
findstr "section_id" "C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FW-001.json"
findstr "section_id" "C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FW-003.json"
```

### CONTEXT

- **Project:** VERNEN™ — multilingual legal analysis platform
- **Author:** Michael Vernen Thomas Hartmann (middle name Vernen, NOT Vernon)
- **IP manifest filed:** February 2, 2026
- **Phase 1 (form_registry.json):** COMPLETE
- **Phase 2 (scenario_index.json):** COMPLETE
- **Phase 3 Batches A-D:** COMPLETE
- **Phase 3 Batch E:** THIS IS WHAT YOU ARE BUILDING — FINAL BATCH

### EXECUTION RULES

- Do not ask permission. Read the spec, read the registry, read FL-300.json for schema, build the files.
- Write to my LOCAL filesystem — NOT to Claude's container.
- Chunk large files (rewrite first, append rest).
- Notify me when done with file sizes and section counts per form.
- After this batch, report: "Phase 3 complete — 15 annotation files built. Ready for Phase 4 (translation pass)."

===BATCH E END===
