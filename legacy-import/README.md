# legacy-import/

Recovered from a Desktop snapshot dated **2026-02-07** (pulled from an old hard drive on 2026-05-05).

This tree preserves source material that existed on the local desktop but had not been committed to the GitHub repo. It is **not wired into the live build** — the production tree under `src/` is newer and authoritative for runtime code.

## Layout

| Path | Contents | Notes |
|---|---|---|
| `bilingual/` | 13 i18n JSONs (en + 12 translations) + 12 legal glossaries (35 terms × 12 target langs) + bilingual JSX/JS components, system prompts, Claude API client, BILINGUAL_ARCHITECTURE.md | Bilingual stack — never landed in `src/`. Candidate for merge into `src/i18n/` and `src/data/glossaries/`. |
| `ip-manifest/` | IP_Manifest_Hartmann_2026.docx, COPYRIGHT_HEADER_TEMPLATE, IP_Protection_Checklist | Filed IP package, Feb 2026. |
| `project-knowledge/` | 00–04 instruction files (Project Instructions, IP Foundation, Platform Architecture, GDN Build History, Branding Strategy) | Conversation-seeding context. |
| `roadmap/` | Phase 3 Task A–E + GDN continuation instructions + Domain_Expansion_Roadmap.docx | Plan-of-record at snapshot time. `GDN_guided_document_navigator_spec.md` is also live at `docs/roadmap/`. |
| `reference/` | CA Legal Toolkit Scope, Case Index Filing Pattern Analysis, US Constitution annotated PDFs (4th/5th/14th) | Background research material. |
| `revenue/` | VERNEN_Revenue_Model.docx | Pricing/tier draft. |
| `annotations-snapshot/` | FL-100, 110, 120, 300, 305, 311 + validators | **Superseded.** Live tree at `src/data/annotations/` has 15 forms (adds DV-100/109/110, FL-312/320/341, FW-001/003, MC-031). Kept only for historical diff. |
| `build-prompts/` | Phase3_Task_B_prompt.md | Duplicate of `roadmap/Phase3_Task_B_prompt.md`. |
| `VERNEN_BUILD_STATUS_2026-02-07.md` | Older build status (Phase 3 in progress, 6/15 annotations). | Top-level `VERNEN_BUILD_STATUS.md` is the current one (2026-02-24). |
