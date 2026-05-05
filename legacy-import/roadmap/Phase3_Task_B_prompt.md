# PHASE 3 — TASK B (Remaining): FL-305 + FL-311
# Paste this as a message in the VERNEN™ Phase 3 Claude.ai Project.

---

## PROJECT CONTEXT

You are building **VERNEN™ GDN Phase 3** — field-level annotation files for California Judicial Council forms.

- **Author:** Michael Vernen Thomas Hartmann (middle name Vernen, NOT Vernon)
- **All files:** `C:\Users\SagFi\Desktop\VERNEN_IP\`
- **Annotations go to:** `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\`
- **Write to LOCAL filesystem** via Filesystem/Desktop Commander — NOT Claude's container.

## STATUS

Phase 3 is **4 of 15** complete. FL-300 (the first form in Task B) is already done.
You are building the remaining 2 forms in Task B:

| # | Form | Filename | Description |
|---|------|----------|-------------|
| 1 | FL-305 | `annotations/FL-305.json` | Temporary Emergency (Ex Parte) Orders |
| 2 | FL-311 | `annotations/FL-311.json` | Child Custody and Visitation Application Attachment |

## BEFORE YOU START

1. Read project instructions (already in project context).
2. Read a completed annotation file to match the established schema exactly:
   ```
   Filesystem:read_text_file → C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-100.json (head: 50)
   ```
3. Confirm annotations directory exists.

---

## FORM DETAILS

### FL-305 — Temporary Emergency (Ex Parte) Orders
Used when a party needs **immediate** court orders before a regular hearing. Key sections:
- **Header:** parties, court, case number
- **Item 1:** Applicant information — relationship to case
- **Item 2:** Orders requested on emergency basis — checkboxes for custody, visitation, property, stay-away, other
- **Item 3:** Children's information — names, ages, current residence
- **Item 4:** Why emergency orders are needed — must demonstrate "immediate danger" or "irreparable harm"
- **Item 5:** Temporary custody/visitation orders requested
- **Item 6:** Other emergency orders
- **Item 7:** Facts supporting request (or attach MC-031 declaration)
- **Notice section:** CRC 5.151 requires notice to other party by 10:00 AM the court day before the ex parte hearing. Must state how notice was given or why notice should be excused.
- **Declaration under penalty of perjury, signature, date**
- **~12-18 fields expected**

**Critical annotation points:**
- Emergency standard is HIGH — guidance must explain that routine custody disputes do NOT qualify
- Notice requirement (CRC 5.151) must be clearly explained — failure to give notice can result in denial
- "Immediate danger to children" vs. "irreparable harm to property" are different standards — annotate both
- Checkbox for "request to shorten time" vs. true ex parte — explain the difference

### FL-311 — Child Custody and Visitation Application Attachment
Detailed custody and visitation schedule that attaches to FL-300 or other custody motions. Key sections:
- **Header:** case name, case number, attaches to form number
- **Item 1:** Legal custody — sole to one parent / joint (checkbox group)
- **Item 2:** Physical custody — sole to one parent / joint / primary to one with visitation (checkbox group)
- **Item 3:** Visitation/parenting time schedule — weekdays, weekends, alternating weeks
- **Item 4:** Holiday schedule — specific holidays with alternating year designations
- **Item 5:** Summer/vacation schedule
- **Item 6:** Transportation and exchange — who transports, exchange location
- **Item 7:** Supervised visitation — if ordered, by whom, conditions
- **Item 8:** Move-away/relocation restrictions (Family Code § 7501)
- **Item 9:** Other custody/visitation orders
- **Item 10:** Children's names and dates of birth
- **~20-25 fields expected**

**Critical annotation points:**
- Legal custody vs. physical custody — many self-represented litigants confuse these. Annotate the difference clearly in all 13 languages.
- Joint legal custody ≠ joint physical custody — explain in guidance
- Holiday schedules: guidance should note that courts want SPECIFIC holidays listed, not "as agreed"
- Supervised visitation: explain what this means, who can be a supervisor, and that professional supervision may cost money
- Move-away: reference Family Code § 7501 — the right to relocate is important but can be restricted by court order

---

## SCHEMA RULES (from Phase 3 spec)

- **13 languages** per guidance object: en, es, zh, vi, so, ti, am, ar, ht, ko, pt, ru, tl
- **Field types:** text_block, text_field, checkbox, checkbox_group, date_field, number_field, signature, attachment_indicator
- **Every checkbox** must have BOTH `check_if` AND `do_not_check_if` in all 13 languages
- **Form numbers, statutory citations, URLs** are NEVER translated
- **Guidance** is written for someone with NO legal training, filling out the form for the first time
- **Chunk writes** to ~25-30 lines. First chunk: `mode: "rewrite"`. All subsequent: `mode: "append"`.

## COPYRIGHT HEADER (in meta block)

© 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.

---

## EXECUTION ORDER

1. **FL-305.json** — Build completely. Verify with Python. Confirm valid JSON + section/field count.
2. **FL-311.json** — Build completely. Verify. Confirm.
3. **Update** `VERNEN_BUILD_STATUS.md`: Change Phase 3 line to "6 of 15 annotation files complete (Tasks A + B)"

## VERIFICATION COMMAND (run after each file)

```
python -c "import json; f=open(r'C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FILENAME.json','r',encoding='utf-8'); data=json.load(f); f.close(); print('VALID JSON'); secs=data['sections']; fields=sum(len(s['fields']) for s in secs); print(f'Sections: {len(secs)}, Fields: {fields}'); [print(f'  {s[\"section_id\"]}: {len(s[\"fields\"])} fields') for s in secs]"
```

Replace `FILENAME` with the form ID (FL-305 or FL-311).

---

**Start with FL-305. Go.**
