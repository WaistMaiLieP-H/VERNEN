# VERNEN™ — Platform Architecture & Skills Inventory
## Extracted from Claude.ai conversation history — February 2026

---

## PLATFORM OVERVIEW

VERNEN™ is an integrated AI-assisted legal analysis platform combining:
- 21 domain-specific audit skill files (passive compliance layers)
- Legal Standard of Creation (S.o.C.) methodology
- Guided Document Navigator (GDN) — multilingual form assistance engine
- Cross-verification and citation validation pipelines
- Live MCP server connections to official legal databases

## S.o.C. METHODOLOGY (Original)

The "Legal Standard of Creation" is an original analytical framework requiring:
1. Identification of the specific legal standard governing any document BEFORE analysis
2. Audit against that standard for compliance errors, inconsistencies, defects
3. Every finding traceable to specific evidence + the violated standard
4. Professional skepticism applied; authenticity/integrity concerns flagged

## MCP SERVER INTEGRATIONS

| Server | Source | Function |
|--------|--------|----------|
| California Legislative Info | leginfo.legislature.ca.gov | Real-time California statute retrieval |
| California Rules of Court | courts.ca.gov | CRC rule text retrieval |
| California Code of Regulations | Westlaw/CCR | Regulatory section retrieval |
| Cornell LII (USC) | law.cornell.edu | Federal statute retrieval |
| ClinicalTrials.gov | clinicaltrials.gov | Trial search/analysis |
| NPI Registry | CMS NPPES | Healthcare provider lookup |
| ICD-10 Codes | CMS | Diagnosis/procedure codes |
| PopHIVE | CDC | Public health data |

## 21 SKILLS INVENTORY

### Domain-Specific Audit Skills (15)

| # | Skill | Standards |
|---|-------|-----------|
| 1 | CA POST Law Enforcement Audit | CA POST Regulations (CCR Title 11), Penal Code |
| 2 | FBI/Federal Law Enforcement Audit | DOJ Policies, 28 CFR, FBI DIOG |
| 3 | Constitutional & Civil Rights Audit | 42 USC §1983, §1985, 18 USC §241-242, 1st-14th Amendments |
| 4 | California CPS/Child Welfare Audit | WIC §300 et seq., CDSS Manual, CCR Title 22 |
| 5 | FCS Child Custody Recommending Counselor Audit | CRC 5.210, 5.215, 5.220, 5.225, Family Code |
| 6 | California Court Order Compliance Audit | CRC, CCP, Family Code, Judicial Council Requirements |
| 7 | State Bar of California Attorney Conduct Audit | CA Rules of Professional Conduct |
| 8 | ABPN Psychiatry & Neurology Standards Audit | ABPN, APA, CA Medical Board Standards |
| 9 | USMC Military Standards Audit | UCMJ, Marine Corps Regulations |
| 10 | California Insurance Bad Faith Audit | CA Insurance Code, Fair Claims Settlement |
| 11 | California Real Estate Transaction Fraud Audit | Civil Code, Revenue & Taxation Code, DRE |
| 12 | DoD Federal Document Compliance Audit | DoD Directives/Instructions, Federal Personnel Regs |
| 13 | Medical Billing/Surgery Fraud Audit | CA/Federal Healthcare Fraud Standards |
| 14 | California State Agency Correspondence Audit | SAM, Plain Language, Accessibility Standards |
| 15 | California Labor & Employment Audit | CA Labor Code, NLRA, Union Regulations |

### Additional Domain Skills (2)

| # | Skill | Standards |
|---|-------|-----------|
| 16 | Marsy's Law Victim Rights Audit | CA Const. Art. I §28, Penal Code |
| 17 | FCRA/ChexSystems Consumer Report Audit | FCRA, CA CCRAA |
| 18 | SSA/DDS Disability Determination Audit | 20 CFR, POMS, HALLEX |

### Framework/Utility Skills (6)

| # | Skill | Function |
|---|-------|----------|
| 19 | Master Project Intake & Audit Triage | MANDATORY FIRST-TRIGGER: maps entities, doc types, audit sequence |
| 20 | Automated Structuring Input Refiner | Processes/structures unstructured user inputs |
| 21 | California Code Citation Validator | Validates statutory citations for accuracy |
| 22 | Cross-Verifying AI Outputs | Multi-source verification and compliance checks |
| 23 | Executive Style Enforcer | Corporate voice and structure formatting |
| 24 | Legal Bias & Fraud Auditor | S.o.C. identification, one-sided bias detection |
| 25 | Project Context & Guardrails | Maintains project context, enforces boundaries |

**Note:** Some overlap exists between domain audit skills. The actual count varies between 21-25 depending on how you count the USMC variants and overlapping framework skills. The IP manifest catalogs 21 unique skills.

## DEVELOPMENT ENVIRONMENT

- **Platform:** Anthropic Claude.ai (Consumer Interface)
- **AI Model:** Claude (used as development tool under author direction)
- **Skill Framework:** Claude.ai Custom Skills (SKILL.md format)
- **Local Filesystem:** `C:\Users\SagFi\Desktop\VERNEN_IP\`
- **Skills Archive:** `VERNEN_IP\Skills_Archive\`
