# PHASE 3 — TASK E: DV Notice + Fee Waiver (FINAL)
# Paste this as a message in the Phase 3 Claude.ai Project.

## YOUR TASK

Build **3 annotation files**, one at a time. **This is the FINAL task — completes Phase 3.**

| # | Form | Filename | Description |
|---|------|----------|-------------|
| 1 | DV-109 | `annotations/DV-109.json` | Notice of Court Hearing (DV) |
| 2 | FW-001 | `annotations/FW-001.json` | Request to Waive Court Fees |
| 3 | FW-003 | `annotations/FW-003.json` | Order on Court Fee Waiver |

## BEFORE YOU START

1. Read the project instructions (already in project context).
2. Read a completed annotation file to match the schema:
   - `Filesystem:read_text_file` → `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\DV-100.json` (head: 50, tail: 30)

## FORM DETAILS

### DV-109 (Notice of Court Hearing — Domestic Violence)
Notifies parties of the hearing date. Key sections:
- Header: case name, case number, protected person, restrained person
- Item 1: Court hearing date, time, department
- Item 2: What the hearing is about (DVRO continuation/modification)
- Item 3: What you must do before the hearing
- Item 4: How to respond (file DV-120 Response before hearing)
- Service instructions — how this form must be served on the restrained person
- **Annotate from both perspectives: "If you filed the DV-100" AND "If you were served with this"**
- **~8-12 fields expected**

### FW-001 (Request to Waive Court Fees)
Fee waiver — gateway form for access to justice. Key sections:
- Header: party info, case number, court
- Item 1: Basis for waiver — three paths:
  - (a) Receiving public benefits (list which: Medi-Cal, food stamps/CalFresh, SSI, SSP, CalWORKs, CAPI, IHSS, Tribal TANF)
  - (b) Household income below poverty guidelines (include income table guidance)
  - (c) Income not enough for basic needs AND court costs (hardship)
- Item 2: Household size and income
- Item 3: Public benefits details
- Item 4: Monthly income sources (employment, self-employment, disability, child support received, etc.)
- Item 5: Monthly expenses
- Item 6: Lawyer information (if applicable)
- Declaration, signature
- **CRITICAL: If granted, waiver covers filing fees, motion fees, jury fees, court reporter fees, sheriff service fees**
- **ALSO CRITICAL: Court MUST rule within 5 court days (GC § 68634(e))**
- **~15-20 fields expected**

### FW-003 (Order on Court Fee Waiver)
The COURT'S ruling on FW-001. Key sections:
- Header: case name, case number
- Item 1: Fee waiver GRANTED (full or partial)
- Item 2: Fee waiver DENIED — reasons
- Item 3: If denied, deadline to pay fees (usually 10 days)
- Item 4: Right to hearing on denial (within 10 days of denial, GC § 68634(e))
- Item 5: What fees are waived (list)
- **Annotate from litigant perspective: "Here's what the court decided and what to do next"**
- **~10-12 fields expected**

## EXECUTION

1. Build DV-109.json COMPLETELY. Verify with Python. Confirm valid JSON + field count.
2. Build FW-001.json COMPLETELY. Verify. Confirm.
3. Build FW-003.json COMPLETELY. Verify. Confirm.
4. Update VERNEN_BUILD_STATUS.md:
   - Change Phase 3 status to: "✅ DONE"
   - Change Phase 3 line to: `| 3 | annotations/ — Tier A field annotations (15 forms) × 12 langs | ✅ DONE |`
   - Change next status to Phase 4: `| 4 | Translation pass — Phase 1 × 12 languages | ⬜ NEXT |`

## FINAL VERIFICATION

After all 3 files are written, run a directory listing:

```
python -c "import os; path=r'C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations'; files=sorted(os.listdir(path)); print(f'Total annotation files: {len(files)}'); [print(f'  {f} — {os.path.getsize(os.path.join(path,f)):,} bytes') for f in files]"
```

**Expected: 15 JSON files, one per Tier A form.**

Congratulations — Phase 3 is complete. Phase 4 (translation pass) is next.
