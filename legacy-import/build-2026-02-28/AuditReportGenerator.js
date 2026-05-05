/**
 * VERNEN™ Audit Report Generator
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Generates structured compliance reports with risk assessment,
 * statutory citation mapping, and remediation recommendations
 * for all 28 supported California Judicial Council forms.
 */

// ==================== RISK SCORING ====================
const RISK_WEIGHTS = {
  missing_required_field: 10,
  incorrect_format: 5,
  statutory_violation: 15,
  deadline_violation: 20,
  jurisdiction_error: 25,
  service_defect: 18,
  missing_companion: 12,
  signature_missing: 10,
  declaration_deficiency: 8,
  inconsistency: 7,
  procedural_error: 14,
  constitutional_concern: 30,
};

const RISK_LEVELS = [
  { level: "LOW", min: 0, max: 15, color: "#22c55e", label: "Low Risk — Minor corrections needed" },
  { level: "MEDIUM", min: 16, max: 40, color: "#f59e0b", label: "Medium Risk — Significant issues to address" },
  { level: "HIGH", min: 41, max: 70, color: "#ef4444", label: "High Risk — Critical deficiencies found" },
  { level: "CRITICAL", min: 71, max: 100, color: "#7f1d1d", label: "Critical Risk — Filing may be rejected or dismissed" },
];

// ==================== STATUTORY CITATION MAP ====================
const CITATION_DATABASE = {
  "FC-2104": { code: "Fam. Code § 2104", title: "Preliminary Declaration of Disclosure", domain: "family" },
  "FC-2310": { code: "Fam. Code § 2310", title: "Grounds for Dissolution", domain: "family" },
  "FC-2320": { code: "Fam. Code § 2320(a)", title: "Residency Requirement", domain: "family" },
  "FC-3020": { code: "Fam. Code § 3020", title: "Best Interest of the Child", domain: "custody" },
  "FC-3044": { code: "Fam. Code § 3044", title: "DV Presumption Against Custody", domain: "custody" },
  "FC-3064": { code: "Fam. Code § 3064", title: "Ex Parte Custody Orders", domain: "custody" },
  "FC-6211": { code: "Fam. Code § 6211", title: "Domestic Violence Definition", domain: "dv" },
  "FC-6222": { code: "Fam. Code § 6222", title: "DVRO Filing Fee Exemption", domain: "dv" },
  "FC-6320": { code: "Fam. Code § 6320", title: "Ex Parte Restraining Orders", domain: "dv" },
  "FC-6326": { code: "Fam. Code § 6326", title: "DVRO Hearing Timeline", domain: "dv" },
  "FC-6340": { code: "Fam. Code § 6340", title: "DVRO Service Requirements", domain: "dv" },
  "FC-771": { code: "Fam. Code § 771", title: "Separate Property After Separation", domain: "property" },
  "CCP-415": { code: "CCP § 415.10", title: "Personal Service", domain: "service" },
  "CCP-527": { code: "CCP § 527.6", title: "Civil Harassment TRO", domain: "harassment" },
  "CCP-1005": { code: "CCP § 1005(b)", title: "Motion Hearing Timeline", domain: "procedure" },
  "CCP-1167": { code: "CCP § 1167", title: "Unlawful Detainer Response Time", domain: "housing" },
  "CCP-116": { code: "CCP § 116.221", title: "Small Claims Jurisdiction", domain: "small_claims" },
  "GC-68631": { code: "GC § 68631", title: "Fee Waiver Eligibility", domain: "access" },
  "GC-70670": { code: "GC § 70670", title: "Family Law Filing Fees", domain: "fees" },
  "WIC-300": { code: "WIC § 300", title: "Dependent Child Definition", domain: "juvenile" },
  "WIC-15610": { code: "WIC § 15610", title: "Elder Abuse Definition", domain: "elder" },
  "WIC-15657": { code: "WIC § 15657.03", title: "Elder Abuse Protective Orders", domain: "elder" },
  "PC-118": { code: "Pen. Code § 118", title: "Perjury", domain: "criminal" },
  "CRC-5151": { code: "CRC 5.151", title: "Ex Parte Applications", domain: "procedure" },
  "CRC-5210": { code: "CRC 5.210", title: "Family Law Case Management", domain: "family" },
  "CRC-8822": { code: "CRC 8.822", title: "Appeal Filing Deadline", domain: "appeals" },
  "CRC-8830": { code: "CRC 8.830-8.843", title: "Limited Civil Appeal Rules", domain: "appeals" },
  "CRC-592": { code: "CRC 5.92(a)", title: "Responsive Declaration Timing", domain: "procedure" },
};

