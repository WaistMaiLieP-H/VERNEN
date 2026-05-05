/**
 * VERNEN™ Filing Guide Generator
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Generates court-specific filing checklists with fee schedules,
 * service requirements, and procedural deadlines for all 28 supported forms.
 */

const CALIFORNIA_COURTS = {
  alameda: {
    name: "Alameda County Superior Court",
    address: "1225 Fallon Street, Oakland, CA 94612",
    clerkPhone: "(510) 891-6000",
    efiling: true,
    efilingUrl: "https://www.alameda.courts.ca.gov/online-services/e-filing",
    dropBox: true,
    filingHours: "8:30 AM – 4:00 PM",
    selfHelpCenter: true,
    selfHelpPhone: "(510) 267-6495",
  },
  solano: {
    name: "Solano County Superior Court",
    address: "600 Union Avenue, Fairfield, CA 94533",
    clerkPhone: "(707) 207-7300",
    efiling: true,
    efilingUrl: "https://www.solano.courts.ca.gov/divisions/efiling",
    dropBox: false,
    filingHours: "8:00 AM – 4:00 PM",
    selfHelpCenter: true,
    selfHelpPhone: "(707) 207-7380",
  },
  marin: {
    name: "Marin County Superior Court",
    address: "3501 Civic Center Drive, San Rafael, CA 94903",
    clerkPhone: "(415) 444-7020",
    efiling: true,
    efilingUrl: "https://www.marincourt.org/efiling",
    dropBox: false,
    filingHours: "8:30 AM – 4:00 PM",
    selfHelpCenter: true,
    selfHelpPhone: "(415) 444-7070",
  },
  sanfrancisco: {
    name: "San Francisco County Superior Court",
    address: "400 McAllister Street, San Francisco, CA 94102",
    clerkPhone: "(415) 551-4000",
    efiling: true,
    efilingUrl: "https://www.sfsuperiorcourt.org/online-services/e-filing",
    dropBox: true,
    filingHours: "8:30 AM – 4:00 PM",
    selfHelpCenter: true,
    selfHelpPhone: "(415) 551-0308",
  },
  contracosta: {
    name: "Contra Costa County Superior Court",
    address: "725 Court Street, Martinez, CA 94553",
    clerkPhone: "(925) 608-1000",
    efiling: true,
    efilingUrl: "https://www.cc-courts.org/efiling",
    dropBox: false,
    filingHours: "8:00 AM – 4:00 PM",
    selfHelpCenter: true,
    selfHelpPhone: "(925) 608-2990",
  },
};


const FEE_SCHEDULE = {
  family_petition: { base: 435, feeWaiverEligible: true, statute: "GC § 70670" },
  family_response: { base: 435, feeWaiverEligible: true, statute: "GC § 70670" },
  family_motion: { base: 60, feeWaiverEligible: true, statute: "GC § 70617" },
  family_rfo: { base: 60, feeWaiverEligible: true, statute: "GC § 70617" },
  dv_restraining: { base: 0, feeWaiverEligible: false, statute: "FC § 6222" },
  fee_waiver: { base: 0, feeWaiverEligible: false, statute: "GC § 68631" },
  small_claims: { base: 75, feeWaiverEligible: true, statute: "GC § 70621.5", note: "Under $5,000; $100 for $5,001-$10,000" },
  civil_appeal: { base: 775, feeWaiverEligible: true, statute: "GC § 70612" },
  civil_harassment: { base: 435, feeWaiverEligible: true, statute: "CCP § 527.6" },
  unlawful_detainer: { base: 435, feeWaiverEligible: true, statute: "GC § 70613" },
  elder_abuse: { base: 0, feeWaiverEligible: false, statute: "WIC § 15657.03" },
  juvenile: { base: 0, feeWaiverEligible: false, statute: "WIC § 300" },
  criminal_restitution: { base: 0, feeWaiverEligible: false, statute: "PC § 1202.4" },
};

