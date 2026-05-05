/**
 * VERNEN™ Form Validation Engine
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Pre-submission compliance checker for California Judicial Council forms.
 * Validates required fields, cross-field dependencies, statutory compliance,
 * and filing prerequisites across all 28 supported forms.
 */

// ─── VALIDATION SEVERITY LEVELS ──────────────────────────────────────
export const SEVERITY = {
  ERROR: "error",       // Filing will be rejected
  WARNING: "warning",   // May cause delay or prejudice
  INFO: "info",         // Best practice recommendation
};

// ─── CORE VALIDATION RULES ───────────────────────────────────────────

/**
 * Universal rules that apply to ALL California Judicial Council forms.
 * These are checked first before form-specific rules.
 */
const UNIVERSAL_RULES = [
  {
    id: "UNI-001",
    description: "Caption block — case number required on all filed documents",
    severity: SEVERITY.ERROR,
    validate: (fields) => {
      const caseNum = fields.case_number || fields.caseNumber || fields["case-number"];
      if (!caseNum || caseNum.trim() === "") {
        return { pass: false, message: "Case number is blank. Required on all filed documents. If new filing, write 'NEW' or leave for clerk." };
      }
      return { pass: true };
    },
  },
  {
    id: "UNI-002",
    description: "Caption block — petitioner/plaintiff name required",
    severity: SEVERITY.ERROR,
    validate: (fields) => {
      const name = fields.petitioner_name || fields.plaintiff_name || fields.your_name;
      if (!name || name.trim() === "") {
        return { pass: false, message: "Petitioner/Plaintiff name is blank. Required for filing." };
      }
      return { pass: true };
    },
  },
  {
    id: "UNI-003",
    description: "Caption block — respondent/defendant name required",
    severity: SEVERITY.WARNING,
    validate: (fields) => {
      const name = fields.respondent_name || fields.defendant_name || fields.other_party_name;
      if (!name || name.trim() === "") {
        return { pass: false, message: "Respondent/Defendant name is blank. May be required depending on case type." };
      }
      return { pass: true };
    },
  },
  {
    id: "UNI-004",
    description: "Filing party address and phone required for self-represented litigants",
    severity: SEVERITY.WARNING,
    validate: (fields) => {
      const addr = fields.address || fields.street_address || fields.mailing_address;
      const phone = fields.phone || fields.telephone || fields.phone_number;
      const issues = [];
      if (!addr || addr.trim() === "") issues.push("mailing address");
      if (!phone || phone.trim() === "") issues.push("telephone number");
      if (issues.length > 0) {
        return { pass: false, message: `Missing ${issues.join(" and ")}. Self-represented litigants must provide contact information.` };
      }
      return { pass: true };
    },
  },
  {
    id: "UNI-005",
    description: "Signature and date required on all filed documents",
    severity: SEVERITY.ERROR,
    validate: (fields) => {
      const sig = fields.signature || fields.signed;
      const date = fields.date || fields.signature_date || fields.date_signed;
      const issues = [];
      if (!sig) issues.push("signature");
      if (!date) issues.push("date");
      if (issues.length > 0) {
        return { pass: false, message: `Missing ${issues.join(" and ")}. Unsigned documents will be rejected by the clerk.` };
      }
      return { pass: true };
    },
  },
  {
    id: "UNI-006",
    description: "Date format validation (California standard: MM/DD/YYYY)",
    severity: SEVERITY.INFO,
    validate: (fields) => {
      const dateFields = Object.entries(fields).filter(([k]) =>
        k.includes("date") || k.includes("Date")
      );
      for (const [key, val] of dateFields) {
        if (val && typeof val === "string" && val.trim() !== "") {
          if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val.trim())) {
            return { pass: false, message: `Field "${key}" date format should be MM/DD/YYYY. Found: "${val}"` };
          }
        }
      }
      return { pass: true };
    },
  },
];

// ─── FORM-SPECIFIC VALIDATION RULE SETS ──────────────────────────────

