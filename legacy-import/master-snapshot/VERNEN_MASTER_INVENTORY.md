# VERNEN™ MASTER INVENTORY — ALL DELIVERABLES ACROSS ALL CHAT HISTORIES
**Generated:** February 25, 2026
**Author:** Michael Vernen Thomas Hartmann
**Purpose:** Cross-reference catalog for consolidation with other VERNEN™ build versions

---

## 1. IP DOCUMENTS

| # | File | Type | Created | Source Chat |
|---|------|------|---------|-------------|
| 1.1 | VERNEN_IP_Manifest_Hartmann_2026.docx | .docx | Feb 2, 2026 | [87cd641d](https://claude.ai/chat/87cd641d-b917-4b4c-b55a-655452a79ab0) |
| 1.2 | VERNEN_COPYRIGHT_HEADER.md | .md | Feb 2, 2026 | [87cd641d](https://claude.ai/chat/87cd641d-b917-4b4c-b55a-655452a79ab0) |
| 1.3 | VERNEN_IP_Checklist.md | .md | Feb 2, 2026 | [87cd641d](https://claude.ai/chat/87cd641d-b917-4b4c-b55a-655452a79ab0) |
| 1.4 | 01_IP_Foundation.md | .md | Feb 7, 2026 | [bcf9730d](https://claude.ai/chat/bcf9730d-c9ea-49f5-bfd1-8a3c28ccefda) |
| 1.5 | IP Disclosure Notice (.docx) | .docx | Feb 24, 2026 | [893dfaf4](https://claude.ai/chat/893dfaf4-0670-4018-89c1-adaded316794) |
| 1.6 | VERNEN_SoC_Audit_Protocol_v1.0.pdf | .pdf | Feb 22, 2026 | [2f852ca5](https://claude.ai/chat/2f852ca5-117c-4555-98e4-34a29b82fabf) |
| 1.7 | build_soc_protocol.py (PDF generator script) | .py | Feb 22, 2026 | [2f852ca5](https://claude.ai/chat/2f852ca5-117c-4555-98e4-34a29b82fabf) |

---

## 2. MCP SERVERS

| # | Server | Version | Tools | Lines | Status | Source Chat |
|---|--------|---------|-------|-------|--------|-------------|
| 2.1 | vernen-legal-mcp (Legal Research) | v2.0.0 | 12→14 | ~700 | LIVE on Render (vernen-legal-mcp.onrender.com) | [5ee401eb](https://claude.ai/chat/5ee401eb-1038-4a57-957b-e42117cd7ae0) |
| 2.2 | vernen-legal-mcp (Legal Research) | v3.1.0 | 17 (+ 50-state module) | 741 | BUILT, NOT DEPLOYED (hardware blocked) | [8cc8d602](https://claude.ai/chat/8cc8d602-23d1-42fc-90aa-dca82b7aea29) / [abf27a58](https://claude.ai/chat/abf27a58-39ce-4ce7-b98a-bf58cf2eb8cc) |
| 2.3 | vernen-mcp-server (Intelligence Platform) | v1.0 | 19 | 8,051 | BUILT in container, 88/88 tests passing, NOT DEPLOYED | This session |

### MCP v2.0 Modules (LIVE):
- Module 1: California Statutory Law (california_get_section, california_list_codes, california_search_code)
- Module 2: California Rules of Court (crc_get_rule, crc_list_key_rules, crc_list_titles)
- Module 3: California Code of Regulations (ccr_get_regulation, ccr_list_key_regulations, ccr_list_titles)
- Module 4: US Code (usc_get_section, usc_list_titles, usc_list_civil_rights)

### MCP v3.1 Additions (NOT DEPLOYED):
- Module 5: All 50 US States (state_get_section, state_list_all, state_info)
- california_search_code CSS selector fix

### MCP v1.0 Intelligence Platform Tools (19):
- 7 LegalZoom-mirror attorney services (3 functional, 4 stubbed)
- 10 forensic audit tools (all functional)
- 2 Tier 2 tools (filing guide, notification engine — both functional)

### MCP v1.0 Deployment Files:
| # | File | Path |
|---|------|------|
| 2.3a | src/index.ts | vernen-mcp-server/src/index.ts (1,070 lines) |
| 2.3b | src/types.ts | vernen-mcp-server/src/types.ts (448 lines) |
| 2.3c | src/constants.ts | vernen-mcp-server/src/constants.ts (261 lines) |
| 2.3d | src/schemas/index.ts | vernen-mcp-server/src/schemas/index.ts (284 lines) |
| 2.3e | src/services/authority-compiler.ts | (586 lines) |
| 2.3f | src/services/case-intake.ts | (501 lines) |
| 2.3g | src/services/deadline-calculator.ts | (646 lines) |
| 2.3h | src/services/evidence-organizer.ts | (194 lines) |
| 2.3i | src/services/hearing-prep.ts | (406 lines) |
| 2.3j | src/services/local-rules.ts | (412 lines) |
| 2.3k | src/services/motion-template.ts | (752 lines) |
| 2.3l | src/services/service-tracker.ts | (228 lines) |
| 2.3m | src/services/document-vault.ts | (308 lines) |
| 2.3n | src/services/conflict-check.ts | (370 lines) |
| 2.3o | src/services/filing-guide.ts | (480 lines) |
| 2.3p | src/services/notification-engine.ts | (250 lines) |
| 2.3q | src/test-harness.ts | (224 lines) |
| 2.3r | package.json | |
| 2.3s | tsconfig.json | |
| 2.3t | README.md | |
| 2.3u | vernen-mcp-server.tar.gz | Packaged archive (13 MB) |

---

## 3. REACT ARTIFACTS / JSX COMPONENTS

| # | File | Description | Lines | Source Chat |
|---|------|-------------|-------|-------------|
| 3.1 | VERNEN_Autonomous_Audit_Engine.jsx | 6-pass self-directing S.o.C. audit pipeline | ~800+ | [2f852ca5](https://claude.ai/chat/2f852ca5-117c-4555-98e4-34a29b82fabf) |
| 3.2 | VERNEN_Audit_Engine.jsx | Standalone document compliance tool | ~600+ | [2f852ca5](https://claude.ai/chat/2f852ca5-117c-4555-98e4-34a29b82fabf) |
| 3.3 | VERNEN_Case_Manager.jsx | Multi-case storage/management layer | ~700+ | [2f852ca5](https://claude.ai/chat/2f852ca5-117c-4555-98e4-34a29b82fabf) |
| 3.4 | VERNEN_Simulator_v7.jsx | Civil suit strategy simulator (16 modules) | ~1,400+ | [2f852ca5](https://claude.ai/chat/2f852ca5-117c-4555-98e4-34a29b82fabf) / [4e599281](https://claude.ai/chat/4e599281-fbcd-4469-9639-2ace14d0b6a8) |
| 3.5 | VERNEN_Simulator_v6.jsx | Prior version of simulator | ~1,242 | [4e599281](https://claude.ai/chat/4e599281-fbcd-4469-9639-2ace14d0b6a8) |
| 3.6 | VERNEN_Branded_Export_Patch.js | Report branding/export module | ~200 | [2f852ca5](https://claude.ai/chat/2f852ca5-117c-4555-98e4-34a29b82fabf) |

---

## 4. WEB / DEPLOYMENT FILES

| # | File | Description | Source Chat |
|---|------|-------------|-------------|
| 4.1 | index.html / vernen_landing.html | Public landing page (19,839 bytes) | [2f852ca5](https://claude.ai/chat/2f852ca5-117c-4555-98e4-34a29b82fabf) / [893dfaf4](https://claude.ai/chat/893dfaf4-0670-4018-89c1-adaded316794) |
| 4.2 | vernen_report_template.html | Branded audit report template (10,883 bytes) | [893dfaf4](https://claude.ai/chat/893dfaf4-0670-4018-89c1-adaded316794) |
| 4.3 | README.md (GitHub) | Repository readme with IP record + file listing | [2f852ca5](https://claude.ai/chat/2f852ca5-117c-4555-98e4-34a29b82fabf) / [893dfaf4](https://claude.ai/chat/893dfaf4-0670-4018-89c1-adaded316794) |
| 4.4 | vernen-site-deploy.zip | Complete Netlify deploy package (21,208 bytes) | [893dfaf4](https://claude.ai/chat/893dfaf4-0670-4018-89c1-adaded316794) |
| 4.5 | _redirects | Netlify routing rules | [893dfaf4](https://claude.ai/chat/893dfaf4-0670-4018-89c1-adaded316794) |
| 4.6 | render.yaml | Render deployment blueprint | [8cc8d602](https://claude.ai/chat/8cc8d602-23d1-42fc-90aa-dca82b7aea29) |
| 4.7 | Dockerfile | Docker config for Render deploy | [8cc8d602](https://claude.ai/chat/8cc8d602-23d1-42fc-90aa-dca82b7aea29) |
| 4.8 | DEPLOY_INSTRUCTIONS.txt | Step-by-step deployment commands | [2f852ca5](https://claude.ai/chat/2f852ca5-117c-4555-98e4-34a29b82fabf) |

### Live Deployments:
- vernen-legal.netlify.app — Landing page + S.o.C. Protocol PDF
- vernen-audit.netlify.app — Audit engine deployment
- vernen-legal-mcp.onrender.com — MCP server (v2.0.0)
- github.com/WaistMaiLieP-H/VERNEN — Public repository (may be JstcePrsuit78/vernen-legal-mcp for MCP)

---

## 5. GDN (GUIDED DOCUMENT NAVIGATOR) — ALL PHASES

| # | Phase | Deliverable | Content | Status | Source Chat |
|---|-------|-------------|---------|--------|-------------|
| 5.1 | Phase 1 | form_registry.json | 15 Tier A forms × 13 languages | ✅ | [dc5d8d48](https://claude.ai/chat/dc5d8d48-98a9-4262-9ad6-21e0b9b694a6) |
| 5.2 | Phase 2 | scenario_index.json | 15 scenarios × 13 languages | ✅ | [e288cc50 referenced](https://claude.ai/chat/bcf9730d-c9ea-49f5-bfd1-8a3c28ccefda) |
| 5.3 | Phase 3 | annotations/ (15 files) | 15 Tier A field annotation files × 13 langs | ✅ | Multiple sessions |
| 5.4 | Phase 4 | Translation pass | All Phase 1-3 content × 12 non-English langs | ✅ | [6ab876d3](https://claude.ai/chat/6ab876d3-e323-48e4-9b3e-7e8d9415a879) |
| 5.5 | Phase 5 | Tier B expansion | 8 forms, 6 scenarios, 8 annotations × 13 langs | ✅ | [a7a77508](https://claude.ai/chat/a7a77508-3fec-4146-aa83-f33f191eb21d) |
| 5.6 | Phase 6 | Tier C expansion | 5 forms, 5 scenarios, 5 annotations × 13 langs | ✅ | [a7a77508](https://claude.ai/chat/a7a77508-3fec-4146-aa83-f33f191eb21d) |
| 5.7 | Unified | gdn_unified/ | Consolidated Tiers A/B/C into production files | ✅ | [a7a77508](https://claude.ai/chat/a7a77508-3fec-4146-aa83-f33f191eb21d) |

### GDN Totals:
- 28 forms (15A + 8B + 5C)
- 26 scenarios (15A + 6B + 5C)
- 26 annotation files
- 13 languages
- ~1.1 MB total
- GDN_MANIFEST.json — production manifest

### GDN Unified Output Files:
| # | File |
|---|------|
| 5.7a | gdn_unified/form_registry.json |
| 5.7b | gdn_unified/scenario_index.json |
| 5.7c | gdn_unified/GDN_MANIFEST.json |
| 5.7d | gdn_unified/annotations/ (26 JSON files) |

---

## 6. i18n LEGAL GLOSSARIES (12 files)

| # | File | Language | Source Chat |
|---|------|----------|-------------|
| 6.1 | legal_glossary_en_es.json | Spanish | [dc5d8d48](https://claude.ai/chat/dc5d8d48-98a9-4262-9ad6-21e0b9b694a6) |
| 6.2 | legal_glossary_en_zh.json | Chinese | [dc5d8d48](https://claude.ai/chat/dc5d8d48-98a9-4262-9ad6-21e0b9b694a6) |
| 6.3 | legal_glossary_en_vi.json | Vietnamese | [dc5d8d48](https://claude.ai/chat/dc5d8d48-98a9-4262-9ad6-21e0b9b694a6) |
| 6.4 | legal_glossary_en_so.json | Somali | [621eb2a8](https://claude.ai/chat/621eb2a8-d944-4b48-a512-02529401b2f7) |
| 6.5 | legal_glossary_en_ti.json | Tigrinya | [621eb2a8](https://claude.ai/chat/621eb2a8-d944-4b48-a512-02529401b2f7) |
| 6.6 | legal_glossary_en_am.json | Amharic | [621eb2a8](https://claude.ai/chat/621eb2a8-d944-4b48-a512-02529401b2f7) |
| 6.7 | legal_glossary_en_ar.json | Arabic | [dc5d8d48](https://claude.ai/chat/dc5d8d48-98a9-4262-9ad6-21e0b9b694a6) |
| 6.8 | legal_glossary_en_ht.json | Haitian Creole | [dc5d8d48](https://claude.ai/chat/dc5d8d48-98a9-4262-9ad6-21e0b9b694a6) |
| 6.9 | legal_glossary_en_ko.json | Korean | [dc5d8d48](https://claude.ai/chat/dc5d8d48-98a9-4262-9ad6-21e0b9b694a6) |
| 6.10 | legal_glossary_en_pt.json | Portuguese | [dc5d8d48](https://claude.ai/chat/dc5d8d48-98a9-4262-9ad6-21e0b9b694a6) |
| 6.11 | legal_glossary_en_ru.json | Russian | [dc5d8d48](https://claude.ai/chat/dc5d8d48-98a9-4262-9ad6-21e0b9b694a6) |
| 6.12 | legal_glossary_en_tl.json | Tagalog | [dc5d8d48](https://claude.ai/chat/dc5d8d48-98a9-4262-9ad6-21e0b9b694a6) |

Schema: 35 terms × 7 domains per file. Legal citations never translated.

---

## 7. AUDIT SKILLS (29 total)

### Core Domain Audit Skills (21 — active in /mnt/skills/user/):

| # | Skill Name | Domain |
|---|-----------|--------|
| 7.1 | abpn-psychiatry-and-neurology-standards-audit | Psychiatry/neurology |
| 7.2 | ca-post-law-enforcement-audit | CA law enforcement |
| 7.3 | california-code-citation-validator | Citation validation |
| 7.4 | california-court-order-compliance-audit | Court orders |
| 7.5 | california-cps-child-welfare-audit | CPS/child welfare |
| 7.6 | california-insurance-bad-faith-audit | Insurance |
| 7.7 | california-labor-employment-audit | Labor/employment |
| 7.8 | california-real-estate-transaction-fraud-audit | Real estate |
| 7.9 | california-state-agency-correspondence-audit | Agency correspondence |
| 7.10 | constitutional-and-civil-rights-audit | Civil rights |
| 7.11 | dod-federal-document-compliance-audit | DoD/federal |
| 7.12 | executive-style-enforcer-corporate-voice-and-structure | Communication standards |
| 7.13 | fbi-federal-law-enforcement-audit | FBI/federal LE |
| 7.14 | fcra-chexsystems-consumer-report-audit | FCRA/consumer reports |
| 7.15 | fcs-child-custody-recommending-counselor-audit | FCS/custody mediators |
| 7.16 | legal-bias-and-fraud-auditor | Bias/fraud detection |
| 7.17 | marsys-law-victim-rights-audit | Victim rights |
| 7.18 | master-project-intake-audit-triage | Project intake |
| 7.19 | medical-billing-surgery-fraud-audit | Medical billing |
| 7.20 | project-context-and-guardrails | Project guardrails |
| 7.21 | ssa-dds-disability-determination-audit | SSA/disability |
| 7.22 | state-bar-of-california-attorney-conduct-audit | Attorney ethics |
| 7.23 | usmc-military-standards-audit | USMC/military |
| 7.24 | automated-structuring-input-refiner | Input processing |
| 7.25 | cross-verifying-ai-outputs-for-best-results | Output verification |

### Tier 1 Expansion Skills (4 — built in [a7a77508](https://claude.ai/chat/a7a77508-3fec-4146-aa83-f33f191eb21d)):

| # | Skill Name | Domain |
|---|-----------|--------|
| 7.26 | california-housing-eviction-compliance-audit | Housing/eviction |
| 7.27 | california-family-law-expanded-audit | Family law expansion |
| 7.28 | california-immigration-compliance-audit | Immigration |
| 7.29 | california-employment-law-expanded-audit | Employment expansion |

### Skill Exports:
| # | File | Source Chat |
|---|------|-------------|
| 7.30 | VERNEN_All_25_Skills_Bundle.zip | [bcf9730d](https://claude.ai/chat/bcf9730d-c9ea-49f5-bfd1-8a3c28ccefda) |
| 7.31 | VERNEN_Skills_Complete.zip | [cdc640f4](https://claude.ai/chat/cdc640f4-ce71-46fe-90d8-197aafca7638) |

---

## 8. REVENUE / BUSINESS DOCUMENTS

| # | File | Type | Source Chat |
|---|------|------|-------------|
| 8.1 | VERNEN_Revenue_Model.docx | .docx | [86f9981a](https://claude.ai/chat/86f9981a-5fe3-402b-acc3-d2da011fcaa6) / [61173976](https://claude.ai/chat/61173976-e07f-445d-916b-c60ffad0ef59) |
| 8.2 | VERNEN_Revenue_Model_Feb2026.docx | .docx (updated) | [86f9981a](https://claude.ai/chat/86f9981a-5fe3-402b-acc3-d2da011fcaa6) |
| 8.3 | VERNEN_Build_Priority_Matrix.docx | .docx | This session |
| 8.4 | VERNEN_Outreach_Package.txt | .txt | [893dfaf4](https://claude.ai/chat/893dfaf4-0670-4018-89c1-adaded316794) |
| 8.5 | Competitive analysis (LegalZoom vs VERNEN) | In-session analysis | This session |

---

## 9. BUILD STATUS / ROADMAP DOCUMENTS

| # | File | Type | Source Chat |
|---|------|------|-------------|
| 9.1 | VERNEN_BUILD_STATUS.md | .md | [a7a77508](https://claude.ai/chat/a7a77508-3fec-4146-aa83-f33f191eb21d) (last updated Feb 14) |
| 9.2 | GDN_guided_document_navigator_spec.md | .md | [dc5d8d48](https://claude.ai/chat/dc5d8d48-98a9-4262-9ad6-21e0b9b694a6) |
| 9.3 | 00_Project_Instructions.md | .md | [bcf9730d](https://claude.ai/chat/bcf9730d-c9ea-49f5-bfd1-8a3c28ccefda) |
| 9.4 | Phase3_Project_Instructions.md | .md | [bcf9730d](https://claude.ai/chat/bcf9730d-c9ea-49f5-bfd1-8a3c28ccefda) |
| 9.5 | Phase3_Task_A.md through Phase3_Task_E.md | .md | [bcf9730d](https://claude.ai/chat/bcf9730d-c9ea-49f5-bfd1-8a3c28ccefda) |

---

## 10. WINDOWS LOCAL FILES (Last Verified)

### C:\Users\SagFi\Downloads\
| # | File |
|---|------|
| 10.1 | VERNEN_Autonomous_Audit_Engine.jsx |
| 10.2 | VERNEN_Audit_Engine.jsx |
| 10.3 | VERNEN_Case_Manager.jsx |
| 10.4 | VERNEN_Simulator_v7.jsx |
| 10.5 | VERNEN_Simulator_v6.jsx |
| 10.6 | VERNEN_Outreach_Package.txt |
| 10.7 | vernen-simulator.jsx (×2) |
| 10.8 | index.html (×6 versions) |
| 10.9 | README.md (×3 versions) |
| 10.10 | vernen-site-deploy.zip |

### C:\Users\SagFi\Desktop\VERNEN_IP\
| # | Path |
|---|------|
| 10.11 | Source_Code\ — GDN data assets, annotations, glossaries |
| 10.12 | Source_Code\annotations\ — per-form field annotation files |
| 10.13 | Source_Code\legal_glossary_en_*.json — 12 glossary files |
| 10.14 | Roadmap\ — GDN spec, Phase 3 tasks, project instructions |
| 10.15 | Skills_Archive\ — skill source files |
| 10.16 | Skills_Project_Upload\ — zipped skills for Claude Project upload |
| 10.17 | Revenue_Models\ — revenue model docx |
| 10.18 | VERNEN_BUILD_STATUS.md |

### C:\Users\SagFi\vernen-legal-mcp\ (MCP Server Local Repo)
| # | Path |
|---|------|
| 10.19 | src/index.ts — v2.0.0 (deployed) or v3.0.0 (with Module 5, undeployed) |
| 10.20 | package.json, tsconfig.json, Dockerfile, render.yaml |

---

## 11. GITHUB REPOSITORIES

| # | Repo | Content |
|---|------|---------|
| 11.1 | JstcePrsuit78/vernen-legal-mcp | MCP server (private) |
| 11.2 | WaistMaiLieP-H/VERNEN | Public platform repo (landing page, JSX, README, protocol PDF) |

---

## 12. KNOWN GAPS / NOT YET BUILT

| # | Item | Priority | Status |
|---|------|----------|--------|
| 12.1 | GDN Frontend UI (React consumer) | HIGH | Not started |
| 12.2 | API endpoint for GDN queries | HIGH | Not started |
| 12.3 | User auth / subscription management | HIGH | Not started |
| 12.4 | Payment processing integration | MEDIUM | Not started |
| 12.5 | MCP v3.1.0 deployment to Render | MEDIUM | Built, blocked on hardware |
| 12.6 | MCP v1.0 (19-tool) deployment | MEDIUM | Built in container only |
| 12.7 | california_search_code CSS fix deployment | LOW | Fix built, not pushed |
| 12.8 | Multi-state form expansion (TX, NY, FL) | MEDIUM | Not started |
| 12.9 | Voice-to-document | LOW | Not started |
| 12.10 | Co-counsel collaboration | LOW | Not started |
| 12.11 | Investor pitch deck | LOW | Not started |
| 12.12 | Skill substantive content gap ("frame without painting") | MEDIUM | Identified, not resolved |

---

## SUMMARY COUNTS

| Category | Count |
|----------|-------|
| IP documents | 7 |
| MCP servers (distinct versions) | 3 |
| MCP server source files (v1.0) | 21 |
| React/JSX components | 6 |
| Web/deployment files | 8 |
| GDN deliverables (phases) | 7 phases, ~60 files total |
| i18n glossaries | 12 |
| Audit skills | 29 |
| Revenue/business docs | 5 |
| Build status/roadmap docs | 5+ |
| Windows local files | 20+ |
| GitHub repos | 2 |

**Total unique deliverables: ~170+ files across ~15 conversations**

---

© 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
IP manifest filed February 2, 2026.