const SERVICE_REQUIREMENTS = {
  "FL-100": {
    method: "personal_service",
    description: "Personal service by non-party adult (18+)",
    statute: "CCP § 415.10; FC § 2330",
    responseDeadline: 30,
    proofForm: "FL-115",
    alternatives: ["substituted_service", "service_by_mail_acknowledgment", "publication"],
    notes: "Cannot serve yourself. Must use someone 18+ who is not a party to the case.",
  },
  "FL-300": {
    method: "personal_or_mail",
    description: "Personal service OR mail service (16 court days + 5 mailing)",
    statute: "CCP § 1005(b); FC § 215",
    responseDeadline: 16,
    proofForm: "FL-330",
    alternatives: ["personal_service"],
    notes: "If served by mail, add 5 calendar days. Must be served minimum 16 court days before hearing.",
  },
  "DV-100": {
    method: "personal_service",
    description: "Personal service required for DV restraining orders",
    statute: "FC § 6340; CCP § 415.10",
    responseDeadline: 5,
    proofForm: "DV-200",
    alternatives: [],
    notes: "Must be personally served before hearing. Law enforcement may assist with service.",
  },
  "FW-001": {
    method: "none_required",
    description: "No service required for fee waiver application",
    statute: "GC § 68631(a)",
    responseDeadline: null,
    proofForm: null,
    alternatives: [],
    notes: "File with clerk. No service on opposing party needed.",
  },
  "SC-100": {
    method: "personal_or_substituted_or_mail",
    description: "Personal, substituted, or certified mail service",
    statute: "CCP § 116.340",
    responseDeadline: 15,
    proofForm: "SC-104",
    alternatives: ["substituted_service", "certified_mail"],
    notes: "Must be served at least 15 days before hearing (20 if outside county).",
  },
  "APP-002": {
    method: "mail_service",
    description: "Service by mail on all parties",
    statute: "CRC 8.823; CCP § 1013a",
    responseDeadline: 30,
    proofForm: "APP-009",
    alternatives: [],
    notes: "Must file notice of appeal within 30 days of clerk's mailing of judgment.",
  },
  "CH-100": {
    method: "personal_service",
    description: "Personal service required for civil harassment restraining orders",
    statute: "CCP § 527.6(m)",
    responseDeadline: 5,
    proofForm: "CH-200",
    alternatives: [],
    notes: "Must be personally served before hearing date.",
  },
  "UD-100": {
    method: "personal_or_substituted",
    description: "Personal or substituted service on tenant",
    statute: "CCP § 415.10, § 415.20",
    responseDeadline: 5,
    proofForm: "POS-010",
    alternatives: ["posting_and_mailing"],
    notes: "5 calendar days to respond (15 if substituted service).",
  },
  "EA-100": {
    method: "personal_service",
    description: "Personal service required for elder abuse restraining orders",
    statute: "WIC § 15657.03",
    responseDeadline: 5,
    proofForm: "EA-200",
    alternatives: [],
    notes: "Must be personally served before hearing.",
  },
};

const COMPANION_FORMS = {
  "FL-100": ["FL-110", "FL-115", "FL-105", "FW-001"],
  "FL-300": ["FL-305", "FL-320", "FL-150", "MC-031"],
  "FL-150": ["FL-142", "FL-160"],
  "DV-100": ["DV-109", "DV-110", "DV-200", "CLETS-001"],
  "FW-001": ["FW-003"],
  "SC-100": ["SC-104"],
  "APP-002": ["APP-010", "APP-009"],
  "CH-100": ["CH-110", "CH-200"],
  "UD-100": ["UD-101", "UD-105", "POS-010"],
  "EA-100": ["EA-110", "EA-200"],
  "JV-100": ["JV-101", "JV-110"],
  "CR-160": [],
  "FL-341": ["FL-300", "FL-305", "MC-031"],
  "FL-341D": ["FL-300", "FL-305"],
};