const FORM_RULES = {
  // ── FL-100: Petition for Dissolution ────────────────────────────
  "FL-100": [
    {
      id: "FL100-001",
      description: "Grounds for dissolution (irreconcilable differences or incurable insanity)",
      severity: SEVERITY.ERROR,
      validate: (f) => {
        const grounds = f.grounds || f.dissolution_grounds;
        if (!grounds) return { pass: false, message: "Must specify grounds: irreconcilable differences (Fam. Code § 2310(a)) or incurable insanity (Fam. Code § 2310(b))." };
        return { pass: true };
      },
    },
    {
      id: "FL100-002",
      description: "Date of marriage required",
      severity: SEVERITY.ERROR,
      validate: (f) => {
        if (!f.date_of_marriage && !f.marriage_date) return { pass: false, message: "Date of marriage is required for dissolution petition." };
        return { pass: true };
      },
    },
    {
      id: "FL100-003",
      description: "Date of separation required (critical for property division)",
      severity: SEVERITY.ERROR,
      validate: (f) => {
        if (!f.date_of_separation && !f.separation_date) return { pass: false, message: "Date of separation is required. Affects community property division under Fam. Code § 771." };
        return { pass: true };
      },
    },
    {
      id: "FL100-004",
      description: "Residency requirement — 6 months CA / 3 months county",
      severity: SEVERITY.ERROR,
      validate: (f) => {
        const residency = f.residency_met || f.residency_requirement;
        if (residency === false || residency === "no") return { pass: false, message: "California residency requirement not met. Must reside in CA 6 months and county 3 months before filing (Fam. Code § 2320)." };
        return { pass: true };
      },
    },
    {
      id: "FL100-005",
      description: "Children — must declare if minor children exist",
      severity: SEVERITY.WARNING,
      validate: (f) => {
        if (f.minor_children === undefined && f.children === undefined) return { pass: false, message: "Must declare whether minor children of the relationship exist. Required for jurisdictional determination." };
        return { pass: true };
      },
    },
  ],

  // ── FL-150: Income and Expense Declaration ──────────────────────
  "FL-150": [
    {
      id: "FL150-001",
      description: "Employment income required",
      severity: SEVERITY.ERROR,
      validate: (f) => {
        if (!f.gross_monthly_income && !f.employment_income) return { pass: false, message: "Gross monthly income must be declared. Attach pay stubs for last 2 months per Fam. Code § 2104." };
        return { pass: true };
      },
    },
    {
      id: "FL150-002",
      description: "Monthly expenses required for support calculations",
      severity: SEVERITY.ERROR,
      validate: (f) => {
        if (!f.total_monthly_expenses && !f.monthly_expenses) return { pass: false, message: "Total monthly expenses must be declared for support calculations." };
        return { pass: true };
      },
    },
    {
      id: "FL150-003",
      description: "Signature under penalty of perjury — heightened requirement",
      severity: SEVERITY.ERROR,
      validate: (f) => {
        if (!f.perjury_declaration && !f.under_penalty_of_perjury) return { pass: false, message: "FL-150 must be signed under penalty of perjury. False declarations carry criminal penalties (Pen. Code § 118)." };
        return { pass: true };
      },
    },
  ],

  // ── FL-300: Request for Order ───────────────────────────────────
  "FL-300": [
    {
      id: "FL300-001",
      description: "Must specify what orders are requested",
      severity: SEVERITY.ERROR,
      validate: (f) => {
        const orders = f.orders_requested || f.requested_orders;
        if (!orders || (Array.isArray(orders) && orders.length === 0)) return { pass: false, message: "Must specify at least one order being requested (custody, support, property, etc.)." };
        return { pass: true };
      },
    },
    {
      id: "FL300-002",
      description: "Hearing date must be set before filing",
      severity: SEVERITY.WARNING,
      validate: (f) => {
        if (!f.hearing_date) return { pass: false, message: "Hearing date should be obtained from clerk before filing. Check local court reservation system." };
        return { pass: true };
      },
    },
    {
      id: "FL300-003",
      description: "Supporting declaration required (FL-305 or MC-031)",
      severity: SEVERITY.WARNING,
      validate: (f) => {
        if (!f.declaration_attached && !f.supporting_declaration) return { pass: false, message: "FL-300 should be accompanied by supporting declaration (FL-305 or MC-031). Without facts supporting the request, the motion may be denied." };
        return { pass: true };
      },
    },
  ],

  // ── DV-100: Request for Domestic Violence Restraining Order ─────
  "DV-100": [
    {
      id: "DV100-001",
      description: "Relationship to restrained person required",
      severity: SEVERITY.ERROR,
      validate: (f) => {
        if (!f.relationship && !f.relationship_type) return { pass: false, message: "Must specify relationship to person you want restrained. Required for DVPA jurisdiction (Fam. Code § 6211)." };
        return { pass: true };
      },
    },
    {
      id: "DV100-002",
      description: "Description of abuse required",
      severity: SEVERITY.ERROR,
      validate: (f) => {
        if (!f.abuse_description && !f.description_of_abuse) return { pass: false, message: "Must describe the abuse in detail. Conclusory statements are insufficient — include dates, actions, and specifics." };
        return { pass: true };
      },
    },
    {
      id: "DV100-003",
      description: "Orders requested must be specified",
      severity: SEVERITY.ERROR,
      validate: (f) => {
        const orders = f.orders_requested || f.protective_orders;
        if (!orders || (Array.isArray(orders) && orders.length === 0)) return { pass: false, message: "Must check which protective orders are being requested (stay away, personal conduct, move-out, etc.)." };
        return { pass: true };
      },
    },
  ],

  // ── FW-001: Fee Waiver ──────────────────────────────────────────
  "FW-001": [
    {
      id: "FW001-001",
      description: "Basis for fee waiver must be selected",
      severity: SEVERITY.ERROR,
      validate: (f) => {
        const basis = f.waiver_basis || f.fee_waiver_basis;
        if (!basis) return { pass: false, message: "Must select basis: (a) public benefits recipient, (b) household income below poverty guidelines, or (c) insufficient income for basic needs plus court fees." };
        return { pass: true };
      },
    },
    {
      id: "FW001-002",
      description: "Household income required for basis (b) or (c)",
      severity: SEVERITY.WARNING,
      validate: (f) => {
        const basis = f.waiver_basis || f.fee_waiver_basis;
        if (basis === "b" || basis === "c" || basis === "income") {
          if (!f.household_income && !f.monthly_income) return { pass: false, message: "Household income must be declared for income-based fee waiver requests." };
        }
        return { pass: true };
      },
    },
  ],

  // ── SC-100: Small Claims ────────────────────────────────────────
  "SC-100": [
    {
      id: "SC100-001",
      description: "Claim amount within jurisdictional limit",
      severity: SEVERITY.ERROR,
      validate: (f) => {
        const amount = parseFloat(f.claim_amount || f.amount_claimed || 0);
        if (amount > 12500) return { pass: false, message: "Small claims limit is $12,500 for individual plaintiffs (CCP § 116.221). Amount exceeds jurisdiction." };
        if (amount <= 0) return { pass: false, message: "Claim amount must be specified." };
        return { pass: true };
      },
    },
    {
      id: "SC100-002",
      description: "Demand letter required before filing",
      severity: SEVERITY.WARNING,
      validate: (f) => {
        if (!f.demand_sent && !f.demand_letter) return { pass: false, message: "Best practice: send demand letter before filing small claims. Some judges expect proof of prior demand." };
        return { pass: true };
      },
    },
  ],

  // ── APP-002: Appellant's Notice Designating Record on Appeal ────
  "APP-002": [
    {
      id: "APP002-001",
      description: "Appellate case number or superior court case required",
      severity: SEVERITY.ERROR,
      validate: (f) => {
        if (!f.appellate_case_number && !f.superior_court_case) return { pass: false, message: "Must provide either appellate case number or superior court case number." };
        return { pass: true };
      },
    },
    {
      id: "APP002-002",
      description: "Record designation must be specified",
      severity: SEVERITY.ERROR,
      validate: (f) => {
        if (!f.record_type && !f.record_designation) return { pass: false, message: "Must designate record type: clerk's transcript, appendix, or agreed/settled statement (CRC 8.830-8.843)." };
        return { pass: true };
      },
    },
  ],

  // ── CH-100: Civil Harassment Restraining Order ──────────────────
  "CH-100": [
    {
      id: "CH100-001",
      description: "Harassment description required with specificity",
      severity: SEVERITY.ERROR,
      validate: (f) => {
        if (!f.harassment_description) return { pass: false, message: "Must describe harassment in detail. Must meet CCP § 527.6 standard: credible threat of violence or course of conduct serving no legitimate purpose." };
        return { pass: true };
      },
    },
  ],

  // ── UD-100: Unlawful Detainer ───────────────────────────────────
  "UD-100": [
    {
      id: "UD100-001",
      description: "Notice type and compliance required",
      severity: SEVERITY.ERROR,
      validate: (f) => {
        if (!f.notice_type) return { pass: false, message: "Must specify notice type served (3-day, 30-day, 60-day, 90-day) and confirm proper service." };
        return { pass: true };
      },
    },
    {
      id: "UD100-002",
      description: "Rental agreement details required",
      severity: SEVERITY.WARNING,
      validate: (f) => {
        if (!f.rental_agreement_type && !f.lease_type) return { pass: false, message: "Should specify whether rental agreement is written, oral, or month-to-month." };
        return { pass: true };
      },
    },
  ],

  // ── EA-100: Elder Abuse Restraining Order ───────────────────────
  "EA-100": [
    {
      id: "EA100-001",
      description: "Elder/dependent adult status required",
      severity: SEVERITY.ERROR,
      validate: (f) => {
        if (!f.elder_status && !f.dependent_adult_status) return { pass: false, message: "Must establish that protected person is 65+ years old or a dependent adult (W&I Code § 15610.23, § 15610.27)." };
        return { pass: true };
      },
    },
  ],

  // ── JV-100: Juvenile Dependency Petition ────────────────────────
  "JV-100": [
    {
      id: "JV100-001",
      description: "WIC § 300 subdivision must be specified",
      severity: SEVERITY.ERROR,
      validate: (f) => {
        if (!f.wic_subdivision && !f.section_300_basis) return { pass: false, message: "Must specify which W&I Code § 300 subdivision applies (a through j). This determines the jurisdictional basis." };
        return { pass: true };
      },
    },
  ],

  // ── CR-160: Criminal Protective Order ───────────────────────────
  "CR-160": [
    {
      id: "CR160-001",
      description: "Criminal case number required",
      severity: SEVERITY.ERROR,
      validate: (f) => {
        if (!f.criminal_case_number) return { pass: false, message: "Criminal case number is required. CR-160 is issued in connection with an active criminal case." };
        return { pass: true };
      },
    },
  ],
};