// ==================== REMEDIATION TEMPLATES ====================
const REMEDIATION_TEMPLATES = {
  missing_required_field: {
    severity: "error",
    template: "Complete field '{fieldName}' on {formId}. This is a required field per {statute}.",
    actionType: "complete_field",
  },
  incorrect_format: {
    severity: "warning",
    template: "Correct format for '{fieldName}' on {formId}. Expected: {expectedFormat}.",
    actionType: "correct_field",
  },
  statutory_violation: {
    severity: "error",
    template: "Address statutory violation: {description}. See {statute}.",
    actionType: "legal_review",
  },
  deadline_violation: {
    severity: "critical",
    template: "DEADLINE VIOLATION: {description}. Deadline per {statute} has {status}.",
    actionType: "immediate_action",
  },
  jurisdiction_error: {
    severity: "critical",
    template: "JURISDICTION ERROR: {description}. Filing may be in wrong court. See {statute}.",
    actionType: "venue_review",
  },
  service_defect: {
    severity: "error",
    template: "Service defect: {description}. Required service method per {statute}: {requiredMethod}.",
    actionType: "re_serve",
  },
  missing_companion: {
    severity: "warning",
    template: "Missing companion form: {companionFormId} required with {formId}. See {statute}.",
    actionType: "add_form",
  },
  signature_missing: {
    severity: "error",
    template: "Signature required on {formId} page {page}. Unsigned forms will be rejected.",
    actionType: "sign_form",
  },
  declaration_deficiency: {
    severity: "warning",
    template: "Declaration on {formId} lacks sufficient detail: {description}.",
    actionType: "strengthen_declaration",
  },
  inconsistency: {
    severity: "warning",
    template: "Data inconsistency between {formId1} and {formId2}: {description}.",
    actionType: "reconcile_data",
  },
};

// ==================== REPORT GENERATOR ====================
class AuditReportGenerator {
  constructor() {
    this.reportCounter = 0;
  }

  generateReport(auditData) {
    this.reportCounter++;
    const { formId, formData, validationResults, county, language = "en" } = auditData;
    const findings = this.collectFindings(validationResults);
    const riskScore = this.calculateRiskScore(findings);
    const riskLevel = this.resolveRiskLevel(riskScore);
    const remediation = this.generateRemediation(findings);
    const citations = this.collectCitations(findings);
    const complianceScore = Math.max(0, 100 - riskScore);

    return {
      meta: {
        reportId: `VERNEN-AUDIT-${Date.now()}-${this.reportCounter}`,
        generatedAt: new Date().toISOString(),
        generator: "VERNEN™ Audit Report Generator v1.0",
        copyright: "© 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.",
        formId,
        county: county || "not_specified",
        language,
      },
      summary: {
        complianceScore,
        riskScore,
        riskLevel: riskLevel.level,
        riskLabel: riskLevel.label,
        riskColor: riskLevel.color,
        totalFindings: findings.length,
        criticalFindings: findings.filter((f) => f.severity === "critical").length,
        errorFindings: findings.filter((f) => f.severity === "error").length,
        warningFindings: findings.filter((f) => f.severity === "warning").length,
        infoFindings: findings.filter((f) => f.severity === "info").length,
        filingReadiness: complianceScore >= 80 && findings.filter((f) => f.severity === "critical").length === 0,
      },
      findings: findings.map((f, i) => ({
        id: `F-${String(i + 1).padStart(3, "0")}`,
        ...f,
      })),
      remediation,
      citations,
      timeline: this.generateTimeline(findings),
      recommendations: this.generateRecommendations(findings, riskLevel),
    };
  }

  collectFindings(validationResults) {
    if (!validationResults) return [];
    const findings = [];

    if (validationResults.errors) {
      validationResults.errors.forEach((err) => {
        findings.push({
          type: err.rule || "unknown",
          severity: err.severity || "error",
          description: err.message,
          field: err.field || null,
          statute: err.statute || null,
          weight: RISK_WEIGHTS[err.rule] || 5,
        });
      });
    }

    if (validationResults.warnings) {
      validationResults.warnings.forEach((warn) => {
        findings.push({
          type: warn.rule || "unknown",
          severity: "warning",
          description: warn.message,
          field: warn.field || null,
          statute: warn.statute || null,
          weight: RISK_WEIGHTS[warn.rule] || 3,
        });
      });
    }

    return findings.sort((a, b) => b.weight - a.weight);
  }

  calculateRiskScore(findings) {
    if (findings.length === 0) return 0;
    const totalWeight = findings.reduce((sum, f) => sum + f.weight, 0);
    const maxPossible = 100;
    return Math.min(maxPossible, Math.round(totalWeight));
  }