const FILING_STEPS_TEMPLATE = [
  { step: 1, action: "complete_forms", label: "Complete All Required Forms", icon: "📝" },
  { step: 2, action: "validate_forms", label: "Run VERNEN™ Validation Check", icon: "✅" },
  { step: 3, action: "make_copies", label: "Make Required Copies", copies: "Original + 2 copies (1 for court, 1 for each party)", icon: "📄" },
  { step: 4, action: "check_fee_waiver", label: "Check Fee Waiver Status or Prepare Filing Fee", icon: "💰" },
  { step: 5, action: "file_with_clerk", label: "File with Court Clerk", icon: "🏛️" },
  { step: 6, action: "obtain_hearing_date", label: "Obtain Hearing Date (if applicable)", icon: "📅" },
  { step: 7, action: "serve_papers", label: "Serve All Parties", icon: "📬" },
  { step: 8, action: "file_proof_of_service", label: "File Proof of Service", icon: "📋" },
  { step: 9, action: "prepare_for_hearing", label: "Prepare for Hearing", icon: "⚖️" },
  { step: 10, action: "attend_hearing", label: "Attend Hearing", icon: "🏛️" },
];

/**
 * Core generation function — produces a complete filing guide
 * for any supported form + county combination.
 */
function generateFilingGuide(formId, countyKey, options = {}) {
  const { language = "en", includeFeeWaiver = false, isEmergency = false } = options;

  const court = CALIFORNIA_COURTS[countyKey];
  if (!court) {
    return { error: true, message: `Unsupported county: ${countyKey}. Supported: ${Object.keys(CALIFORNIA_COURTS).join(", ")}` };
  }

  const serviceReqs = SERVICE_REQUIREMENTS[formId] || null;
  const companions = COMPANION_FORMS[formId] || [];
  const feeCategory = resolveFeeCategory(formId);
  const fee = FEE_SCHEDULE[feeCategory] || null;

  const guide = {
    meta: {
      formId,
      county: countyKey,
      courtName: court.name,
      generatedAt: new Date().toISOString(),
      language,
      version: "1.0.0",
      generator: "VERNEN™ Filing Guide Generator",
      copyright: "© 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.",
    },
    court: {
      ...court,
      efilingAvailable: court.efiling,
      filingMethod: court.efiling ? "E-filing or in-person" : "In-person only",
    },
    fees: fee
      ? {
          amount: includeFeeWaiver ? 0 : fee.base,
          feeWaiverApplied: includeFeeWaiver,
          feeWaiverForm: includeFeeWaiver ? "FW-001" : null,
          statute: fee.statute,
          note: fee.note || null,
        }
      : { amount: 0, note: "No filing fee required" },
    service: serviceReqs
      ? {
          method: serviceReqs.method,
          description: serviceReqs.description,
          statute: serviceReqs.statute,
          responseDeadline: serviceReqs.responseDeadline,
          proofOfServiceForm: serviceReqs.proofForm,
          alternatives: serviceReqs.alternatives,
          notes: serviceReqs.notes,
        }
      : { method: "check_local_rules", description: "Consult local court rules for service requirements" },
    companionForms: companions.map((id) => ({
      formId: id,
      required: isCompanionRequired(formId, id),
      description: getFormDescription(id),
    })),
    filingSteps: buildFilingSteps(formId, court, fee, serviceReqs, isEmergency),
    deadlines: buildDeadlines(formId, serviceReqs, isEmergency),
    proSeTips: getProSeTips(formId),
    emergencyInfo: isEmergency ? getEmergencyProcedures(formId, court) : null,
  };

  return guide;
}

function resolveFeeCategory(formId) {
  const map = {
    "FL-100": "family_petition", "FL-120": "family_response",
    "FL-300": "family_rfo", "FL-305": "family_motion",
    "FL-150": "family_motion", "FL-341": "family_motion",
    "FL-341D": "family_motion",
    "DV-100": "dv_restraining", "FW-001": "fee_waiver",
    "SC-100": "small_claims", "APP-002": "civil_appeal",
    "CH-100": "civil_harassment", "UD-100": "unlawful_detainer",
    "EA-100": "elder_abuse", "JV-100": "juvenile",
    "CR-160": "criminal_restitution",
  };
  return map[formId] || "family_motion";
}

