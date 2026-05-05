# PHASE 3 — TASK C: Custody Attachments & Orders
# Paste this as a message in the Phase 3 Claude.ai Project.

## YOUR TASK

Build **3 annotation files**, one at a time:

| # | Form | Filename | Description |
|---|------|----------|-------------|
| 1 | FL-312 | `annotations/FL-312.json` | Request for Child Abduction Prevention Orders |
| 2 | FL-320 | `annotations/FL-320.json` | Responsive Declaration to Request for Order |
| 3 | FL-341 | `annotations/FL-341.json` | Child Custody and Visitation (Parenting Time) Order Attachment |

## BEFORE YOU START

1. Read the project instructions (already in project context).
2. Read a completed annotation file to match the schema:
   - `Filesystem:read_text_file` → `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-300.json` (head: 50, tail: 30)

## FORM DETAILS

### FL-312 (Request for Child Abduction Prevention Orders)
Specialized form for flight-risk situations. Key sections:
- Header: parties, case number
- Item 1: Which child(ren) are at risk
- Item 2: Basis for belief — factors indicating risk of abduction (Family Code § 3048)
  - Prior threats to take child, prior abduction, no strong ties to CA, foreign citizenship/passports, history of DV, lack of financial ties
- Item 3: Orders requested — passport surrender, travel restrictions, no removal from county/state/country, bond posting
- Item 4: Supervised visitation pending resolution
- Item 5: Other preventive measures (notify schools, NCIC entry)
- **~12-15 fields expected**

### FL-320 (Responsive Declaration to Request for Order)
The RESPONSE to FL-300. Key sections:
- Header: parties, case number, hearing date
- Item 1: Respondent's position on each request (agree, disagree, partially agree)
- Item 2: Counter-proposals for custody, visitation, support
- Item 3: Facts supporting respondent's position (or attach MC-031)
- Item 4: What orders respondent wants instead
- Declaration, signature block
- **CRITICAL DEADLINE NOTE:** Must be filed and served at least 9 court days before hearing (CCP § 1005(b))
- **~15-20 fields expected**

### FL-341 (Child Custody and Visitation / Parenting Time Order Attachment)
The COURT'S ORDER (not a request — this is what the judge signs). Key sections:
- Header: parties, case number
- Item 1: Legal custody order — sole to [name] or joint
- Item 2: Physical custody order — sole to [name] or joint
- Item 3: Visitation/parenting time schedule — detailed breakdown
- Item 4: Holiday schedule
- Item 5: Transportation/exchange
- Item 6: Supervised visitation terms (if ordered)
- Item 7: Move-away restrictions
- Item 8: Other conditions
- **Annotate from a litigant's perspective: "This is what the judge ordered — here's what each term means for you"**
- **~18-22 fields expected**

## EXECUTION

1. Build FL-312.json COMPLETELY. Verify with Python. Confirm valid JSON + field count.
2. Build FL-320.json COMPLETELY. Verify. Confirm.
3. Build FL-341.json COMPLETELY. Verify. Confirm.
4. Update VERNEN_BUILD_STATUS.md: "Phase 3: 9 of 15 annotation files complete (Tasks A-C)"

**Write each file in chunks of ~25-30 lines. One file at a time. Verify before moving on.**
