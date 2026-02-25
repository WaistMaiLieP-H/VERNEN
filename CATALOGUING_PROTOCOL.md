# VERNEN™ — WORK CATALOGUING PROTOCOL
## Established: February 25, 2026
## Author: Michael Vernen Thomas Hartmann
## Purpose: Prevent data loss by cataloguing all work upon completion

---

## RULE: CATALOGUE ON COMPLETION

Every completed process, phase, step, repair, build artifact, or document
MUST be catalogued before the session ends or a new task begins.

### TRIGGERS FOR CATALOGUING:
1. Any file creation or modification
2. Completion of a build phase or batch
3. Any document generation (legal filings, reports, exports)
4. Configuration changes to deployed services
5. Git commits (must include push to remote)
6. Any work exceeding 30 minutes of effort

### CATALOGUING STEPS:
1. **Git commit + push** — All file changes committed with descriptive message and pushed to GitHub
2. **Build status update** — VERNEN_BUILD_STATUS.md updated with completion entry
3. **Session manifest** — Entry added to SESSION_LOG.md with:
   - Date/time
   - Files created/modified (full paths)
   - Bytes/lines written
   - Deployment status if applicable
   - What remains incomplete
4. **Removable device copy** — When available, copy to removable storage
5. **Verification** — Confirm remote push succeeded; confirm file exists on disk

### FILE BACKUP PRIORITY (descending):
1. Source data (annotations, registries, scenarios, glossaries)
2. Legal documents and filings
3. Configuration files (.env, deployment configs)
4. Build scripts and automation
5. Documentation and roadmaps

### BACKUP LOCATIONS:
- PRIMARY: GitHub (github.com/WaistMaiLieP-H/VERNEN)
- SECONDARY: Removable device (when connected)
- TERTIARY: Cloud export from claude.ai session (download artifacts)

### NEVER AGAIN:
- Never leave `src/data/` untracked in Git
- Never end a session without pushing to remote
- Never build data assets in claude.ai container without transferring to local
- Never assume filesystem persistence between sessions

---

## SESSION LOG FORMAT

```
### YYYY-MM-DD HH:MM — [Session Description]
**Files Created:**
- path/to/file.ext (SIZE bytes)

**Files Modified:**
- path/to/file.ext — [what changed]

**Git:** commit HASH pushed to origin/master
**Deploy:** [status]
**Incomplete:** [what remains]
```