function isCompanionRequired(primaryForm, companionForm) {
  const required = {
    "FL-100": ["FL-110"],
    "FL-300": ["FL-305"],
    "DV-100": ["DV-109", "DV-110"],
    "UD-100": ["UD-101"],
  };
  return (required[primaryForm] || []).includes(companionForm);
}

function getFormDescription(formId) {
  const descriptions = {
    "FL-100": "Petition—Marriage/Domestic Partnership",
    "FL-105": "Declaration Under UCCJEA",
    "FL-110": "Summons (Family Law)",
    "FL-115": "Proof of Service of Summons",
    "FL-120": "Response—Marriage/Domestic Partnership",
    "FL-142": "Schedule of Assets and Debts",
    "FL-150": "Income and Expense Declaration",
    "FL-160": "Property Declaration",
    "FL-300": "Request for Order",
    "FL-305": "Temporary Emergency Court Orders",
    "FL-310": "Application for Order and Supporting Declaration",
    "FL-320": "Responsive Declaration to Request for Order",
    "FL-330": "Proof of Personal Service",
    "FL-335": "Proof of Service by Mail",
    "FL-341": "Child Custody and Visitation Attachment",
    "FL-341D": "Additional Provisions—Physical Custody Attachment",
    "DV-100": "Request for Domestic Violence Restraining Order",
    "DV-109": "Notice of Court Hearing (DVRO)",
    "DV-110": "Temporary Restraining Order (DVRO)",
    "DV-200": "Proof of Service—DVRO",
    "CLETS-001": "Confidential CLETS Information",
    "FW-001": "Request to Waive Court Fees",
    "FW-003": "Order on Court Fee Waiver",
    "SC-100": "Plaintiff's Claim and ORDER to Go to Small Claims Court",
    "SC-104": "Proof of Service—Small Claims",
    "APP-002": "Appellant's Notice of Appeal",
    "APP-009": "Proof of Service—Civil Appeal",
    "APP-010": "Respondent's Brief—Civil Appeal",
    "CH-100": "Request for Civil Harassment Restraining Orders",
    "CH-110": "Temporary Restraining Order (Civil Harassment)",
    "CH-200": "Proof of Service—Civil Harassment",
    "UD-100": "Complaint—Unlawful Detainer",
    "UD-101": "Cover Sheet—Unlawful Detainer",
    "UD-105": "Answer—Unlawful Detainer",
    "POS-010": "Proof of Service of Summons",
    "EA-100": "Request for Elder Abuse Restraining Orders",
    "EA-110": "Temporary Restraining Order (Elder Abuse)",
    "EA-200": "Proof of Service—Elder Abuse",
    "JV-100": "Petition to Declare Minor a Dependent",
    "JV-101": "Additional Children Attachment",
    "JV-110": "Petition for Hearing—Juvenile",
    "MC-031": "Attached Declaration",
    "CR-160": "Criminal Protective Order—Other Than DV",
  };
  return descriptions[formId] || `Form ${formId}`;
}

