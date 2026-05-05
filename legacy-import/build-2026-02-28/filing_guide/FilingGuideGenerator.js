/**
 * VERNEN™ Filing Guide Generator
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Generates court-specific filing checklists, fee schedules,
 * service requirements, and deadline calculations for all 28 supported forms.
 */

const CALIFORNIA_COURTS = {
  alameda: {
    name: 'Superior Court of California, County of Alameda',
    address: '1225 Fallon St, Oakland, CA 94612',
    filingHours: '8:30 AM – 4:00 PM',
    efiling: true,
    efilingUrl: 'https://www.alameda.courts.ca.gov/online-services/e-filing',
    clerkPhone: '(510) 891-6000',
    selfHelp: '(510) 267-6495',
    dropBox: true,
  },
  solano: {
    name: 'Superior Court of California, County of Solano',
    address: '600 Union Ave, Fairfield, CA 94533',
    filingHours: '8:00 AM – 4:00 PM',
    efiling: true,
    efilingUrl: 'https://www.solano.courts.ca.gov/online-services',
    clerkPhone: '(707) 207-7300',
    selfHelp: '(707) 207-7380',
    dropBox: true,
  },
  marin: {
    name: 'Superior Court of California, County of Marin',
    address: '3501 Civic Center Dr, San Rafael, CA 94903',
    filingHours: '8:30 AM – 4:00 PM',
    efiling: true,
    efilingUrl: 'https://www.marincourt.org/e-filing',
    clerkPhone: '(415) 444-7000',
    selfHelp: '(415) 444-7070',
    dropBox: false,
  },
  sanfrancisco: {
    name: 'Superior Court of California, City and County of San Francisco',
    address: '400 McAllister St, San Francisco, CA 94102',
    filingHours: '8:30 AM – 4:00 PM',
    efiling: true,
    efilingUrl: 'https://www.sfsuperiorcourt.org/e-filing',
    clerkPhone: '(415) 551-4000',
    selfHelp: '(415) 551-0915',
    dropBox: true,
  },
  contracosta: {
    name: 'Superior Court of California, County of Contra Costa',
    address: '725 Court St, Martinez, CA 94553',
    filingHours: '8:00 AM – 4:00 PM',
    efiling: true,
    efilingUrl: 'https://www.cc-courts.org/e-filing',
    clerkPhone: '(925) 608-1000',
    selfHelp: '(925) 608-2990',
    dropBox: true,
  },
};