  resolveRiskLevel(score) {
    return RISK_LEVELS.find((r) => score >= r.min && score <= r.max) || RISK_LEVELS[RISK_LEVELS.length - 1];
  }

  generateRemediation(findings) {
    return findings.map((f) => {
      const template = REMEDIATION_TEMPLATES[f.type];
      if (!template) {
        return {
          findingType: f.type,
          severity: f.severity,
          action: `Review and address: ${f.description}`,
          actionType: "manual_review",
          priority: f.weight >= 15 ? "HIGH" : f.weight >= 8 ? "MEDIUM" : "LOW",
        };
      }

      let action = template.template;
      action = action.replace("{fieldName}", f.field || "unspecified");
      action = action.replace("{formId}", f.formId || "form");
      action = action.replace("{statute}", f.statute || "applicable statute");
      action = action.replace("{description}", f.description || "");
      action = action.replace("{status}", f.status || "passed/approaching");

      return {
        findingType: f.type,
        severity: template.severity,
        action,
        actionType: template.actionType,
        priority: f.weight >= 15 ? "HIGH" : f.weight >= 8 ? "MEDIUM" : "LOW",
      };
    });
  }

  collectCitations(findings) {
    const cited = new Set();
    const citationList = [];

    findings.forEach((f) => {
      if (f.statute && !cited.has(f.statute)) {
        cited.add(f.statute);
        const dbEntry = Object.values(CITATION_DATABASE).find((c) => c.code === f.statute);
        citationList.push({
          code: f.statute,
          title: dbEntry?.title || "See statute text",
          domain: dbEntry?.domain || "general",
          relevantFindings: findings.filter((ff) => ff.statute === f.statute).length,
        });
      }
    });

    return citationList.sort((a, b) => b.relevantFindings - a.relevantFindings);
  }

  generateTimeline(findings) {
    const prioritized = [];
    const critical = findings.filter((f) => f.severity === "critical");
    const errors = findings.filter((f) => f.severity === "error");
    const warnings = findings.filter((f) => f.severity === "warning");

    if (critical.length > 0) {
      prioritized.push({ phase: "IMMEDIATE", timeframe: "Within 24 hours", items: critical.map((f) => f.description) });
    }
    if (errors.length > 0) {
      prioritized.push({ phase: "URGENT", timeframe: "Within 3 business days", items: errors.map((f) => f.description) });
    }
    if (warnings.length > 0) {
      prioritized.push({ phase: "RECOMMENDED", timeframe: "Before filing", items: warnings.map((f) => f.description) });
    }

    return prioritized;
  }

  generateRecommendations(findings, riskLevel) {
    const recs = [];

    if (riskLevel.level === "CRITICAL" || riskLevel.level === "HIGH") {
      recs.push({
        priority: "CRITICAL",
        action: "Review all critical findings before filing. Consider consulting with an attorney.",
        rationale: "Critical deficiencies may result in rejection, dismissal, or adverse orders.",
      });
    }

    const hasMissingCompanion = findings.some((f) => f.type === "missing_companion");
    if (hasMissingCompanion) {
      recs.push({
        priority: "HIGH",
        action: "Obtain and complete all required companion forms before filing.",
        rationale: "Missing companion forms often result in incomplete filing rejection.",
      });
    }

    const hasServiceDefect = findings.some((f) => f.type === "service_defect");
    if (hasServiceDefect) {
      recs.push({
        priority: "HIGH",
        action: "Correct service defects. Re-serve if necessary using proper method.",
        rationale: "Improper service can void the entire proceeding.",
      });
    }

    const hasDeadlineIssue = findings.some((f) => f.type === "deadline_violation");
    if (hasDeadlineIssue) {
      recs.push({
        priority: "URGENT",
        action: "Address deadline violations immediately. Consider emergency filing if applicable.",
        rationale: "Missed deadlines can result in default or waiver of rights.",
      });
    }

    recs.push({
      priority: "STANDARD",
      action: "Run VERNEN™ validation check again after making corrections.",
      rationale: "Ensures all fixes are properly applied before filing.",
    });

    return recs;
  }
}

// ==================== QUICK AUDIT FUNCTION ====================
function quickAudit(formId, validationResults, county) {
  const generator = new AuditReportGenerator();
  return generator.generateReport({
    formId,
    formData: {},
    validationResults,
    county,
  });
}

// ==================== EXPORTS ====================
module.exports = {
  AuditReportGenerator,
  quickAudit,
  RISK_WEIGHTS,
  RISK_LEVELS,
  CITATION_DATABASE,
  REMEDIATION_TEMPLATES,
};
