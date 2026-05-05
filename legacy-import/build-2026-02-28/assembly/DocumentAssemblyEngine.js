/**
 * VERNEN™ Document Assembly Engine
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Generates pre-filled form packages with cross-form data propagation,
 * party information management, and smart field mapping across all 28
 * supported California Judicial Council forms.
 */

// ─── PARTY PROFILE ──────────────────────────────────────────
class PartyProfile {
  constructor(role = 'petitioner') {
    this.role = role; // petitioner, respondent, child, attorney
    this.fields = {
      fullName: '',
      firstName: '',
      middleName: '',
      lastName: '',
      dateOfBirth: '',
      address: { street: '', city: '', state: 'CA', zip: '' },
      mailingAddress: null, // if different from physical
      phone: '',
      email: '',
      driverLicense: '',
      ssn_last4: '',
      employer: '',
      occupation: '',
      monthlyIncome: 0,
      attorney: null, // { name, barNumber, firm, phone, address }
      inProPer: true,
    };
  }

  set(field, value) {
    const keys = field.split('.');
    let target = this.fields;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]]) target[keys[i]] = {};
      target = target[keys[i]];
    }
    target[keys[keys.length - 1]] = value;
    return this;
  }

  get(field) {
    return field.split('.').reduce((obj, key) => obj?.[key], this.fields);
  }

  getFormattedAddress(type = 'address') {
    const addr = type === 'mailing' && this.fields.mailingAddress ? this.fields.mailingAddress : this.fields.address;
    if (!addr.street) return '';
    return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`;
  }

  getFormattedName() {
    return [this.fields.firstName, this.fields.middleName, this.fields.lastName].filter(Boolean).join(' ');
  }

  validate() {
    const errors = [];
    if (!this.fields.fullName && !this.fields.firstName) errors.push('Name is required');
    if (!this.fields.address?.street) errors.push('Address is required');
    if (!this.fields.address?.city) errors.push('City is required');
    if (!this.fields.address?.zip) errors.push('ZIP code is required');
    return { valid: errors.length === 0, errors };
  }

  export() {
    return JSON.parse(JSON.stringify(this.fields));
  }
}

// ─── CASE CONTEXT ───────────────────────────────────────────
class CaseContext {
  constructor() {
    this.caseNumber = '';
    this.courtName = '';
    this.courtCounty = '';
    this.courtAddress = '';
    this.department = '';
    this.filingDate = '';
    this.hearingDate = '';
    this.hearingTime = '';
    this.hearingDepartment = '';
    this.caseType = ''; // dissolution, custody, dv, etc.
    this.parties = {
      petitioner: new PartyProfile('petitioner'),
      respondent: new PartyProfile('respondent'),
      children: [],
    };
    this.metadata = {
      marriageDate: '',
      separationDate: '',
      minorChildren: false,
      propertyToDispose: false,
      spousalSupport: false,
      childSupport: false,
    };
  }

  addChild(childData) {
    const child = new PartyProfile('child');
    Object.entries(childData).forEach(([k, v]) => child.set(k, v));
    this.parties.children.push(child);
    this.metadata.minorChildren = true;
    return this;
  }

  export() {
    return {
      caseNumber: this.caseNumber,
      courtName: this.courtName,
      courtCounty: this.courtCounty,
      courtAddress: this.courtAddress,
      department: this.department,
      filingDate: this.filingDate,
      hearingDate: this.hearingDate,
      hearingTime: this.hearingTime,
      hearingDepartment: this.hearingDepartment,
      caseType: this.caseType,
      petitioner: this.parties.petitioner.export(),
      respondent: this.parties.respondent.export(),
      children: this.parties.children.map((c) => c.export()),
      metadata: { ...this.metadata },
    };
  }
}

// ─── FIELD MAPS ─────────────────────────────────────────────
// Maps case context paths to form field IDs for each form

const FIELD_MAPS = {
  'FL-100': {
    'case_number': 'caseNumber',
    'court_name': 'courtName',
    'court_county': 'courtCounty',
    'court_address': 'courtAddress',
    'petitioner_name': (ctx) => ctx.parties.petitioner.getFormattedName(),
    'respondent_name': (ctx) => ctx.parties.respondent.getFormattedName(),
    'petitioner_address': (ctx) => ctx.parties.petitioner.getFormattedAddress(),
    'respondent_address': (ctx) => ctx.parties.respondent.getFormattedAddress(),
    'petitioner_phone': 'parties.petitioner.fields.phone',
    'petitioner_email': 'parties.petitioner.fields.email',
    'petitioner_attorney': (ctx) => ctx.parties.petitioner.fields.inProPer ? 'In Pro Per' : ctx.parties.petitioner.fields.attorney?.name || '',
    'petitioner_bar_number': 'parties.petitioner.fields.attorney.barNumber',
    'marriage_date': 'metadata.marriageDate',
    'separation_date': 'metadata.separationDate',
    'minor_children': 'metadata.minorChildren',
    'spousal_support': 'metadata.spousalSupport',
    'child_support': 'metadata.childSupport',
    'property': 'metadata.propertyToDispose',
  },
  'FL-110': {
    'case_number': 'caseNumber',
    'court_name': 'courtName',
    'court_address': 'courtAddress',
    'petitioner_name': (ctx) => ctx.parties.petitioner.getFormattedName(),
    'respondent_name': (ctx) => ctx.parties.respondent.getFormattedName(),
  },
  'FL-300': {
    'case_number': 'caseNumber',
    'court_name': 'courtName',
    'court_county': 'courtCounty',
    'petitioner_name': (ctx) => ctx.parties.petitioner.getFormattedName(),
    'respondent_name': (ctx) => ctx.parties.respondent.getFormattedName(),
    'petitioner_address': (ctx) => ctx.parties.petitioner.getFormattedAddress(),
    'hearing_date': 'hearingDate',
    'hearing_time': 'hearingTime',
    'hearing_dept': 'hearingDepartment',
    'minor_children': 'metadata.minorChildren',
  },
  'FL-150': {
    'case_number': 'caseNumber',
    'court_name': 'courtName',
    'party_name': (ctx) => ctx.parties.petitioner.getFormattedName(),
    'employer': 'parties.petitioner.fields.employer',
    'occupation': 'parties.petitioner.fields.occupation',
    'monthly_income': 'parties.petitioner.fields.monthlyIncome',
    'address': (ctx) => ctx.parties.petitioner.getFormattedAddress(),
  },
  'FL-311': {
    'case_number': 'caseNumber',
    'petitioner_name': (ctx) => ctx.parties.petitioner.getFormattedName(),
    'respondent_name': (ctx) => ctx.parties.respondent.getFormattedName(),
    'children': (ctx) => ctx.parties.children.map((c) => ({
      name: c.getFormattedName(),
      dob: c.get('dateOfBirth'),
    })),
  },
  'DV-100': {
    'case_number': 'caseNumber',
    'court_name': 'courtName',
    'court_county': 'courtCounty',
    'protected_person': (ctx) => ctx.parties.petitioner.getFormattedName(),
    'restrained_person': (ctx) => ctx.parties.respondent.getFormattedName(),
    'protected_address': (ctx) => ctx.parties.petitioner.getFormattedAddress(),
    'protected_phone': 'parties.petitioner.fields.phone',
  },
  'FW-001': {
    'case_number': 'caseNumber',
    'court_name': 'courtName',
    'applicant_name': (ctx) => ctx.parties.petitioner.getFormattedName(),
    'applicant_address': (ctx) => ctx.parties.petitioner.getFormattedAddress(),
    'applicant_phone': 'parties.petitioner.fields.phone',
    'monthly_income': 'parties.petitioner.fields.monthlyIncome',
  },
  'MC-031': {
    'case_number': 'caseNumber',
    'declarant_name': (ctx) => ctx.parties.petitioner.getFormattedName(),
  },
  'FL-335': {
    'case_number': 'caseNumber',
    'court_name': 'courtName',
    'petitioner_name': (ctx) => ctx.parties.petitioner.getFormattedName(),
    'respondent_name': (ctx) => ctx.parties.respondent.getFormattedName(),
  },
  'FL-330': {
    'case_number': 'caseNumber',
    'court_name': 'courtName',
    'petitioner_name': (ctx) => ctx.parties.petitioner.getFormattedName(),
    'respondent_name': (ctx) => ctx.parties.respondent.getFormattedName(),
  },
};

// ─── DOCUMENT ASSEMBLY ENGINE ───────────────────────────────
class DocumentAssemblyEngine {
  constructor() {
    this.context = new CaseContext();
    this.assembledForms = new Map();
    this.assemblyLog = [];
  }

  setContext(caseContext) {
    if (caseContext instanceof CaseContext) {
      this.context = caseContext;
    } else {
      // Build from plain object
      Object.assign(this.context, caseContext);
    }
    return this;
  }

  /**
   * Assemble a single form using the current case context
   */
  assembleForm(formId, overrides = {}) {
    const fieldMap = FIELD_MAPS[formId];
    if (!fieldMap) {
      this.log(formId, 'warn', `No field map defined for ${formId}. Using overrides only.`);
      this.assembledForms.set(formId, { ...overrides });
      return { formId, fields: { ...overrides }, warnings: [`No field map for ${formId}`] };
    }

    const fields = {};
    const warnings = [];

    for (const [fieldId, mapping] of Object.entries(fieldMap)) {
      try {
        let value;
        if (typeof mapping === 'function') {
          value = mapping(this.context);
        } else {
          value = this.resolveContextPath(mapping);
        }

        if (value !== undefined && value !== null && value !== '') {
          fields[fieldId] = value;
        } else {
          warnings.push(`Field "${fieldId}" resolved to empty value.`);
        }
      } catch (err) {
        warnings.push(`Error mapping field "${fieldId}": ${err.message}`);
      }
    }

    // Apply overrides
    Object.assign(fields, overrides);

    this.assembledForms.set(formId, fields);
    this.log(formId, 'info', `Assembled ${Object.keys(fields).length} fields, ${warnings.length} warnings`);

    return { formId, fields, warnings };
  }

  /**
   * Assemble a full filing package (multiple related forms)
   */
  assemblePackage(formIds, overrides = {}) {
    const results = [];

    for (const formId of formIds) {
      const formOverrides = overrides[formId] || {};
      const result = this.assembleForm(formId, formOverrides);
      results.push(result);
    }

    // Cross-form consistency check
    const consistencyIssues = this.checkCrossFormConsistency(formIds);

    return {
      packageId: `PKG-${Date.now().toString(36)}`,
      generatedAt: new Date().toISOString(),
      context: this.context.export(),
      forms: results,
      consistencyIssues,
      totalFields: results.reduce((sum, r) => sum + Object.keys(r.fields).length, 0),
      totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
    };
  }

  /**
   * Assemble common filing packages by case type
   */
  assembleByType(caseType, overrides = {}) {
    const PACKAGES = {
      dissolution: ['FL-100', 'FL-110', 'FL-311', 'FL-140', 'FL-150', 'MC-031'],
      dissolution_with_waiver: ['FL-100', 'FL-110', 'FL-311', 'FL-140', 'FL-150', 'FW-001', 'MC-031'],
      custody_rfo: ['FL-300', 'FL-311', 'FL-150', 'MC-031', 'FL-335'],
      custody_response: ['FL-320', 'FL-150', 'MC-031', 'FL-330'],
      dvro: ['DV-100', 'MC-031'],
      small_claims: ['SC-100'],
      appeal: ['APP-002'],
      civil_harassment: ['CH-100', 'MC-031'],
      elder_abuse: ['EA-100', 'MC-031'],
    };

    const formIds = PACKAGES[caseType];
    if (!formIds) {
      return { error: `Unknown case type "${caseType}". Available: ${Object.keys(PACKAGES).join(', ')}` };
    }

    this.log('PACKAGE', 'info', `Assembling ${caseType} package: ${formIds.join(', ')}`);
    return this.assemblePackage(formIds, overrides);
  }

  /**
   * Check data consistency across assembled forms
   */
  checkCrossFormConsistency(formIds) {
    const issues = [];
    const forms = new Map();

    for (const id of formIds) {
      const data = this.assembledForms.get(id);
      if (data) forms.set(id, data);
    }

    // Check case number consistency
    const caseNumbers = new Set();
    for (const [id, data] of forms) {
      if (data.case_number) caseNumbers.add(data.case_number);
    }
    if (caseNumbers.size > 1) {
      issues.push({ type: 'INCONSISTENCY', field: 'case_number', message: `Multiple case numbers found: ${[...caseNumbers].join(', ')}`, severity: 'error' });
    }

    // Check party name consistency
    const petNames = new Set();
    const respNames = new Set();
    for (const [id, data] of forms) {
      if (data.petitioner_name) petNames.add(data.petitioner_name);
      if (data.protected_person) petNames.add(data.protected_person);
      if (data.applicant_name) petNames.add(data.applicant_name);
      if (data.respondent_name) respNames.add(data.respondent_name);
      if (data.restrained_person) respNames.add(data.restrained_person);
    }
    if (petNames.size > 1) {
      issues.push({ type: 'INCONSISTENCY', field: 'petitioner_name', message: `Petitioner name varies: ${[...petNames].join(' vs ')}`, severity: 'warning' });
    }
    if (respNames.size > 1) {
      issues.push({ type: 'INCONSISTENCY', field: 'respondent_name', message: `Respondent name varies: ${[...respNames].join(' vs ')}`, severity: 'warning' });
    }

    // Check court consistency
    const courts = new Set();
    for (const [id, data] of forms) {
      if (data.court_name) courts.add(data.court_name);
    }
    if (courts.size > 1) {
      issues.push({ type: 'INCONSISTENCY', field: 'court_name', message: `Multiple courts: ${[...courts].join(' vs ')}`, severity: 'error' });
    }

    return issues;
  }

  /**
   * Resolve a dot-path from the case context
   */
  resolveContextPath(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.context);
  }

  /**
   * Get the assembled data for a form
   */
  getFormData(formId) {
    return this.assembledForms.get(formId) || null;
  }

  /**
   * Export all assembled forms
   */
  exportAll() {
    const forms = {};
    for (const [id, data] of this.assembledForms) {
      forms[id] = data;
    }
    return {
      exportedAt: new Date().toISOString(),
      exportedBy: 'VERNEN™ Document Assembly Engine v1.0',
      context: this.context.export(),
      forms,
      log: this.assemblyLog,
    };
  }

  /**
   * Reset all assembled forms
   */
  reset() {
    this.assembledForms.clear();
    this.assemblyLog = [];
  }

  log(formId, level, message) {
    this.assemblyLog.push({
      timestamp: new Date().toISOString(),
      formId,
      level,
      message,
    });
  }
}

// ─── FACTORY ────────────────────────────────────────────────
function createAssemblyEngine(contextData = null) {
  const engine = new DocumentAssemblyEngine();
  if (contextData) {
    const ctx = new CaseContext();
    if (contextData.caseNumber) ctx.caseNumber = contextData.caseNumber;
    if (contextData.courtName) ctx.courtName = contextData.courtName;
    if (contextData.courtCounty) ctx.courtCounty = contextData.courtCounty;
    if (contextData.courtAddress) ctx.courtAddress = contextData.courtAddress;
    if (contextData.filingDate) ctx.filingDate = contextData.filingDate;
    if (contextData.hearingDate) ctx.hearingDate = contextData.hearingDate;
    if (contextData.caseType) ctx.caseType = contextData.caseType;
    engine.setContext(ctx);
  }
  return engine;
}

export { DocumentAssemblyEngine, CaseContext, PartyProfile, createAssemblyEngine, FIELD_MAPS };
export default DocumentAssemblyEngine;