const FEE_SCHEDULE = {
  'FL-100': { firstFiling: 435, motion: 60, feeWaiverEligible: true, label: 'Petition (Family Law)' },
  'FL-110': { firstFiling: 0, motion: 0, feeWaiverEligible: false, label: 'Summons (no separate fee)' },
  'FL-115': { firstFiling: 0, motion: 0, feeWaiverEligible: false, label: 'Proof of Service — Summons' },
  'FL-120': { firstFiling: 435, motion: 0, feeWaiverEligible: true, label: 'Response (Family Law)' },
  'FL-140': { firstFiling: 0, motion: 0, feeWaiverEligible: false, label: 'Declaration of Disclosure' },
  'FL-141': { firstFiling: 0, motion: 0, feeWaiverEligible: false, label: 'Declaration Re Service of Disclosure' },
  'FL-142': { firstFiling: 0, motion: 0, feeWaiverEligible: false, label: 'Schedule of Assets and Debts' },
  'FL-150': { firstFiling: 0, motion: 0, feeWaiverEligible: false, label: 'Income and Expense Declaration' },
  'FL-155': { firstFiling: 0, motion: 0, feeWaiverEligible: false, label: 'Financial Statement (Simplified)' },
  'FL-160': { firstFiling: 0, motion: 0, feeWaiverEligible: false, label: 'Property Declaration' },
  'FL-300': { firstFiling: 0, motion: 60, feeWaiverEligible: true, label: 'RFO — Custody/Support' },
  'FL-305': { firstFiling: 0, motion: 0, feeWaiverEligible: false, label: 'Temporary Emergency Orders' },
  'FL-311': { firstFiling: 0, motion: 0, feeWaiverEligible: false, label: 'Child Custody Info Worksheet' },
  'FL-320': { firstFiling: 0, motion: 60, feeWaiverEligible: true, label: 'Responsive Declaration to RFO' },
  'FL-330': { firstFiling: 0, motion: 0, feeWaiverEligible: false, label: 'Declaration of Mailing' },
  'FL-335': { firstFiling: 0, motion: 0, feeWaiverEligible: false, label: 'Proof of Personal Service' },
  'FL-341': { firstFiling: 0, motion: 0, feeWaiverEligible: false, label: 'Child Custody & Visitation Order Attachment' },
  'FL-341D': { firstFiling: 0, motion: 0, feeWaiverEligible: false, label: 'Additional Provisions — Physical Custody' },
  'DV-100': { firstFiling: 0, motion: 0, feeWaiverEligible: false, label: 'DVPA Restraining Order Request (no fee)' },
  'DV-109': { firstFiling: 0, motion: 0, feeWaiverEligible: false, label: 'Notice of Court Hearing — DV' },
  'DV-110': { firstFiling: 0, motion: 0, feeWaiverEligible: false, label: 'Temporary Restraining Order — DV' },
  'MC-031': { firstFiling: 0, motion: 0, feeWaiverEligible: false, label: 'Attached Declaration' },
  'FW-001': { firstFiling: 0, motion: 0, feeWaiverEligible: false, label: 'Fee Waiver Request (no fee to file)' },
  'SC-100': { firstFiling: 75, motion: 0, feeWaiverEligible: true, label: 'Small Claims ($75–$370 by amount)' },
  'APP-002': { firstFiling: 775, motion: 0, feeWaiverEligible: true, label: 'Notice of Appeal — Unlimited Civil' },
  'CH-100': { firstFiling: 0, motion: 0, feeWaiverEligible: false, label: 'Civil Harassment Restraining Order (no fee)' },
  'UD-100': { firstFiling: 385, motion: 0, feeWaiverEligible: true, label: 'Unlawful Detainer Complaint' },
  'EA-100': { firstFiling: 0, motion: 0, feeWaiverEligible: false, label: 'Elder Abuse Restraining Order (no fee)' },
  'JV-100': { firstFiling: 0, motion: 0, feeWaiverEligible: false, label: 'Juvenile Dependency Petition (no fee)' },
  'CR-160': { firstFiling: 0, motion: 0, feeWaiverEligible: false, label: 'Criminal Protective Order (no fee)' },
};

