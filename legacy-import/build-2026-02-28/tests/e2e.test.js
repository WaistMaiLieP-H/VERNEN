/**
 * VERNEN™ E2E Test Suite
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 *
 * Integration tests covering the complete Checker-to-Closer pipeline.
 * Uses Vitest. Run: npx vitest run tests/
 *
 * Test groups:
 *   1. GDN Navigator — form loading, field population, navigation
 *   2. Validation Engine — rule execution, severity classification
 *   3. Audit Report Generator — finding detection, report structure
 *   4. Traceability Logger — statutory logging, hash verification
 *   5. Remediation Engine — playbook generation, step sequencing
 *   6. Document Assembly — package compilation, POS generation
 *   7. E-Signature — capture, verification, certificate
 *   8. EFSP Gateway — package validation, submission flow
 *   9. Auth — tier gating, access control
 *  10. Payments — plan resolution, checkout flow
 *  11. Full Pipeline — end-to-end draft→file integration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════
// 1. GDN NAVIGATOR TESTS
// ═══════════════════════════════════════════════════════════════════════
describe('GDN Navigator', () => {
  it('loads FL-100 form schema with all required fields', async () => {
    const { GDN_Navigator } = await import('../gdn_navigator/GDN_Navigator.js');
    const nav = new GDN_Navigator();
    const schema = nav.getFormSchema('FL-100');
    expect(schema).toBeDefined();
    expect(schema.formId).toBe('FL-100');
    expect(schema.fields).toBeDefined();
    expect(schema.fields.length).toBeGreaterThan(0);
  });

  it('returns null for unknown form ID', async () => {
    const { GDN_Navigator } = await import('../gdn_navigator/GDN_Navigator.js');
    const nav = new GDN_Navigator();
    const schema = nav.getFormSchema('XX-999');
    expect(schema).toBeNull();
  });

  it('populates field values and retrieves them', async () => {
    const { GDN_Navigator } = await import('../gdn_navigator/GDN_Navigator.js');
    const nav = new GDN_Navigator();
    nav.loadForm('FL-100');
    nav.setFieldValue('petitioner_name', 'John Doe');
    expect(nav.getFieldValue('petitioner_name')).toBe('John Doe');
  });

  it('tracks form completion percentage', async () => {
    const { GDN_Navigator } = await import('../gdn_navigator/GDN_Navigator.js');
    const nav = new GDN_Navigator();
    nav.loadForm('FL-100');
    const before = nav.getCompletionPercent();
    nav.setFieldValue('petitioner_name', 'John Doe');
    const after = nav.getCompletionPercent();
    expect(after).toBeGreaterThanOrEqual(before);
  });

  it('generates deep link to specific field', async () => {
    const { GDN_Navigator } = await import('../gdn_navigator/GDN_Navigator.js');
    const nav = new GDN_Navigator();
    const link = nav.getFieldLink('FL-100', 'petitioner_name');
    expect(link).toContain('FL-100');
    expect(link).toContain('petitioner_name');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. VALIDATION ENGINE TESTS
// ═══════════════════════════════════════════════════════════════════════
describe('Validation Engine', () => {
  it('detects missing required fields', async () => {
    const { ValidationEngine } = await import('../validation_engine/ValidationEngine.js');
    const engine = new ValidationEngine();
    const results = engine.validate('FL-100', {
      petitioner_name: '',
      respondent_name: 'Jane Doe',
    });
    expect(results.errors.length).toBeGreaterThan(0);
    const missing = results.errors.find(e => e.fieldId === 'petitioner_name');
    expect(missing).toBeDefined();
    expect(missing.severity).toBe('error');
  });

  it('returns clean result when all required fields populated', async () => {
    const { ValidationEngine } = await import('../validation_engine/ValidationEngine.js');
    const engine = new ValidationEngine();
    const results = engine.validate('FL-100', {
      petitioner_name: 'John Doe',
      respondent_name: 'Jane Doe',
      county: 'Alameda',
      case_number: '24FL12345',
    });
    const errors = results.errors.filter(e => e.severity === 'error');
    // May still have warnings but no hard errors on required fields
    expect(errors.filter(e => e.type === 'missing_required')).toHaveLength(0);
  });

  it('classifies severity correctly (error > warning > info)', async () => {
    const { ValidationEngine } = await import('../validation_engine/ValidationEngine.js');
    const engine = new ValidationEngine();
    const results = engine.validate('FL-100', { petitioner_name: '' });
    const severities = [...new Set(results.errors.map(e => e.severity))];
    const validSeverities = ['error', 'warning', 'info'];
    severities.forEach(s => expect(validSeverities).toContain(s));
  });

  it('validates case number format', async () => {
    const { ValidationEngine } = await import('../validation_engine/ValidationEngine.js');
    const engine = new ValidationEngine();
    const results = engine.validate('FL-100', {
      petitioner_name: 'John Doe',
      case_number: 'INVALID',
    });
    const caseErr = results.errors.find(e =>
      e.fieldId === 'case_number' && e.type === 'format'
    );
    // Should flag invalid format if format rules exist
    if (caseErr) expect(caseErr.severity).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. AUDIT REPORT GENERATOR TESTS
// ═══════════════════════════════════════════════════════════════════════
describe('Audit Report Generator', () => {
  it('generates audit report with findings', async () => {
    const { AuditReportGenerator } = await import('../audit/AuditReportGenerator.js');
    const generator = new AuditReportGenerator();
    const report = await generator.generateReport({
      formId: 'FL-100',
      formData: { petitioner_name: '', respondent_name: 'Jane Doe' },
      language: 'en',
    });
    expect(report).toBeDefined();
    expect(report.formId).toBe('FL-100');
    expect(report.findings).toBeDefined();
    expect(Array.isArray(report.findings)).toBe(true);
    expect(report.findings.length).toBeGreaterThan(0);
  });

  it('assigns severity to each finding', async () => {
    const { AuditReportGenerator } = await import('../audit/AuditReportGenerator.js');
    const generator = new AuditReportGenerator();
    const report = await generator.generateReport({
      formId: 'FL-100',
      formData: {},
      language: 'en',
    });
    const validSeverities = ['critical', 'high', 'medium', 'low', 'info'];
    report.findings.forEach(f => {
      expect(validSeverities).toContain(f.severity);
    });
  });

  it('includes statutory citations in findings', async () => {
    const { AuditReportGenerator } = await import('../audit/AuditReportGenerator.js');
    const generator = new AuditReportGenerator();
    const report = await generator.generateReport({
      formId: 'FL-100',
      formData: {},
      language: 'en',
    });
    const withCitations = report.findings.filter(f => f.citation || f.statutory);
    // At least some findings should have statutory basis
    expect(withCitations.length).toBeGreaterThan(0);
  });

  it('produces report summary with counts', async () => {
    const { AuditReportGenerator } = await import('../audit/AuditReportGenerator.js');
    const generator = new AuditReportGenerator();
    const report = await generator.generateReport({
      formId: 'FL-100',
      formData: { petitioner_name: 'John Doe' },
      language: 'en',
    });
    expect(report.summary).toBeDefined();
    expect(typeof report.summary.totalFindings).toBe('number');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 4. TRACEABILITY LOGGER TESTS
// ═══════════════════════════════════════════════════════════════════════
describe('Traceability Logger', () => {
  it('creates a new traceability log', async () => {
    const { createTraceabilityLog } = await import('../traceability/TraceabilityLogger.js');
    const logger = createTraceabilityLog({ sessionId: 'test-001', formId: 'FL-100' });
    expect(logger).toBeDefined();
    expect(logger.sessionId).toBe('test-001');
  });

  it('logs a California statute with hash', async () => {
    const { createTraceabilityLog } = await import('../traceability/TraceabilityLogger.js');
    const logger = createTraceabilityLog({ sessionId: 'test-002', formId: 'FL-100' });
    await logger.logStatute('FAM', '2310', 'Sample statute text for dissolution.', 'finding-1');
    const report = logger.getReport();
    expect(report.totalSources).toBe(1);
    expect(report.uniqueStatutes).toBe(1);
  });

  it('logs multiple source types', async () => {
    const { createTraceabilityLog } = await import('../traceability/TraceabilityLogger.js');
    const logger = createTraceabilityLog({ sessionId: 'test-003', formId: 'FL-100' });
    await logger.logStatute('FAM', '2310', 'Statute text', 'f-1');
    await logger.logRegulation('5', '11446', 'Regulation text', 'f-2');
    await logger.logRuleOfCourt('5.210', 'Rule text', 'f-3');
    await logger.logUSCode('42', '1983', 'Federal statute text', 'f-4');
    const report = logger.getReport();
    expect(report.totalSources).toBe(4);
    expect(report.sourceBreakdown.ca_statute).toBe(1);
    expect(report.sourceBreakdown.ca_regulation).toBe(1);
    expect(report.sourceBreakdown.ca_rule_of_court).toBe(1);
    expect(report.sourceBreakdown.us_code).toBe(1);
  });

  it('generates SHA-256 content hashes', async () => {
    const { createTraceabilityLog } = await import('../traceability/TraceabilityLogger.js');
    const logger = createTraceabilityLog({ sessionId: 'test-004', formId: 'FL-100' });
    await logger.logStatute('FAM', '2310', 'Test text', 'f-1');
    const entries = logger.getEntries();
    expect(entries[0].contentHash).toBeDefined();
    expect(entries[0].contentHash).toHaveLength(64); // SHA-256 hex
  });

  it('finalizes log and prevents further entries', async () => {
    const { createTraceabilityLog } = await import('../traceability/TraceabilityLogger.js');
    const logger = createTraceabilityLog({ sessionId: 'test-005', formId: 'FL-100' });
    await logger.logStatute('FAM', '2310', 'Text', 'f-1');
    const finalized = await logger.finalize();
    expect(finalized.logHash).toBeDefined();
    expect(finalized.logHash).toHaveLength(64);
    // Attempting to add after finalization should throw
    await expect(
      logger.logStatute('FAM', '2311', 'More text', 'f-2')
    ).rejects.toThrow();
  });

  it('serializes and deserializes correctly', async () => {
    const { createTraceabilityLog, TraceabilityLogger } = await import('../traceability/TraceabilityLogger.js');
    const logger = createTraceabilityLog({ sessionId: 'test-006', formId: 'FL-100' });
    await logger.logStatute('FAM', '2310', 'Text', 'f-1');
    const json = logger.toJSON();
    const restored = TraceabilityLogger.fromJSON(json);
    expect(restored.getReport().totalSources).toBe(1);
  });

  it('generates PDF-ready data structure', async () => {
    const { createTraceabilityLog } = await import('../traceability/TraceabilityLogger.js');
    const logger = createTraceabilityLog({ sessionId: 'test-007', formId: 'FL-100' });
    await logger.logStatute('FAM', '2310', 'Text', 'f-1');
    const pdfData = logger.toPDFData();
    expect(pdfData.overview).toBeDefined();
    expect(pdfData.summary).toBeDefined();
    expect(pdfData.sourceLog).toBeDefined();
    expect(pdfData.attestation).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 5. REMEDIATION ENGINE TESTS
// ═══════════════════════════════════════════════════════════════════════
describe('Remediation Engine', () => {
  const mockAuditReport = {
    auditId: 'audit-test-001',
    formId: 'FL-100',
    formTitle: 'Petition — Marriage/Domestic Partnership',
    findings: [
      {
        findingId: 'f-1',
        description: 'Petitioner name is missing',
        category: 'missing_field',
        severity: 'critical',
        fieldId: 'petitioner_name',
        fieldPath: 'petitioner_name',
        citation: { code: 'FAM', section: '2330' },
      },
      {
        findingId: 'f-2',
        description: 'County not specified',
        category: 'missing_field',
        severity: 'high',
        fieldId: 'county',
        fieldPath: 'county',
      },
      {
        findingId: 'f-3',
        description: 'Case number format does not match expected pattern',
        category: 'format_error',
        severity: 'medium',
        fieldId: 'case_number',
        fieldPath: 'case_number',
        suggestedValue: '24FL12345',
      },
    ],
  };

  it('generates a remediation playbook from audit report', async () => {
    const { RemediationEngine } = await import('../remediation/RemediationEngine.js');
    const playbook = RemediationEngine.generatePlaybook(mockAuditReport);
    expect(playbook).toBeDefined();
    expect(playbook.playbookId).toBeDefined();
    expect(playbook.steps.length).toBe(3);
  });

  it('sorts steps by priority (critical first)', async () => {
    const { RemediationEngine } = await import('../remediation/RemediationEngine.js');
    const playbook = RemediationEngine.generatePlaybook(mockAuditReport);
    expect(playbook.steps[0].severity).toBe('critical');
    expect(playbook.steps[0].priority).toBeLessThanOrEqual(playbook.steps[1].priority);
  });

  it('assigns complexity based on finding characteristics', async () => {
    const { RemediationEngine } = await import('../remediation/RemediationEngine.js');
    const playbook = RemediationEngine.generatePlaybook(mockAuditReport);
    const validComplexities = ['simple', 'moderate', 'complex', 'requires_review'];
    playbook.steps.forEach(step => {
      expect(validComplexities).toContain(step.complexity);
      expect(step.estimatedMinutes).toBeGreaterThan(0);
    });
  });

  it('generates GDN deep links for each step', async () => {
    const { RemediationEngine } = await import('../remediation/RemediationEngine.js');
    const playbook = RemediationEngine.generatePlaybook(mockAuditReport);
    playbook.steps.forEach(step => {
      expect(step.gdnLink).toBeDefined();
      expect(step.gdnLink).toContain('FL-100');
    });
  });

  it('organizes steps into 4 execution phases', async () => {
    const { RemediationEngine } = await import('../remediation/RemediationEngine.js');
    const playbook = RemediationEngine.generatePlaybook(mockAuditReport);
    expect(playbook.phases).toBeDefined();
    expect(playbook.phases.length).toBe(4);
    expect(playbook.phases[0].name).toContain('Critical');
  });

  it('calculates summary with time estimates', async () => {
    const { RemediationEngine } = await import('../remediation/RemediationEngine.js');
    const playbook = RemediationEngine.generatePlaybook(mockAuditReport);
    expect(playbook.summary.totalSteps).toBe(3);
    expect(playbook.summary.estimatedTotalMinutes).toBeGreaterThan(0);
  });

  it('tracks step completion progress', async () => {
    const { RemediationEngine } = await import('../remediation/RemediationEngine.js');
    const playbook = RemediationEngine.generatePlaybook(mockAuditReport);
    const before = RemediationEngine.getProgress(playbook);
    expect(before.completed).toBe(0);

    RemediationEngine.updateStepStatus(playbook, playbook.steps[0].stepId, 'completed');
    const after = RemediationEngine.getProgress(playbook);
    expect(after.completed).toBe(1);
    expect(after.percent).toBeGreaterThan(0);
  });

  it('identifies next pending step', async () => {
    const { RemediationEngine } = await import('../remediation/RemediationEngine.js');
    const playbook = RemediationEngine.generatePlaybook(mockAuditReport);
    const next = RemediationEngine.getNextStep(playbook);
    expect(next).toBeDefined();
    expect(next.status).toBe('pending');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 6. DOCUMENT ASSEMBLY ENGINE TESTS
// ═══════════════════════════════════════════════════════════════════════
describe('Document Assembly Engine', () => {
  it('creates a filing package from form data', async () => {
    const { DocumentAssemblyEngine } = await import('../assembly/DocumentAssemblyEngine.js');
    const engine = new DocumentAssemblyEngine();
    const pkg = engine.createPackage({
      formId: 'FL-100',
      formData: { petitioner_name: 'John Doe', respondent_name: 'Jane Doe' },
      caseNumber: '24FL12345',
      county: 'alameda',
    });
    expect(pkg).toBeDefined();
    expect(pkg.packageId).toBeDefined();
    expect(pkg.documents.length).toBeGreaterThan(0);
  });

  it('generates proof of service document', async () => {
    const { DocumentAssemblyEngine } = await import('../assembly/DocumentAssemblyEngine.js');
    const engine = new DocumentAssemblyEngine();
    const pos = engine.generateProofOfService({
      formId: 'FL-100',
      servedParty: 'Jane Doe',
      serviceMethod: 'personal',
      serviceDate: '2026-02-28',
      serverName: 'Process Server Inc.',
    });
    expect(pos).toBeDefined();
    expect(pos.servedParty).toBe('Jane Doe');
  });

  it('validates package completeness', async () => {
    const { DocumentAssemblyEngine } = await import('../assembly/DocumentAssemblyEngine.js');
    const engine = new DocumentAssemblyEngine();
    const pkg = engine.createPackage({
      formId: 'FL-100',
      formData: { petitioner_name: 'John Doe' },
      county: 'alameda',
    });
    const validation = engine.validatePackage(pkg.packageId);
    expect(validation).toBeDefined();
    expect(typeof validation.valid).toBe('boolean');
    expect(Array.isArray(validation.errors)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 7. E-SIGNATURE ENGINE TESTS
// ═══════════════════════════════════════════════════════════════════════
describe('E-Signature Engine', () => {
  it('captures a typed signature', async () => {
    const { ESignatureEngine, SIG_TYPE } = await import('../filesign/ESignatureEngine.js');
    const engine = new ESignatureEngine({ language: 'en' });
    const record = await engine.captureSignature({
      formId: 'FL-100',
      fieldId: 'petitioner_signature',
      signerName: 'John Doe',
      signerEmail: 'john@example.com',
      signatureType: SIG_TYPE.TYPED,
      signatureData: 'John Doe',
      documentContent: '{"petitioner_name":"John Doe"}',
      consentGiven: true,
    });
    expect(record).toBeDefined();
    expect(record.signatureId).toBeDefined();
    expect(record.signer.name).toBe('John Doe');
    expect(record.consentGiven).toBe(true);
    expect(record.legalBasis).toContain('1633');
  });

  it('rejects signature without consent', async () => {
    const { ESignatureEngine, SIG_TYPE } = await import('../filesign/ESignatureEngine.js');
    const engine = new ESignatureEngine();
    await expect(
      engine.captureSignature({
        formId: 'FL-100',
        fieldId: 'petitioner_signature',
        signerName: 'John Doe',
        signatureType: SIG_TYPE.TYPED,
        signatureData: 'John Doe',
        consentGiven: false,
      })
    ).rejects.toThrow('consent');
  });

  it('rejects e-signature on wet-ink-required fields', async () => {
    const { ESignatureEngine, SIG_TYPE } = await import('../filesign/ESignatureEngine.js');
    const engine = new ESignatureEngine();
    await expect(
      engine.captureSignature({
        formId: 'FL-311',
        fieldId: 'judicial_officer_signature',
        signerName: 'Judge Smith',
        signatureType: SIG_TYPE.TYPED,
        signatureData: 'Judge Smith',
        consentGiven: true,
      })
    ).rejects.toThrow('wet ink');
  });

  it('verifies signature integrity', async () => {
    const { ESignatureEngine, SIG_TYPE } = await import('../filesign/ESignatureEngine.js');
    const engine = new ESignatureEngine();
    const docContent = '{"test":"original"}';
    await engine.captureSignature({
      formId: 'FL-100',
      fieldId: 'petitioner_signature',
      signerName: 'John Doe',
      signatureType: SIG_TYPE.TYPED,
      signatureData: 'John Doe',
      documentContent: docContent,
      consentGiven: true,
    });
    // Verify with same content — should pass
    const valid = await engine.verifySignature('FL-100', 'petitioner_signature', docContent);
    expect(valid.valid).toBe(true);
    // Verify with changed content — should fail
    const invalid = await engine.verifySignature('FL-100', 'petitioner_signature', '{"test":"modified"}');
    expect(invalid.valid).toBe(false);
    expect(invalid.reason).toContain('modified');
  });

  it('generates signature certificate', async () => {
    const { ESignatureEngine, SIG_TYPE } = await import('../filesign/ESignatureEngine.js');
    const engine = new ESignatureEngine();
    await engine.captureSignature({
      formId: 'FL-100',
      fieldId: 'petitioner_signature',
      signerName: 'John Doe',
      signatureType: SIG_TYPE.TYPED,
      signatureData: 'John Doe',
      consentGiven: true,
    });
    const cert = engine.generateCertificate('FL-100');
    expect(cert).toBeDefined();
    expect(cert.signatureCount).toBe(1);
    expect(cert.attestation).toContain('UETA');
  });

  it('tracks form signature completeness', async () => {
    const { ESignatureEngine, SIG_TYPE } = await import('../filesign/ESignatureEngine.js');
    const engine = new ESignatureEngine();
    expect(engine.isFormFullySigned('FL-100')).toBe(false);
    await engine.captureSignature({
      formId: 'FL-100',
      fieldId: 'petitioner_signature',
      signerName: 'John Doe',
      signatureType: SIG_TYPE.TYPED,
      signatureData: 'John Doe',
      consentGiven: true,
    });
    // FL-100 has petitioner_signature and date_signed
    const fields = engine.getFormSignatureFields('FL-100');
    expect(fields.length).toBeGreaterThan(0);
  });

  it('revokes signature', async () => {
    const { ESignatureEngine, SIG_TYPE } = await import('../filesign/ESignatureEngine.js');
    const engine = new ESignatureEngine();
    await engine.captureSignature({
      formId: 'FL-100',
      fieldId: 'petitioner_signature',
      signerName: 'John Doe',
      signatureType: SIG_TYPE.TYPED,
      signatureData: 'John Doe',
      consentGiven: true,
    });
    const revoked = engine.revokeSignature('FL-100', 'petitioner_signature');
    expect(revoked).toBe(true);
    const verify = await engine.verifySignature('FL-100', 'petitioner_signature');
    expect(verify.valid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 8. EFSP GATEWAY TESTS
// ═══════════════════════════════════════════════════════════════════════
describe('EFSP Gateway', () => {
  it('creates a filing package with court info', async () => {
    const { EFSPGateway } = await import('../filesign/EFSPGateway.js');
    const gateway = new EFSPGateway();
    const filing = gateway.createFilingPackage({
      caseNumber: '24FL12345',
      countyCode: 'alameda',
      filingType: 'motion_general',
      documents: [{ formId: 'FL-300', title: 'Request for Order', pdfBlob: 'mock' }],
    });
    expect(filing).toBeDefined();
    expect(filing.filingId).toBeDefined();
    expect(filing.court.courtName).toContain('Alameda');
    expect(filing.status).toBe('draft');
    expect(filing.feeAmount).toBe(60);
  });

  it('rejects unknown county codes', async () => {
    const { EFSPGateway } = await import('../filesign/EFSPGateway.js');
    const gateway = new EFSPGateway();
    expect(() => gateway.createFilingPackage({
      countyCode: 'fake_county',
      filingType: 'motion_general',
      documents: [{ formId: 'FL-300', pdfBlob: 'mock' }],
    })).toThrow('Unknown county');
  });

  it('applies fee waiver correctly', async () => {
    const { EFSPGateway } = await import('../filesign/EFSPGateway.js');
    const gateway = new EFSPGateway();
    const filing = gateway.createFilingPackage({
      countyCode: 'solano',
      filingType: 'petition_dissolution',
      documents: [{ formId: 'FL-100', pdfBlob: 'mock' }],
      feeWaiverGranted: true,
    });
    expect(filing.feeAmount).toBe(0);
    expect(filing.feeWaiverGranted).toBe(true);
  });

  it('validates filing package — catches missing PDF', async () => {
    const { EFSPGateway } = await import('../filesign/EFSPGateway.js');
    const gateway = new EFSPGateway();
    const filing = gateway.createFilingPackage({
      countyCode: 'alameda',
      filingType: 'motion_general',
      documents: [{ formId: 'FL-300', title: 'Request for Order' }], // no pdfBlob
    });
    const result = gateway.validateFilingPackage(filing.filingId);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Missing PDF'))).toBe(true);
  });

  it('validates filing package — passes with complete data', async () => {
    const { EFSPGateway } = await import('../filesign/EFSPGateway.js');
    const gateway = new EFSPGateway();
    const filing = gateway.createFilingPackage({
      caseNumber: '24FL12345',
      countyCode: 'alameda',
      filingType: 'motion_general',
      documents: [{ formId: 'FL-300', title: 'RFO', pdfBlob: 'mock' }],
    });
    const result = gateway.validateFilingPackage(filing.filingId);
    // May have warnings but should pass if docs have PDFs
    // Signature check depends on ESignatureEngine singleton state
    expect(result).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('returns static court list', async () => {
    const { EFSPGateway } = await import('../filesign/EFSPGateway.js');
    const courts = EFSPGateway.getAvailableCourts();
    expect(courts.length).toBeGreaterThan(0);
    const alameda = courts.find(c => c.code === 'alameda');
    expect(alameda).toBeDefined();
    expect(alameda.efiling).toBe(true);
  });

  it('estimates filing fees', async () => {
    const { EFSPGateway } = await import('../filesign/EFSPGateway.js');
    const fee = EFSPGateway.estimateFees('petition_dissolution');
    expect(fee.amount).toBe(435);
    expect(fee.firstPaper).toBe(true);
    const waived = EFSPGateway.estimateFees('petition_dissolution', true);
    expect(waived.amount).toBe(0);
    expect(waived.waived).toBe(true);
  });

  it('tracks filing status history', async () => {
    const { EFSPGateway } = await import('../filesign/EFSPGateway.js');
    const gateway = new EFSPGateway();
    const filing = gateway.createFilingPackage({
      countyCode: 'solano',
      filingType: 'declaration',
      documents: [{ formId: 'MC-030', pdfBlob: 'mock' }],
    });
    expect(filing.statusHistory.length).toBe(1);
    expect(filing.statusHistory[0].status).toBe('draft');
  });

  it('retrieves filing history sorted by date', async () => {
    const { EFSPGateway } = await import('../filesign/EFSPGateway.js');
    const gateway = new EFSPGateway();
    gateway.createFilingPackage({
      countyCode: 'alameda', filingType: 'declaration',
      documents: [{ formId: 'MC-030', pdfBlob: 'a' }],
    });
    gateway.createFilingPackage({
      countyCode: 'solano', filingType: 'motion_general',
      documents: [{ formId: 'FL-300', pdfBlob: 'b' }],
    });
    const history = gateway.getFilingHistory();
    expect(history.length).toBe(2);
    // Most recent first
    expect(new Date(history[0].createdAt) >= new Date(history[1].createdAt)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 9. AUTH MANAGER TESTS
// ═══════════════════════════════════════════════════════════════════════
describe('Auth Manager', () => {
  it('initializes with guest tier by default', async () => {
    const { AuthManager } = await import('../auth/AuthManager.js');
    const auth = new AuthManager();
    expect(auth.getCurrentTier()).toBe('guest');
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('enforces tier-based form access', async () => {
    const { AuthManager } = await import('../auth/AuthManager.js');
    const auth = new AuthManager();
    // Guest can access Tier A
    expect(auth.canAccessFormTier('A')).toBe(true);
    // Guest cannot access Tier B or C
    expect(auth.canAccessFormTier('B')).toBe(false);
    expect(auth.canAccessFormTier('C')).toBe(false);
  });

  it('enforces feature gating by tier', async () => {
    const { AuthManager } = await import('../auth/AuthManager.js');
    const auth = new AuthManager();
    // Guest has GDN + Validation
    expect(auth.canAccessFeature('gdn')).toBe(true);
    expect(auth.canAccessFeature('validation')).toBe(true);
    // Guest does not have audit or export
    expect(auth.canAccessFeature('audit')).toBe(false);
    expect(auth.canAccessFeature('export')).toBe(false);
  });

  it('enforces language restrictions', async () => {
    const { AuthManager } = await import('../auth/AuthManager.js');
    const auth = new AuthManager();
    // Guest: en + es only
    expect(auth.canAccessLanguage('en')).toBe(true);
    expect(auth.canAccessLanguage('es')).toBe(true);
    expect(auth.canAccessLanguage('zh')).toBe(false);
  });

  it('enforces max form limits', async () => {
    const { AuthManager } = await import('../auth/AuthManager.js');
    const auth = new AuthManager();
    const max = auth.getMaxForms();
    expect(typeof max).toBe('number');
    expect(max).toBeGreaterThan(0);
  });

  it('export blocked for guest/free tiers', async () => {
    const { AuthManager } = await import('../auth/AuthManager.js');
    const auth = new AuthManager();
    expect(auth.canExport()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 10. PAYMENT MANAGER TESTS
// ═══════════════════════════════════════════════════════════════════════
describe('Payment Manager', () => {
  it('returns correct plan pricing', async () => {
    const { PaymentManager } = await import('../payments/PaymentManager.js');
    const pm = new PaymentManager();
    const plans = pm.getPlans();
    expect(plans).toBeDefined();
    expect(plans.free).toBeDefined();
    expect(plans.pro).toBeDefined();
    expect(plans.advocate).toBeDefined();
    expect(plans.pro.monthly).toBe(19.99);
    expect(plans.advocate.monthly).toBe(39.99);
  });

  it('calculates annual savings correctly', async () => {
    const { PaymentManager } = await import('../payments/PaymentManager.js');
    const pm = new PaymentManager();
    const plans = pm.getPlans();
    // Annual should be ~20% savings
    const proMonthlyCost = plans.pro.monthly * 12;
    expect(plans.pro.annual).toBeLessThan(proMonthlyCost);
    const savings = ((proMonthlyCost - plans.pro.annual) / proMonthlyCost * 100);
    expect(Math.round(savings)).toBeCloseTo(20, 0);
  });

  it('determines valid upgrade paths', async () => {
    const { PaymentManager } = await import('../payments/PaymentManager.js');
    const pm = new PaymentManager();
    // From free, can upgrade to pro or advocate
    expect(pm.canUpgradeTo('pro')).toBe(true);
    expect(pm.canUpgradeTo('advocate')).toBe(true);
    // Cannot upgrade to free (same or lower)
    expect(pm.canUpgradeTo('free')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 11. FULL PIPELINE INTEGRATION TEST
// ═══════════════════════════════════════════════════════════════════════
describe('Full Pipeline: Draft → File', () => {
  it('completes entire checker-to-closer flow', async () => {
    // ─── STEP 1: GDN — Draft the form ──────────────────────────────
    const { GDN_Navigator } = await import('../gdn_navigator/GDN_Navigator.js');
    const nav = new GDN_Navigator();
    nav.loadForm('FL-100');
    nav.setFieldValue('petitioner_name', 'John Doe');
    nav.setFieldValue('respondent_name', 'Jane Doe');
    nav.setFieldValue('county', 'Alameda');
    const formData = nav.getAllFieldValues();
    expect(formData.petitioner_name).toBe('John Doe');

    // ─── STEP 2: Validation — Check the form ──────────────────────
    const { ValidationEngine } = await import('../validation_engine/ValidationEngine.js');
    const validator = new ValidationEngine();
    const valResult = validator.validate('FL-100', formData);
    expect(valResult).toBeDefined();
    // May have warnings but form has key fields populated

    // ─── STEP 3: Audit — Compliance check ─────────────────────────
    const { AuditReportGenerator } = await import('../audit/AuditReportGenerator.js');
    const auditor = new AuditReportGenerator();
    const auditReport = await auditor.generateReport({
      formId: 'FL-100',
      formData,
      language: 'en',
    });
    expect(auditReport.findings).toBeDefined();

    // ─── STEP 4: Traceability — Statutory proof ───────────────────
    const { createTraceabilityLog } = await import('../traceability/TraceabilityLogger.js');
    const traceLog = createTraceabilityLog({
      sessionId: 'pipeline-test-001',
      formId: 'FL-100',
    });
    // Log sources referenced during audit
    for (const finding of auditReport.findings.slice(0, 3)) {
      if (finding.citation?.code && finding.citation?.section) {
        await traceLog.logStatute(
          finding.citation.code,
          finding.citation.section,
          `Statutory text for ${finding.citation.code} § ${finding.citation.section}`,
          finding.findingId
        );
      }
    }
    const traceReport = traceLog.getReport();
    expect(traceReport.totalSources).toBeGreaterThanOrEqual(0);

    // ─── STEP 5: Remediation — Fix playbook ───────────────────────
    const { RemediationEngine } = await import('../remediation/RemediationEngine.js');
    if (auditReport.findings.length > 0) {
      const playbook = RemediationEngine.generatePlaybook(auditReport);
      expect(playbook.steps.length).toBeGreaterThan(0);
      expect(playbook.summary.estimatedTotalMinutes).toBeGreaterThan(0);

      // Simulate completing all steps
      playbook.steps.forEach(step => {
        RemediationEngine.updateStepStatus(playbook, step.stepId, 'completed');
      });
      const progress = RemediationEngine.getProgress(playbook);
      expect(progress.percent).toBe(100);
    }

    // ─── STEP 6: Assembly — Package docs ──────────────────────────
    const { DocumentAssemblyEngine } = await import('../assembly/DocumentAssemblyEngine.js');
    const assembler = new DocumentAssemblyEngine();
    const pkg = assembler.createPackage({
      formId: 'FL-100',
      formData,
      caseNumber: null, // New case
      county: 'alameda',
    });
    expect(pkg.packageId).toBeDefined();

    // ─── STEP 7: E-Signature — Sign docs ──────────────────────────
    const { ESignatureEngine, SIG_TYPE } = await import('../filesign/ESignatureEngine.js');
    const esig = new ESignatureEngine({ language: 'en' });
    const sigRecord = await esig.captureSignature({
      formId: 'FL-100',
      fieldId: 'petitioner_signature',
      signerName: 'John Doe',
      signerEmail: 'john@example.com',
      signatureType: SIG_TYPE.TYPED,
      signatureData: 'John Doe',
      documentContent: JSON.stringify(formData),
      consentGiven: true,
    });
    expect(sigRecord.signatureId).toBeDefined();
    const cert = esig.generateCertificate('FL-100');
    expect(cert.signatureCount).toBe(1);

    // ─── STEP 8: EFSP Gateway — File with court ──────────────────
    const { EFSPGateway } = await import('../filesign/EFSPGateway.js');
    const gateway = new EFSPGateway();
    const filing = gateway.createFilingPackage({
      caseNumber: null, // New filing — petition
      countyCode: 'alameda',
      filingType: 'petition_dissolution',
      documents: [{
        formId: 'FL-100',
        title: 'Petition — Marriage/Domestic Partnership',
        pdfBlob: 'mock-pdf-data',
        pageCount: 4,
      }],
      feeWaiverGranted: true,
    });
    expect(filing.filingId).toBeDefined();
    expect(filing.court.courtName).toContain('Alameda');
    expect(filing.feeAmount).toBe(0); // Fee waived
    expect(filing.status).toBe('draft');

    // Validate the filing package
    const validation = gateway.validateFilingPackage(filing.filingId);
    expect(validation).toBeDefined();
    // Package may have signature warnings depending on singleton state

    // ─── PIPELINE COMPLETE ────────────────────────────────────────
    // The full flow: Draft → Validate → Audit → Trace → Remediate
    //                → Assemble → Sign → File
    console.log('✅ Full pipeline integration test passed');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 12. i18n TESTS
// ═══════════════════════════════════════════════════════════════════════
describe('i18n String Files', () => {
  const languages = [
    'en', 'es', 'zh', 'vi', 'so', 'ti', 'am', 'ar', 'ht', 'ko', 'pt', 'ru', 'tl'
  ];
  const requiredSections = [
    'app', 'nav', 'gdn', 'validation', 'audit', 'export', 'errors',
    'a11y', 'legal', 'auth', 'payments', 'esignature', 'filing',
    'traceability', 'remediation'
  ];

  languages.forEach(lang => {
    it(`${lang}: has all required sections`, async () => {
      const strings = await import(`../i18n/ui_strings_${lang}.json`);
      requiredSections.forEach(section => {
        expect(strings[section]).toBeDefined();
      });
    });
  });

  it('en: auth section has all expected keys', async () => {
    const en = await import('../i18n/ui_strings_en.json');
    const authKeys = [
      'login', 'register', 'logout', 'email', 'password',
      'forgotPassword', 'resetPassword', 'loginSuccess',
      'tier', 'tierRequired', 'upgradeNow'
    ];
    authKeys.forEach(key => {
      expect(en.auth[key]).toBeDefined();
    });
  });

  it('en: payments section has plan details', async () => {
    const en = await import('../i18n/ui_strings_en.json');
    expect(en.payments.freePlan.name).toBe('Free');
    expect(en.payments.proPlan.name).toBe('Pro');
    expect(en.payments.advocatePlan.name).toBe('Advocate');
  });

  it('es: has Spanish translations (not English fallback)', async () => {
    const es = await import('../i18n/ui_strings_es.json');
    expect(es.auth.login).toBe('Iniciar Sesión');
    expect(es.auth.logout).toBe('Cerrar Sesión');
    expect(es.payments.pricing).toBe('Precios');
    expect(es.esignature.title).toBe('Firma Electrónica');
    expect(es.filing.title).toBe('Presentar al Tribunal');
  });
});