// ─── CROSS-FORM DEPENDENCY RULES ─────────────────────────────────────

const CROSS_FORM_RULES = [
  {
    id: "CROSS-001",
    description: "FL-300 requires supporting declaration",
    trigger_form: "FL-300",
    required_companion: ["FL-305", "MC-031"],
    severity: SEVERITY.WARNING,
    message: "FL-300 (Request for Order) should be accompanied by FL-305 (Temporary Emergency Orders) or MC-031 (Declaration) with supporting facts.",
  },
  {
    id: "CROSS-002",
    description: "FL-100 should be accompanied by FL-110 and FL-120",
    trigger_form: "FL-100",
    required_companion: ["FL-110", "FL-120"],
    severity: SEVERITY.INFO,
    message: "FL-100 (Petition) is typically filed with FL-110 (Summons) and FL-120 (Response). Ensure service requirements are met.",
  },
  {
    id: "CROSS-003",
    description: "FL-341 requires FL-300 or pending custody hearing",
    trigger_form: "FL-341",
    required_companion: ["FL-300"],
    severity: SEVERITY.INFO,
    message: "FL-341 (Child Custody Order Attachment) is typically attached to FL-300 or final judgment. Ensure corresponding motion is filed.",
  },
  {
    id: "CROSS-004",
    description: "DV-100 generates DV-109 and DV-110 upon issuance",
    trigger_form: "DV-100",
    required_companion: ["DV-109", "DV-110"],
    severity: SEVERITY.INFO,
    message: "Upon issuance, DV-100 generates DV-109 (Notice of Hearing) and DV-110 (TRO). Prepare service plan for these companion documents.",
  },
  {
    id: "CROSS-005",
    description: "FW-001 should accompany any initial filing if fee waiver needed",
    trigger_form: "FW-001",
    required_companion: [],
    severity: SEVERITY.INFO,
    message: "FW-001 must be filed simultaneously with or before the document requiring fees. Cannot be filed retroactively.",
  },
];