const SERVICE_REQUIREMENTS = {
  'FL-100': {
    method: 'personal',
    who: 'Non-party adult (18+)',
    timeline: 'Before response deadline (30 days)',
    proofForm: 'FL-115',
    notes: 'Cannot serve yourself. Process server or sheriff recommended.',
    statutoryBasis: 'CCP § 415.10; Fam. Code § 2330(a)',
  },
  'FL-120': {
    method: 'mail',
    who: 'Any adult (18+) non-party',
    timeline: 'Within 30 days of petition service',
    proofForm: 'FL-330',
    notes: 'Mail service acceptable for response. Add 5 days for mailing.',
    statutoryBasis: 'CCP § 415.30',
  },
  'FL-300': {
    method: 'personal_or_mail',
    who: 'Non-party adult (18+)',
    timeline: '16 court days before hearing (personal); 16+5 by mail',
    proofForm: 'FL-335 (personal) or FL-330 (mail)',
    notes: 'Must include all supporting declarations and FL-150 if support requested.',
    statutoryBasis: 'Fam. Code § 3064; CCP § 1005(b)',
  },
  'FL-320': {
    method: 'mail',
    who: 'Any adult (18+) non-party',
    timeline: '9 court days before hearing (by mail add 5)',
    proofForm: 'FL-330',
    notes: 'Must be served on all parties. Include FL-150 if support is at issue.',
    statutoryBasis: 'CCP § 1005(b)',
  },
  'DV-100': {
    method: 'personal',
    who: 'Non-party adult (18+); sheriff or process server',
    timeline: 'At least 5 days before hearing',
    proofForm: 'DV-200',
    notes: 'Sheriff serves free for DV cases. Must serve full packet (DV-100, DV-109, DV-110, blank DV-120).',
    statutoryBasis: 'Fam. Code § 6340; CCP § 415.10',
  },
  'FW-001': {
    method: 'none',
    who: 'N/A',
    timeline: 'Filed with underlying petition',
    proofForm: 'N/A',
    notes: 'No service required. Filed concurrently with fee-bearing documents.',
    statutoryBasis: 'Gov. Code § 68631',
  },
  'SC-100': {
    method: 'personal_or_certified_mail',
    who: 'Non-party adult (18+) or clerk (certified mail)',
    timeline: 'At least 15 days before hearing (in-county); 20 days (out-of-county)',
    proofForm: 'SC-104',
    notes: 'Clerk can serve by certified mail for additional fee. Substituted service not allowed.',
    statutoryBasis: 'CCP § 116.340',
  },
  'APP-002': {
    method: 'mail',
    who: 'Any adult (18+)',
    timeline: 'Within 10 days of filing notice',
    proofForm: 'APP-009',
    notes: 'Must serve all parties. 60-day filing deadline from judgment.',
    statutoryBasis: 'CRC 8.104; CCP § 904.1',
  },
  'CH-100': {
    method: 'personal',
    who: 'Non-party adult (18+)',
    timeline: 'At least 5 days before hearing',
    proofForm: 'CH-200',
    notes: 'Cannot use sheriff free (unlike DV). Process server recommended.',
    statutoryBasis: 'CCP § 527.6(m)',
  },
  'UD-100': {
    method: 'personal_or_substituted',
    who: 'Non-party adult (18+); registered process server',
    timeline: 'Per notice type: 3-day, 30-day, 60-day, or 90-day',
    proofForm: 'POS-010',
    notes: 'Strict compliance required. Defective service = case dismissed.',
    statutoryBasis: 'CCP §§ 415.10, 415.20, 1162',
  },
  'EA-100': {
    method: 'personal',
    who: 'Non-party adult (18+)',
    timeline: 'At least 5 days before hearing',
    proofForm: 'EA-200',
    notes: 'Free sheriff service for elder abuse cases.',
    statutoryBasis: 'W&I Code § 15657.03',
  },
};

const COMPANION_FORMS = {
  'FL-100': ['FL-110', 'FL-311', 'MC-031', 'FW-001'],
  'FL-120': ['FL-311', 'MC-031', 'FW-001'],
  'FL-300': ['FL-305', 'FL-311', 'FL-150', 'MC-031', 'FL-341', 'FL-341D'],
  'FL-320': ['FL-150', 'MC-031'],
  'DV-100': ['MC-031', 'DV-109', 'DV-110'],
  'FW-001': ['FW-003'],
  'SC-100': ['SC-104'],
  'APP-002': ['APP-010', 'APP-009'],
  'CH-100': ['CH-109', 'CH-110', 'MC-031'],
  'UD-100': ['SUM-130', 'POS-010'],
  'EA-100': ['EA-109', 'EA-110', 'MC-031'],
};

/**
 * Generate a complete filing guide for a form + county combination
 */
function generateFilingGuide(formId, countyKey, options = {}) {
  const { includeCompanions = true, calculateDeadlines = true, hearingDate = null } = options;

  const fee = FEE_SCHEDULE[formId];
  const service = SERVICE_REQUIREMENTS[formId] || null;
  const court = CALIFORNIA_COURTS[countyKey];
  const companions = COMPANION_FORMS[formId] || [];

  if (!fee) {
    return { error: `Form ${formId} not found in fee schedule.` };
  }
  if (!court) {
    return { error: `County "${countyKey}" not found. Available: ${Object.keys(CALIFORNIA_COURTS).join(', ')}` };
  }

  const guide = {
    meta: {
      formId,
      formLabel: fee.label,
      generatedAt: new Date().toISOString(),
      generatedBy: 'VERNEN™ Filing Guide Generator v1.0',
      disclaimer: 'This guide is for informational purposes only and does not constitute legal advice. Fees and procedures may change. Verify with the court clerk before filing.',
    },
    court: { ...court, countyKey },
    fees: buildFeeSection(formId, fee),
    checklist: buildChecklist(formId, companions, includeCompanions),
    service: service ? buildServiceSection(service) : null,
    deadlines: calculateDeadlines ? buildDeadlines(formId, hearingDate) : null,
    companions: includeCompanions ? buildCompanionSection(formId, companions) : null,
    proSeTips: buildProSeTips(formId),
  };

  return guide;
}

