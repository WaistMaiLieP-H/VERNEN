# PHASE 3 — TASK D: Declaration + Domestic Violence
# Paste this as a message in the Phase 3 Claude.ai Project.

## YOUR TASK

Build **3 annotation files**, one at a time:

| # | Form | Filename | Description |
|---|------|----------|-------------|
| 1 | MC-031 | `annotations/MC-031.json` | Declaration (Attached Declaration) |
| 2 | DV-100 | `annotations/DV-100.json` | Request for Domestic Violence Restraining Order |
| 3 | DV-110 | `annotations/DV-110.json` | Temporary Restraining Order (DV) |

## BEFORE YOU START

1. Read the project instructions (already in project context).
2. Read a completed annotation file to match the schema:
   - `Filesystem:read_text_file` → `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-100.json` (head: 50, tail: 30)

## FORM DETAILS

### MC-031 (Declaration / Attached Declaration)
The universal declaration form — used as attachment to almost everything. Key sections:
- Header: case name, case number, party name
- Item: "Declaration of [name]"
- Body: Numbered paragraphs (this is a BLANK FORM — the annotation explains HOW to write effective declarations)
- Penalty of perjury statement: "I declare under penalty of perjury under the laws of the State of California that the foregoing is true and correct." (CCP § 2015.5)
- Signature, date, city/state
- **SPECIAL: Since this is mostly blank space, annotation should focus heavily on HOW-TO guidance:**
  - How to number paragraphs
  - What to include (personal knowledge facts ONLY)
  - What NOT to include (hearsay, opinions, legal arguments)
  - How to reference exhibits/attachments
  - Length guidance
  - Common mistakes
- **~8-10 fields, but guidance sections should be detailed**

### DV-100 (Request for Domestic Violence Restraining Order)
**SAFETY-CRITICAL FORM.** Key sections:
- Header: protected person info, person to be restrained info
- Item 1: Relationship to restrained person (spouse, cohabitant, dating, parent of child, etc.)
- Item 2: Other protected persons (children, household members)
- Item 3: Description of abuse — NARRATIVE section (explain: be specific, include dates, describe each incident, include physical evidence, witnesses, police reports)
- Item 4: Other court cases between parties
- Item 5: Requested orders — personal conduct (no contact, stay away, move out)
- Item 6: Stay-away orders — distance (yards)
- Item 7: Residence exclusion (move-out order)
- Item 8: Child custody/visitation (temporary)
- Item 9: Child support
- Item 10: Property control
- Item 11: Debt payment orders
- Item 12: Attorney fees
- Item 13: Firearms/ammunition relinquishment (MANDATORY under FC § 6389)
- Item 14: Other orders
- **CRITICAL GUIDANCE: FC § 6326 — court must rule on TRO same day or next business day**
- **~25-30 fields expected**

### DV-110 (Temporary Restraining Order — DV)
The COURT'S temporary order (judge signs this). Key sections:
- Header: protected person, restrained person, case number
- Items mirror DV-100 requests but show what was GRANTED vs. DENIED
- Personal conduct orders — specific prohibitions
- Stay-away distances
- Residence exclusion (if granted)
- Temporary custody (if granted)
- Firearms surrender order — mandatory if TRO granted (FC § 6389)
- Hearing date for full DVRO hearing (within 21-25 days, FC § 6340)
- **Annotate from perspective of: "The judge granted these orders — here's what they mean and what you must do/not do"**
- **~18-22 fields expected**

## EXECUTION

1. Build MC-031.json COMPLETELY. Verify with Python. Confirm valid JSON + field count.
2. Build DV-100.json COMPLETELY. Verify. Confirm.
3. Build DV-110.json COMPLETELY. Verify. Confirm.
4. Update VERNEN_BUILD_STATUS.md: "Phase 3: 12 of 15 annotation files complete (Tasks A-D)"

**DV-100 is large and safety-critical — guidance must be thorough. Chunk carefully.**