function buildFilingSteps(formId, court, fee, serviceReqs, isEmergency) {
  const steps = [...FILING_STEPS_TEMPLATE];

  if (isEmergency) {
    steps.unshift({
      step: 0,
      action: "emergency_ex_parte",
      label: "⚠️ EMERGENCY: File Ex Parte Application First",
      icon: "🚨",
      details: "For emergency orders, file ex parte application with declaration of emergency. Court may hear same day or next business day.",
      statute: "CRC 5.151; FC § 3064",
    });
  }

  if (fee && fee.base === 0) {
    steps.splice(
      steps.findIndex((s) => s.action === "check_fee_waiver"),
      1,
      { step: 4, action: "no_fee", label: "No Filing Fee Required", icon: "✅", details: `Statutory exemption: ${fee.statute}` }
    );
  }

  if (!serviceReqs || serviceReqs.method === "none_required") {
    const serviceIdx = steps.findIndex((s) => s.action === "serve_papers");
    if (serviceIdx > -1) steps.splice(serviceIdx, 2);
  }

  if (court.efiling) {
    const fileIdx = steps.findIndex((s) => s.action === "file_with_clerk");
    if (fileIdx > -1) {
      steps[fileIdx] = {
        ...steps[fileIdx],
        label: "File with Court (E-filing or In-Person)",
        details: `E-filing available: ${court.efilingUrl}`,
      };
    }
  }

  return steps.map((s, i) => ({ ...s, step: i + 1 }));
}

function buildDeadlines(formId, serviceReqs, isEmergency) {
  const deadlines = [];

  if (serviceReqs && serviceReqs.responseDeadline) {
    deadlines.push({
      type: "service",
      description: `Serve opposing party within required timeframe`,
      days: serviceReqs.responseDeadline,
      calendarType: formId.startsWith("FL-3") ? "court_days" : "calendar_days",
      statute: serviceReqs.statute,
    });
  }

  if (isEmergency) {
    deadlines.push({
      type: "emergency",
      description: "File ex parte application — court may hear same day",
      days: 0,
      calendarType: "immediate",
      statute: "CRC 5.151",
    });
  }

  const formDeadlines = {
    "FL-100": [{ type: "response", description: "Respondent has 30 days to respond after service", days: 30, calendarType: "calendar_days", statute: "FC § 2320(a)" }],
    "FL-300": [
      { type: "hearing", description: "Hearing typically set 20-25 days from filing", days: 25, calendarType: "calendar_days", statute: "FC § 215(a)" },
      { type: "responsive", description: "Responsive declaration due 9 court days before hearing", days: 9, calendarType: "court_days", statute: "CRC 5.92(a)" },
    ],
    "DV-100": [
      { type: "hearing", description: "Court must set hearing within 21-25 days", days: 25, calendarType: "calendar_days", statute: "FC § 6326" },
      { type: "tro_ruling", description: "TRO may issue same day or next business day", days: 1, calendarType: "business_days", statute: "FC § 6320" },
    ],
    "SC-100": [{ type: "hearing", description: "Hearing set 30-70 days from filing", days: 70, calendarType: "calendar_days", statute: "CCP § 116.330" }],
    "APP-002": [{ type: "filing", description: "Notice of appeal must be filed within 30 days of judgment", days: 30, calendarType: "calendar_days", statute: "CRC 8.822" }],
    "UD-100": [{ type: "response", description: "Tenant has 5 days to respond", days: 5, calendarType: "calendar_days", statute: "CCP § 1167" }],
  };

  if (formDeadlines[formId]) {
    deadlines.push(...formDeadlines[formId]);
  }

  return deadlines;
}

