# PHASE 3 — TASK A: Dissolution Basics
# Paste this as a message in the Phase 3 Claude.ai Project.

## YOUR TASK

Build **3 annotation files**, one at a time:

| # | Form | Filename | Description |
|---|------|----------|-------------|
| 1 | FL-100 | `annotations/FL-100.json` | Petition — Marriage/Domestic Partnership |
| 2 | FL-110 | `annotations/FL-110.json` | Summons (Family Law) |
| 3 | FL-120 | `annotations/FL-120.json` | Response — Marriage/Domestic Partnership |

## BEFORE YOU START

1. Read the project instructions (already in project context).
2. Read the form registry to see existing schema:
   - `Filesystem:read_text_file` → `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\form_registry.json` (head: 50)
3. Create the annotations directory if it doesn't exist:
   - `C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\`

## FORM DETAILS

### FL-100 (Petition — Marriage/Domestic Partnership)
Key sections to annotate:
- Header: attorney/party info, court name/address, case number
- Item 1: Petitioner's name, residence, date of marriage
- Item 2: Legal grounds (irreconcilable differences — this is the ONLY ground in CA)
- Item 3: Minor children — names, ages, relationship
- Item 4: Requests — dissolution, legal separation, nullity
- Item 5: Custody, visitation requests
- Item 6: Spousal/partner support
- Item 7: Property — community/separate
- Item 8: Attorney fees request
- Declaration/signature block
- **~15-20 fields expected**

### FL-110 (Summons — Family Law)
This is the SIMPLEST form — mostly pre-printed notices. Annotate:
- Header: petitioner/respondent names, case number
- Standard restraining orders (ATROS) — explain what each one means
- Notice to respondent: 30-day deadline to file response
- Signature/date
- **~6-8 fields expected** (many are informational notices, not fill-in)

### FL-120 (Response — Marriage/Domestic Partnership)
Mirrors FL-100 structurally. Annotate:
- Header: attorney/party info, court, case number
- Item 1: Respondent agrees/disagrees with petition
- Items 2-8: Mirror petition items — custody, support, property
- Counterpetition section (if respondent wants different relief)
- Declaration/signature block
- **~15-20 fields expected**

## EXECUTION

1. Build FL-100.json COMPLETELY. Verify with Python. Confirm valid JSON + field count.
2. Build FL-110.json COMPLETELY. Verify. Confirm.
3. Build FL-120.json COMPLETELY. Verify. Confirm.
4. Update VERNEN_BUILD_STATUS.md: "Phase 3: 3 of 15 annotation files complete (Task A)"

**Write each file in chunks of ~25-30 lines. One file at a time. Do NOT start the next file until the current one is verified.**