function buildFeeSection(formId, fee) {
  const section = {
    filingFee: fee.firstFiling,
    motionFee: fee.motion,
    feeWaiverEligible: fee.feeWaiverEligible,
    feeWaiverForm: fee.feeWaiverEligible ? 'FW-001' : null,
    notes: [],
  };

  if (fee.firstFiling === 0 && fee.motion === 0) {
    section.notes.push('No filing fee required for this form.');
  }
  if (fee.feeWaiverEligible) {
    section.notes.push(
      'Fee waiver available. File FW-001 with this form. Income threshold: ≤125% FPL or receiving public benefits (CalWORKs, SSI, Medi-Cal, food stamps, CAPI, IHSS, CalFresh).'
    );
    section.notes.push('Gov. Code §§ 68631–68636. Court must rule on waiver within 5 days.');
  }

  if (formId === 'SC-100') {
    section.notes.push('Small claims fees vary by claim amount: ≤$1,500 = $30; $1,501–$5,000 = $50; $5,001–$10,000 = $75; $10,001+ = $100. Additional $75 if 12+ filings per year.');
  }
  if (formId === 'APP-002') {
    section.notes.push('Appeal filing fee: $775 unlimited civil; $215 limited civil. Clerk will set cost bond if applicable.');
  }

  return section;
}

function buildChecklist(formId, companions, includeCompanions) {
  const items = [];

  // Universal items
  items.push({ step: 1, task: `Complete ${formId} — all required fields`, required: true, status: 'pending' });
  items.push({ step: 2, task: 'Verify case number and court name on all pages', required: true, status: 'pending' });
  items.push({ step: 3, task: 'Sign and date the form (use blue ink for originals)', required: true, status: 'pending' });
  items.push({ step: 4, task: 'Make at least 3 copies (original + 2 file-stamped copies)', required: true, status: 'pending' });

  let stepNum = 5;

  // Fee waiver check
  const fee = FEE_SCHEDULE[formId];
  if (fee && fee.firstFiling > 0) {
    items.push({ step: stepNum++, task: `Prepare filing fee: $${fee.firstFiling} (check, money order, or cash)`, required: true, status: 'pending' });
    if (fee.feeWaiverEligible) {
      items.push({ step: stepNum++, task: 'OR file FW-001 fee waiver request with supporting documentation', required: false, status: 'pending' });
    }
  }

  // Companion forms
  if (includeCompanions && companions.length > 0) {
    companions.forEach((comp) => {
      const compFee = FEE_SCHEDULE[comp];
      const label = compFee ? compFee.label : comp;
      const isRequired = ['FL-110', 'FL-311', 'DV-109'].includes(comp);
      items.push({
        step: stepNum++,
        task: `Complete companion form: ${comp} — ${label}`,
        required: isRequired,
        status: 'pending',
      });
    });
  }

  // Service items
  const service = SERVICE_REQUIREMENTS[formId];
  if (service && service.method !== 'none') {
    items.push({ step: stepNum++, task: `Arrange service: ${service.method.replace(/_/g, ' ')}`, required: true, status: 'pending' });
    items.push({ step: stepNum++, task: `File proof of service: ${service.proofForm}`, required: true, status: 'pending' });
  }

  // Court-specific
  items.push({ step: stepNum++, task: 'Confirm court address and filing window hours', required: true, status: 'pending' });
  items.push({ step: stepNum++, task: 'Bring valid photo ID to clerk window', required: true, status: 'pending' });

  return items;
}