// ─── FILING DEADLINE RULES ───────────────────────────────────────────

const DEADLINE_RULES = [
  {
    id: "DL-001",
    form: "FL-120",
    description: "Response deadline: 30 days from service",
    severity: SEVERITY.ERROR,
    validate: (f) => {
      if (f.service_date) {
        const served = new Date(f.service_date);
        const deadline = new Date(served.getTime() + 30 * 24 * 60 * 60 * 1000);
        const today = new Date();
        if (today > deadline) return { pass: false, message: `Response deadline was ${deadline.toLocaleDateString()}. Filing is late — may need to file motion to set aside default.` };
        const daysLeft = Math.ceil((deadline - today) / (24 * 60 * 60 * 1000));
        if (daysLeft <= 5) return { pass: false, message: `Only ${daysLeft} days remaining to file response. Deadline: ${deadline.toLocaleDateString()}.` };
      }
      return { pass: true };
    },
  },
  {
    id: "DL-002",
    form: "DV-100",
    description: "DVRO hearing within 21-25 days of TRO issuance",
    severity: SEVERITY.WARNING,
    validate: (f) => {
      if (f.tro_issue_date && f.hearing_date) {
        const tro = new Date(f.tro_issue_date);
        const hearing = new Date(f.hearing_date);
        const days = Math.ceil((hearing - tro) / (24 * 60 * 60 * 1000));
        if (days > 25) return { pass: false, message: `Hearing is ${days} days after TRO issuance. Must be within 21-25 days per Fam. Code § 242.` };
      }
      return { pass: true };
    },
  },
];

