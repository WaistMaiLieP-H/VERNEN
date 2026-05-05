# build-2026-02-28/

Full unzipped Feb 28 2026 platform build, recovered from `ProtonDrive/Desktop/MASTER_VERNEN/03_Deployments/BUILD_2026-02-28/` on 2026-05-05.

This is a more comprehensive build than what's in the live `src/` tree — it includes subsystems that didn't make it into the production VERNEN repo:

- `gdn_navigator/` — GDN runtime
- `validation_engine/` — validation pipeline
- `assembly/` — document assembly
- `traceability/` — audit trail / provenance
- `filing_guide/` — filing guidance flow
- `filesign/` — file signing
- `remediation/` — issue remediation
- `a11y/` — accessibility
- `audit/`, `auth/`, `payments/`, `persistence/`, `errors/`, `export/`, `help/`, `i18n/`, `platform/`, `server/`, `src/`, `styles/`, `tests/`

## Annotations breakdown

`data/annotations/` has **24 form annotations at root** plus Tier B (8) and Tier C (5) — well above current `src/data/annotations/` (15 forms):

- Adds at root vs current: FL-115, FL-130, FL-140, FL-141, **FL-150**, FL-310, MC-030
- Tier B: APP-002, FL-142, FL-150, FL-160, FL-330, FL-335, FL-341D, SC-100
- Tier C: CH-100, CR-160, EA-100, JV-100, UD-100

This represents the GDN Phase 5/6 expansion mentioned in `master-snapshot/VERNEN_MASTER_INVENTORY.md` §5.

## Status

Archival snapshot. Not wired into the current build. Use as reference when porting Tier B/C forms into the live `src/data/annotations/`.