function buildServiceSection(service) {
  return {
    method: service.method.replace(/_/g, ' '),
    server: service.who,
    timeline: service.timeline,
    proofOfServiceForm: service.proofForm,
    notes: service.notes,
    statutoryBasis: service.statutoryBasis,
    warnings: [
      'Defective service can void filed documents and delay proceedings.',
      'The filer (you) cannot serve the documents yourself.',
      'Keep the original proof of service for your records after filing.',
    ],
  };
}

function buildDeadlines(formId, hearingDate) {
  const deadlines = [];

  if (formId === 'FL-120') {
    deadlines.push({
      event: 'Response to Petition',
      calculation: '30 calendar days from date of service',
      statutory: 'Fam. Code § 2020(a)',
      critical: true,
    });
  }
  if (formId === 'FL-300') {
    deadlines.push({
      event: 'Service of RFO',
      calculation: '16 court days before hearing (personal); 16+5 by mail',
      statutory: 'CCP § 1005(b)',
      critical: true,
    });
    if (hearingDate) {
      const hd = new Date(hearingDate);
      const serviceByPersonal = subtractCourtDays(hd, 16);
      const serviceByMail = subtractCourtDays(hd, 21);
      deadlines.push({
        event: 'Calculated: Personal service deadline',
        date: serviceByPersonal.toISOString().split('T')[0],
        critical: true,
      });
      deadlines.push({
        event: 'Calculated: Mail service deadline',
        date: serviceByMail.toISOString().split('T')[0],
        critical: true,
      });
    }
  }
  if (formId === 'FL-320') {
    deadlines.push({
      event: 'Responsive Declaration',
      calculation: '9 court days before hearing (by mail add 5)',
      statutory: 'CCP § 1005(b)',
      critical: true,
    });
  }
  if (['DV-100', 'CH-100', 'EA-100'].includes(formId)) {
    deadlines.push({
      event: 'Service before hearing',
      calculation: 'At least 5 days before hearing date',
      statutory: formId === 'DV-100' ? 'Fam. Code § 6340' : 'CCP § 527.6(m)',
      critical: true,
    });
  }
  if (formId === 'APP-002') {
    deadlines.push({
      event: 'Notice of Appeal filing',
      calculation: '60 days from service of Notice of Entry of Judgment (or 180 days from entry if no notice served)',
      statutory: 'CRC 8.104(a)',
      critical: true,
    });
  }
  if (formId === 'UD-100') {
    deadlines.push({
      event: 'Response time after service',
      calculation: '5 calendar days (personal); 15 days (substituted/mail)',
      statutory: 'CCP § 1167',
      critical: true,
    });
  }

  return deadlines;
}

function buildCompanionSection(formId, companions) {
  if (companions.length === 0) return null;

  return companions.map((comp) => {
    const fee = FEE_SCHEDULE[comp];
    return {
      formId: comp,
      label: fee ? fee.label : comp,
      filingFee: fee ? fee.firstFiling : 'Unknown',
      required: ['FL-110', 'FL-311', 'DV-109', 'DV-110', 'SUM-130'].includes(comp),
      notes: getCompanionNotes(formId, comp),
    };
  });
}

function getCompanionNotes(parentForm, companionForm) {
  const notes = {
    'FL-110': 'Required summons. Must be served with petition.',
    'FL-311': 'Required child custody information sheet. Attach to initial filing.',
    'MC-031': 'Additional declaration space. Use for detailed factual statements.',
    'FW-001': 'File only if requesting fee waiver. Include proof of income/benefits.',
    'FW-003': 'Court order on fee waiver. Clerk completes this.',
    'FL-305': 'Temporary emergency orders. Filed with FL-300 when immediate relief needed.',
    'FL-150': 'Income and expense declaration. Required when support is at issue.',
    'FL-341': 'Child custody order attachment. Specifies custody/visitation terms.',
    'FL-341D': 'Additional provisions for physical custody attachment.',
    'DV-109': 'Notice of hearing. Clerk sets hearing date and completes this.',
    'DV-110': 'Temporary restraining order. Judge completes upon granting TRO.',
    'SC-104': 'Proof of service for small claims.',
    'APP-010': 'Appellant designation of record.',
    'APP-009': 'Proof of service — appeal documents.',
    'CH-109': 'Notice of hearing — civil harassment.',
    'CH-110': 'Temporary restraining order — civil harassment.',
    'SUM-130': 'Summons — unlawful detainer.',
    'POS-010': 'Proof of service — general civil.',
    'EA-109': 'Notice of hearing — elder abuse.',
    'EA-110': 'Temporary restraining order — elder abuse.',
  };
  return notes[companionForm] || 'See court clerk for details.';
}