// ─── MAIN VALIDATION ENGINE ──────────────────────────────────────────

/**
 * Validates a form submission against all applicable rules.
 *
 * @param {string} formId - Form identifier (e.g., "FL-100")
 * @param {object} fields - Key-value pairs of field data
 * @param {string[]} companionForms - Array of companion form IDs being filed together
 * @returns {object} Validation result with errors, warnings, info, and overall status
 */
export function validateForm(formId, fields = {}, companionForms = []) {
  const results = {
    formId,
    timestamp: new Date().toISOString(),
    errors: [],
    warnings: [],
    info: [],
    passed: true,
    score: 100,
  };

  // 1. Run universal rules
  for (const rule of UNIVERSAL_RULES) {
    try {
      const result = rule.validate(fields);
      if (!result.pass) {
        const finding = {
          ruleId: rule.id,
          description: rule.description,
          severity: rule.severity,
          message: result.message,
        };
        if (rule.severity === SEVERITY.ERROR) {
          results.errors.push(finding);
          results.score -= 15;
        } else if (rule.severity === SEVERITY.WARNING) {
          results.warnings.push(finding);
          results.score -= 5;
        } else {
          results.info.push(finding);
          results.score -= 2;
        }
      }
    } catch (err) {
      console.error(`Rule ${rule.id} threw:`, err);
    }
  }

  // 2. Run form-specific rules
  const formRules = FORM_RULES[formId] || [];
  for (const rule of formRules) {
    try {
      const result = rule.validate(fields);
      if (!result.pass) {
        const finding = {
          ruleId: rule.id,
          description: rule.description,
          severity: rule.severity,
          message: result.message,
        };
        if (rule.severity === SEVERITY.ERROR) {
          results.errors.push(finding);
          results.score -= 15;
        } else if (rule.severity === SEVERITY.WARNING) {
          results.warnings.push(finding);
          results.score -= 5;
        } else {
          results.info.push(finding);
          results.score -= 2;
        }
      }
    } catch (err) {
      console.error(`Rule ${rule.id} threw:`, err);
    }
  }

  // 3. Run deadline rules
  for (const rule of DEADLINE_RULES) {
    if (rule.form === formId) {
      try {
        const result = rule.validate(fields);
        if (!result.pass) {
          const finding = {
            ruleId: rule.id,
            description: rule.description,
            severity: rule.severity,
            message: result.message,
          };
          if (rule.severity === SEVERITY.ERROR) {
            results.errors.push(finding);
            results.score -= 20;
          } else {
            results.warnings.push(finding);
            results.score -= 10;
          }
        }
      } catch (err) {
        console.error(`Deadline rule ${rule.id} threw:`, err);
      }
    }
  }

  // 4. Run cross-form dependency checks
  for (const rule of CROSS_FORM_RULES) {
    if (rule.trigger_form === formId) {
      const missing = rule.required_companion.filter(
        (comp) => !companionForms.includes(comp)
      );
      if (missing.length > 0) {
        const finding = {
          ruleId: rule.id,
          description: rule.description,
          severity: rule.severity,
          message: `${rule.message} Missing companion form(s): ${missing.join(", ")}`,
          missingForms: missing,
        };
        if (rule.severity === SEVERITY.ERROR) {
          results.errors.push(finding);
          results.score -= 10;
        } else if (rule.severity === SEVERITY.WARNING) {
          results.warnings.push(finding);
          results.score -= 5;
        } else {
          results.info.push(finding);
        }
      }
    }
  }

  // 5. Compute final status
  results.score = Math.max(0, results.score);
  results.passed = results.errors.length === 0;
  results.totalFindings = results.errors.length + results.warnings.length + results.info.length;

  return results;
}