function getProSeTips(formId) {
  const universal = [
    "Always keep copies of everything you file.",
    "Write clearly in black ink if filing paper forms.",
    "Check local court rules — they supplement statewide rules.",
    "If you cannot afford the filing fee, file FW-001 (Fee Waiver) before or with your forms.",
    "The court self-help center can review your forms before filing — free of charge.",
    "Arrive early on hearing days. Dress professionally. Address the judge as 'Your Honor.'",
  ];

  const formSpecific = {
    "FL-100": [
      "You MUST include FL-110 (Summons) when filing the Petition.",
      "The UCCJEA declaration (FL-105) is required if children are involved.",
      "The 6-month residency requirement must be met before filing (FC § 2320).",
      "Community property characterization begins at date of marriage and ends at date of separation.",
    ],
    "FL-300": [
      "Include a detailed declaration (MC-031) explaining WHY you need the requested orders.",
      "Be specific about what orders you want — vague requests get denied.",
      "Attach your Income & Expense Declaration (FL-150) if requesting support.",
      "You need a current FL-150 (within 90 days) for any financial orders.",
    ],
    "DV-100": [
      "You can get a Temporary Restraining Order (TRO) the same day you file.",
      "Describe ALL incidents of abuse — the court needs a complete picture.",
      "Include dates, locations, and any witnesses for each incident.",
      "Law enforcement can serve the restrained person if you cannot arrange service.",
      "The DVRO can include child custody and support orders.",
    ],
    "FW-001": [
      "You qualify if you receive public benefits (CalWORKs, SSI, SNAP, Medi-Cal) or your income is below 125% FPL.",
      "The court CANNOT deny your fee waiver just because you have a job.",
      "If denied, you have 10 days to request a hearing on the denial.",
    ],
    "SC-100": [
      "Maximum claim amount: $10,000 for individuals.",
      "No attorneys allowed in small claims court.",
      "Bring ALL evidence to the hearing — you get one chance.",
    ],
  };

  return {
    universal,
    formSpecific: formSpecific[formId] || [],
  };
}

function getEmergencyProcedures(formId, court) {
  return {
    title: "EMERGENCY FILING PROCEDURES",
    warning: "Emergency/Ex Parte filings require showing of immediate harm or irreparable injury.",
    steps: [
      "Contact the clerk's office FIRST to confirm ex parte hearing availability.",
      "Prepare a Declaration of Emergency (MC-031) detailing the imminent risk.",
      "Give notice to opposing party if possible (even same-day phone/text notice).",
      "CRC 5.151 requires notice or good cause for why notice was not given.",
      "File all forms plus the ex parte application before the hearing.",
      "Be prepared for the judge to set a shortened hearing date instead of ruling immediately.",
    ],
    courtPhone: court.clerkPhone,
    statute: "CRC 5.151; FC § 3064",
    dvSpecific: formId === "DV-100" || formId === "EA-100"
      ? "DV and Elder Abuse TROs may be granted WITHOUT notice to restrained person."
      : null,
  };
}

/**
 * Batch generate guides for multiple forms
 */
function generateFilingPackageGuide(formIds, countyKey, options = {}) {
  const guides = formIds.map((id) => generateFilingGuide(id, countyKey, options));
  const allCompanions = new Set();
  guides.forEach((g) => {
    if (g.companionForms) {
      g.companionForms.forEach((c) => allCompanions.add(c.formId));
    }
  });

  return {
    packageSummary: {
      primaryForms: formIds,
      companionForms: [...allCompanions],
      county: countyKey,
      totalForms: formIds.length + allCompanions.size,
      totalFees: guides.reduce((sum, g) => sum + (g.fees?.amount || 0), 0),
    },
    guides,
  };
}

/**
 * Get supported courts list
 */
function getSupportedCourts() {
  return Object.entries(CALIFORNIA_COURTS).map(([key, court]) => ({
    key,
    name: court.name,
    efiling: court.efiling,
    selfHelpCenter: court.selfHelpCenter,
  }));
}

/**
 * Get fee estimate for a form
 */
function getFeeEstimate(formId, includeFeeWaiver = false) {
  const category = resolveFeeCategory(formId);
  const fee = FEE_SCHEDULE[category];
  if (!fee) return { amount: 0, note: "No fee information available" };
  return {
    formId,
    amount: includeFeeWaiver ? 0 : fee.base,
    feeWaiverEligible: fee.feeWaiverEligible,
    statute: fee.statute,
    note: fee.note || null,
  };
}

// ==================== EXPORTS ====================
module.exports = {
  generateFilingGuide,
  generateFilingPackageGuide,
  getSupportedCourts,
  getFeeEstimate,
  getFormDescription,
  CALIFORNIA_COURTS,
  FEE_SCHEDULE,
  SERVICE_REQUIREMENTS,
  COMPANION_FORMS,
};