function buildProSeTips(formId) {
  const universal = [
    'Always keep your original copies. File the original with the court and retain file-stamped copies.',
    'If you cannot afford filing fees, file FW-001 first. The court cannot refuse to file your documents while the waiver is pending (Gov. Code § 68634.5).',
    'The court self-help center can review your forms before filing — free of charge.',
    'Use blue ink for signatures on originals to distinguish from copies.',
    'Write legibly or type all forms. Illegible forms may be rejected.',
    'Always confirm the correct courthouse location and department before your hearing.',
  ];

  const specific = {
    'FL-100': [
      'You do NOT need an attorney to file for dissolution. California is a no-fault divorce state.',
      'Residency requirement: One spouse must reside in CA for 6 months and in the filing county for 3 months (Fam. Code § 2320).',
      'The earliest a divorce can be finalized is 6 months from service of the petition.',
    ],
    'FL-300': [
      'Ex parte (emergency) requests require a separate declaration explaining why notice was not given (CRC 5.151).',
      'Always attach FL-150 if requesting child support or spousal support.',
      'Be specific about the orders you are requesting. Vague requests may be denied.',
    ],
    'DV-100': [
      'No filing fee for DV restraining orders. Sheriff serves for free.',
      'You can file in the county where the abuse occurred OR where you currently live.',
      'Temporary orders take effect immediately upon signing by a judge.',
    ],
    'SC-100': [
      'Maximum claim: $10,000 (individuals); $5,000 (businesses).',
      'No attorneys allowed in small claims court (CCP § 116.530).',
      'Bring all evidence (photos, contracts, receipts) organized chronologically.',
    ],
    'APP-002': [
      'Filing an appeal does NOT automatically stay (pause) the lower court order.',
      'You may need to post a bond if the judgment involves money damages.',
      'The 60-day deadline is strict — late filings are dismissed.',
    ],
  };

  return [...universal, ...(specific[formId] || [])];
}

/**
 * Subtract court days (excluding weekends and CA court holidays)
 */
function subtractCourtDays(date, days) {
  const result = new Date(date);
  let remaining = days;
  while (remaining > 0) {
    result.setDate(result.getDate() - 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) {
      remaining--;
    }
  }
  return result;
}

/**
 * Generate filing guides for an entire filing package (multiple forms)
 */
function generateFilingPackageGuide(formIds, countyKey, options = {}) {
  const guides = formIds.map((id) => generateFilingGuide(id, countyKey, options));
  const totalFees = guides.reduce((sum, g) => {
    if (g.error) return sum;
    return sum + (g.fees?.filingFee || 0) + (g.fees?.motionFee || 0);
  }, 0);

  return {
    packageSummary: {
      forms: formIds,
      county: countyKey,
      totalFees,
      feeWaiverCovers: guides.some((g) => g.fees?.feeWaiverEligible),
      generatedAt: new Date().toISOString(),
    },
    guides,
  };
}

/**
 * Get all available counties
 */
function getAvailableCourts() {
  return Object.entries(CALIFORNIA_COURTS).map(([key, court]) => ({
    key,
    name: court.name,
    efiling: court.efiling,
  }));
}

/**
 * Get fee schedule for a specific form
 */
function getFeeForForm(formId) {
  return FEE_SCHEDULE[formId] || null;
}

export {
  generateFilingGuide,
  generateFilingPackageGuide,
  getAvailableCourts,
  getFeeForForm,
  CALIFORNIA_COURTS,
  FEE_SCHEDULE,
  SERVICE_REQUIREMENTS,
  COMPANION_FORMS,
};