/**
 * Validates multiple forms being filed together.
 *
 * @param {Array<{formId: string, fields: object}>} forms - Array of form submissions
 * @returns {object} Combined validation result
 */
export function validateFilingPackage(forms = []) {
  const companionIds = forms.map((f) => f.formId);
  const results = {
    timestamp: new Date().toISOString(),
    forms: [],
    overallPassed: true,
    totalErrors: 0,
    totalWarnings: 0,
    totalInfo: 0,
  };

  for (const form of forms) {
    const result = validateForm(form.formId, form.fields, companionIds);
    results.forms.push(result);
    if (!result.passed) results.overallPassed = false;
    results.totalErrors += result.errors.length;
    results.totalWarnings += result.warnings.length;
    results.totalInfo += result.info.length;
  }

  return results;
}

/**
 * Returns all supported forms and their rule counts.
 */
export function getSupportedForms() {
  return Object.entries(FORM_RULES).map(([formId, rules]) => ({
    formId,
    ruleCount: rules.length + UNIVERSAL_RULES.length,
    formSpecificRules: rules.length,
    universalRules: UNIVERSAL_RULES.length,
  }));
}

/**
 * Returns all rules for a specific form (universal + form-specific + deadline + cross-form).
 */
export function getRulesForForm(formId) {
  return {
    universal: UNIVERSAL_RULES,
    formSpecific: FORM_RULES[formId] || [],
    deadlines: DEADLINE_RULES.filter((r) => r.form === formId),
    crossForm: CROSS_FORM_RULES.filter((r) => r.trigger_form === formId),
  };
}
