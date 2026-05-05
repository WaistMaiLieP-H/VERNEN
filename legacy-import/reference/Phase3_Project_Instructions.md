# VERNEN™ GDN Phase 3 — PROJECT INSTRUCTIONS
# Paste this as the "Project Instructions" in a Claude.ai Project.
# Then use the individual task prompts (Phase3_Task_A through Phase3_Task_E) as messages.

---

## PROJECT CONTEXT

You are building **VERNEN™ Guided Document Navigator (GDN) Phase 3** — field-level annotation files for California Judicial Council forms. One JSON file per form, stored in `annotations/` directory.

**Project:** VERNEN™ — multilingual legal analysis platform
**Author:** Michael Vernen Thomas Hartmann (middle name Vernen, NOT Vernon)
**IP manifest filed:** February 2, 2026

### What's Already Built

- **12 legal glossaries** — `Source_Code/legal_glossary_en_*.json` (35 terms × 12 languages)
- **Phase 1** — `Source_Code/form_registry.json` (15 Tier A forms × 12 languages, 94 KB)
- **Phase 2** — `Source_Code/scenario_index.json` (15 scenarios × 12 languages, 77 KB)
- **Phase 3** — `Source_Code/annotations/` ← THIS IS WHAT YOU ARE BUILDING

### Filesystem Access

You have access to my LOCAL filesystem via **Filesystem** and **Desktop Commander** MCP tools.
- All files live at: `C:\Users\SagFi\Desktop\VERNEN_IP\`
- Source code: `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\`
- Annotations go to: `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\`
- Write to my LOCAL filesystem — NOT to Claude's container.

---

## ANNOTATION FILE SCHEMA

Each file follows this exact structure (example from spec):

```json
{
  "meta": {
    "form_id": "FL-300",
    "version": "1.0.0",
    "updated": "2026-02-XX",
    "author": "VERNEN™",
    "module": "GDN_field_annotations",
    "languages": ["en","es","zh","vi","so","ti","am","ar","ht","ko","pt","ru","tl"]
  },
  "sections": [
    {
      "section_id": "header",
      "fields": [
        {
          "field_id": "header_attorney_party",
          "field_label": "Attorney or Party Without Attorney",
          "field_type": "text_block",
          "guidance": {
            "en": "If you don't have a lawyer, enter YOUR full legal name, address, phone number, and email. Write 'In Pro Per' where it says 'State Bar Number'.",
            "es": "Si no tiene abogado...",
            "zh": "如果您没有律师...",
            "vi": "...", "so": "...", "ti": "...", "am": "...",
            "ar": "...", "ht": "...", "ko": "...", "pt": "...",
            "ru": "...", "tl": "..."
          }
        }
      ]
    },
    {
      "section_id": "item_4",
      "fields": [
        {
          "field_id": "item_4a",
          "field_label": "Legal custody to (name)",
          "field_type": "checkbox",
          "check_if": {
            "en": "Check this if you are asking the court to give ONE parent the right to make all major decisions...",
            "es": "...", "zh": "...", "vi": "...", "so": "...", "ti": "...",
            "am": "...", "ar": "...", "ht": "...", "ko": "...", "pt": "...",
            "ru": "...", "tl": "..."
          },
          "do_not_check_if": {
            "en": "Do not check this if you want both parents to share decision-making. Use 4b instead.",
            "es": "...", "zh": "...", "vi": "...", "so": "...", "ti": "...",
            "am": "...", "ar": "...", "ht": "...", "ko": "...", "pt": "...",
            "ru": "...", "tl": "..."
          }
        }
      ]
    }
  ]
}
```

### Field Types

- `text_block` — Name, address, case number, etc. Uses `guidance` object.
- `text_field` — Single-line input. Uses `guidance` object.
- `checkbox` — Yes/no selection. Uses `check_if` + `do_not_check_if` objects.
- `checkbox_group` — Multiple related checkboxes (e.g., custody types). Each box is a separate field entry.
- `date_field` — Date entry. Uses `guidance` object.
- `number_field` — Dollar amounts, quantities. Uses `guidance` object.
- `signature` — Signature block. Uses `guidance` object.
- `attachment_indicator` — "Check if additional pages attached." Uses `guidance` object.

### Section IDs

Use the form's own structure. California Judicial Council forms are organized by numbered items:
- `header` — top block (attorney/party info, court info, case number)
- `item_1`, `item_2`, `item_3`, etc. — numbered sections on the form
- `footer` — signature block, date, declaration under penalty of perjury

---

## CRITICAL RULES

1. **Form numbers NEVER translated** — "FL-300" stays "FL-300" in every language.
2. **Legal citations NEVER translated** — "Family Code § 3044" stays exactly that.
3. **Court rule references NEVER translated** — "CRC 5.220" stays exactly that.
4. **Guidance must be practical** — written for someone with NO legal training filling out the form for the first time.
5. **Checkbox guidance is mandatory** — every checkbox needs `check_if` AND `do_not_check_if` in all 13 languages.
6. **One file at a time** — complete one annotation file fully, verify it, then move to the next.
7. **Chunk writes** — use `mode: "rewrite"` for first chunk, `mode: "append"` for rest. Keep chunks to ~25-30 lines.
8. **Verify after each file** — use Python to validate JSON and count sections/fields/languages.

### Translation Rules

- Translate guidance into natural, conversational language — not robotic machine translation.
- Legal terms that have no equivalent stay in English with an explanation (e.g., "ex parte" → keep as "ex parte" with contextual explanation in each language).
- Use terminology consistent with the VERNEN™ legal glossaries already built.

---

## VERIFICATION COMMAND

After writing each file, run:

```
python -c "import json; f=open(r'C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FILENAME.json','r',encoding='utf-8'); data=json.load(f); f.close(); print('VALID JSON'); secs=data['sections']; fields=sum(len(s['fields']) for s in secs); print(f'Sections: {len(secs)}, Fields: {fields}'); [print(f'  {s[\"section_id\"]}: {len(s[\"fields\"])} fields') for s in secs]"
```

Replace FILENAME with the actual form ID (e.g., FL-300).

---

## BUILD STATUS UPDATE

After completing ALL forms in a task, update:
`C:\Users\SagFi\Desktop\VERNEN_IP\VERNEN_BUILD_STATUS.md`

Change Phase 3 status to reflect progress (e.g., "3 of 15 annotation files complete").
