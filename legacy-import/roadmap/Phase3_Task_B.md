# PHASE 3 — TASK B: Custody & Request for Order Core
# Paste this as a message in the Phase 3 Claude.ai Project.

## YOUR TASK

Build **3 annotation files**, one at a time:

| # | Form | Filename | Description |
|---|------|----------|-------------|
| 1 | FL-300 | `annotations/FL-300.json` | Request for Order |
| 2 | FL-305 | `annotations/FL-305.json` | Temporary Emergency (Ex Parte) Orders |
| 3 | FL-311 | `annotations/FL-311.json` | Child Custody and Visitation Application Attachment |

## BEFORE YOU START

1. Read the project instructions (already in project context).
2. Read a completed Task A annotation file to match the schema:
   - `Filesystem:read_text_file` → `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-100.json` (head: 50, tail: 30)
3. Confirm annotations directory exists.

## FORM DETAILS

### FL-300 (Request for Order)
THE most important family law motion form. Key sections:
- Header: parties, court, case number
- Item 1: Relationship to case (petitioner/respondent/other)
- Item 2: Hearing date/time/department (clerk fills in)
- Item 3: Orders requested — checkboxes for custody, visitation, child support, spousal support, property, attorney fees, other
- Item 4: Child custody — sole legal, joint legal, sole physical, joint physical (checkbox group — CRITICAL to annotate clearly)
- Item 5: Child visitation — reasonable, per attached schedule, supervised
- Item 6: Child support — modify, terminate, order health insurance
- Item 7: Spousal/partner support
- Item 8: Property restraint/control
- Item 9: Attorney fees
- Item 10: Other relief
- Facts in support (or attach MC-031)
- Declaration, signature, proof of service info
- **~25-35 fields expected — this is the LARGEST form**

### FL-305 (Temporary Emergency / Ex Parte Orders)
Used for true emergencies. Key sections:
- Header: parties, case number
- Item 1: Why emergency orders are needed (immediate harm standard)
- Item 2: What orders are requested
- Item 3: Temporary custody/visitation
- Item 4: Property orders
- Item 5: Other temporary orders
- Declaration of emergency (must show "immediate danger" or "irreparable harm")
- Notice requirements — CRC 5.151 requires notice to other party by 10 AM day before
- **~12-18 fields expected**

### FL-311 (Child Custody and Visitation Application Attachment)
Detailed custody schedule attachment. Key sections:
- Header: case name, case number
- Item 1: Children's information (names, DOB, current living situation)
- Item 2: Legal custody proposal (sole/joint)
- Item 3: Physical custody proposal (sole/joint/primary)
- Item 4: Visitation schedule — weekdays, weekends, holidays, summer, school year
- Item 5: Transportation/exchange arrangements
- Item 6: Supervised visitation (if applicable)
- Item 7: Move-away restrictions
- Item 8: Other custody/visitation orders
- **~20-25 fields expected**

## EXECUTION

1. Build FL-300.json COMPLETELY. Verify with Python. Confirm valid JSON + field count.
2. Build FL-305.json COMPLETELY. Verify. Confirm.
3. Build FL-311.json COMPLETELY. Verify. Confirm.
4. Update VERNEN_BUILD_STATUS.md: "Phase 3: 6 of 15 annotation files complete (Tasks A-B)"

**FL-300 is the biggest form — chunk it carefully. If it's too large for one session, write section-by-section using append mode.**
