/**
 * VERNEN™ EFSP Gateway (Electronic Filing Service Provider)
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Integration layer for California court e-filing through
 * approved EFSPs. VERNEN™ acts as an integration partner,
 * not an EFSP — packages are submitted via EFSP APIs.
 *
 * Supported EFSPs (planned):
 *   - File & ServeXpress (Tyler Technologies / Odyssey)
 *   - One Legal
 *   - TurboCourt
 *
 * Filing workflow:
 *   1. Assemble filing package (docs, cover sheet, POS, fees)
 *   2. Validate package completeness
 *   3. Submit via EFSP API
 *   4. Track filing status
 *   5. Receive filed-stamped copies
 *
 * References:
 *   - CRC 2.250–2.261 (e-filing rules)
 *   - CRC 2.256 (format requirements)
 *   - CRC 2.257 (signatures on e-filed documents)
 *   - Local court e-filing rules per county
 */

import { getESignatureEngine } from './ESignatureEngine.js';
import { getAuthManager } from '../auth/AuthManager.js';

// ─── FILING STATUS ───────────────────────────────────────────────────
export const FILING_STATUS = {
  DRAFT: 'draft',
  VALIDATING: 'validating',
  READY: 'ready',
  SUBMITTING: 'submitting',
  SUBMITTED: 'submitted',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  FILED: 'filed',
  ERROR: 'error',
};

// ─── CALIFORNIA COUNTY COURT CODES ──────────────────────────────────
// Tyler/Odyssey court codes for major counties
const COURT_CODES = {
  alameda: { code: 'alameda', name: 'Alameda County Superior Court', efiling: true, efsp: 'fileandserve' },
  contra_costa: { code: 'contra_costa', name: 'Contra Costa County Superior Court', efiling: true, efsp: 'fileandserve' },
  los_angeles: { code: 'los_angeles', name: 'Los Angeles County Superior Court', efiling: true, efsp: 'fileandserve' },
  marin: { code: 'marin', name: 'Marin County Superior Court', efiling: true, efsp: 'fileandserve' },
  orange: { code: 'orange', name: 'Orange County Superior Court', efiling: true, efsp: 'fileandserve' },
  sacramento: { code: 'sacramento', name: 'Sacramento County Superior Court', efiling: true, efsp: 'fileandserve' },
  san_diego: { code: 'san_diego', name: 'San Diego County Superior Court', efiling: true, efsp: 'fileandserve' },
  san_francisco: { code: 'san_francisco', name: 'San Francisco County Superior Court', efiling: true, efsp: 'fileandserve' },
  santa_clara: { code: 'santa_clara', name: 'Santa Clara County Superior Court', efiling: true, efsp: 'fileandserve' },
  solano: { code: 'solano', name: 'Solano County Superior Court', efiling: true, efsp: 'fileandserve' },
  sonoma: { code: 'sonoma', name: 'Sonoma County Superior Court', efiling: true, efsp: 'fileandserve' },
};

// ─── FILING FEE SCHEDULE (Family Law) ────────────────────────────────
// Source: GC § 70670-70677, updated per Judicial Council fee schedule
const FILING_FEES = {
  petition_dissolution: { base: 435, firstPaper: true },
  response_dissolution: { base: 435, firstPaper: true },
  motion_general: { base: 60, firstPaper: false },
  motion_osc: { base: 60, firstPaper: false },
  rfo_modification: { base: 60, firstPaper: false },
  stipulation: { base: 20, firstPaper: false },
  declaration: { base: 0, firstPaper: false },
  proof_of_service: { base: 0, firstPaper: false },
  fee_waiver_fw001: { base: 0, firstPaper: false, waivesFees: true },
};

// ─── EFSP GATEWAY CLASS ──────────────────────────────────────────────
export class EFSPGateway {
  constructor(config = {}) {
    this.apiUrl = config.apiUrl || '/api/efiling';
    this.defaultEFSP = config.defaultEFSP || 'fileandserve';
    this.filings = new Map();  // filingId → filing record
    this.listeners = new Set();
  }

  // ─── FILING PACKAGE ASSEMBLY ─────────────────────────────────────
  createFilingPackage(params) {
    const {
      caseNumber,
      countyCode,
      filingType,        // petition_dissolution, motion_general, etc.
      documents = [],    // [{ formId, pdfBlob, title }]
      proofOfService,    // { pdfBlob, servedParties }
      feeWaiverGranted = false,
    } = params;

    const court = COURT_CODES[countyCode];
    if (!court) throw new Error(`Unknown county: ${countyCode}`);
    if (!court.efiling) throw new Error(`${court.name} does not accept e-filing`);

    const feeInfo = FILING_FEES[filingType] || { base: 0, firstPaper: false };
    const feeAmount = feeWaiverGranted ? 0 : feeInfo.base;

    const esigEngine = getESignatureEngine();
    const signatureStatus = documents.map(doc => ({
      formId: doc.formId,
      fullySigned: esigEngine?.isFormFullySigned(doc.formId) ?? false,
      wetInkRequired: esigEngine?.hasWetInkRequirements(doc.formId) ?? false,
      certificate: esigEngine?.generateCertificate(doc.formId) || null,
    }));

    const filingId = `filing_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const filing = {
      filingId,
      status: FILING_STATUS.DRAFT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Court info
      court: {
        countyCode,
        courtName: court.name,
        efsp: court.efsp,
        caseNumber: caseNumber || null,
      },
      // Filing details
      filingType,
      feeAmount,
      feeWaiverGranted,
      // Documents
      documents: documents.map((doc, i) => ({
        sequence: i + 1,
        formId: doc.formId,
        title: doc.title || doc.formId,
        pageCount: doc.pageCount || null,
        hasPdf: !!doc.pdfBlob,
      })),
      proofOfService: proofOfService ? {
        included: true,
        servedParties: proofOfService.servedParties || [],
      } : { included: false },
      // Signatures
      signatureStatus,
      // Tracking
      efspSubmissionId: null,
      efspConfirmation: null,
      filedStampedCopy: null,
      rejectionReason: null,
      statusHistory: [
        { status: FILING_STATUS.DRAFT, timestamp: new Date().toISOString() },
      ],
    };

    this.filings.set(filingId, filing);
    this._notify('filing_created', filing);
    return filing;
  }

  // ─── PRE-FLIGHT VALIDATION ───────────────────────────────────────
  validateFilingPackage(filingId) {
    const filing = this.filings.get(filingId);
    if (!filing) throw new Error(`Filing ${filingId} not found`);

    const errors = [];
    const warnings = [];

    // Court validation
    if (!filing.court.countyCode) errors.push('County not specified');
    if (!filing.court.caseNumber && !this._isNewCase(filing.filingType)) {
      errors.push('Case number required for this filing type');
    }

    // Document validation
    if (!filing.documents.length) errors.push('No documents in filing package');
    filing.documents.forEach(doc => {
      if (!doc.hasPdf) errors.push(`Missing PDF for ${doc.formId}`);
    });

    // Signature validation
    filing.signatureStatus.forEach(sig => {
      if (!sig.fullySigned && !sig.wetInkRequired) {
        errors.push(`${sig.formId}: Missing required e-signature(s)`);
      }
      if (sig.wetInkRequired) {
        warnings.push(`${sig.formId}: Contains fields requiring wet ink — print and sign before scanning`);
      }
    });

    // Fee validation
    if (filing.feeAmount > 0 && !filing.feeWaiverGranted) {
      warnings.push(`Filing fee: $${filing.feeAmount.toFixed(2)} — payment will be collected by EFSP`);
    }

    // Proof of service
    if (!filing.proofOfService.included && !this._isInitialFiling(filing.filingType)) {
      warnings.push('No proof of service included — may be required for this filing type');
    }

    // CRC 2.256 format requirements
    filing.documents.forEach(doc => {
      if (doc.pageCount && doc.pageCount > 25) {
        warnings.push(`${doc.formId}: ${doc.pageCount} pages — consider adding table of contents per CRC 2.256`);
      }
    });

    const valid = errors.length === 0;
    const status = valid ? FILING_STATUS.READY : FILING_STATUS.DRAFT;
    this._updateStatus(filingId, status);

    return { valid, errors, warnings, filingId };
  }

  // ─── SUBMIT TO EFSP ──────────────────────────────────────────────
  async submitFiling(filingId) {
    const filing = this.filings.get(filingId);
    if (!filing) throw new Error(`Filing ${filingId} not found`);

    // Must validate first
    if (filing.status !== FILING_STATUS.READY) {
      const validation = this.validateFilingPackage(filingId);
      if (!validation.valid) {
        throw new Error(`Filing not ready: ${validation.errors.join('; ')}`);
      }
    }

    const auth = getAuthManager();
    if (!auth?.isAuthenticated()) {
      throw new Error('Must be logged in to submit filings');
    }

    this._updateStatus(filingId, FILING_STATUS.SUBMITTING);

    try {
      const res = await fetch(`${this.apiUrl}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeaders(),
        },
        body: JSON.stringify({
          filingId,
          court: filing.court,
          filingType: filing.filingType,
          documentCount: filing.documents.length,
          feeAmount: filing.feeAmount,
          feeWaiverGranted: filing.feeWaiverGranted,
          signatureCertificates: filing.signatureStatus
            .map(s => s.certificate).filter(Boolean),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        this._updateStatus(filingId, FILING_STATUS.ERROR);
        filing.rejectionReason = err.message || `Submission failed (${res.status})`;
        throw new Error(filing.rejectionReason);
      }

      const data = await res.json();
      filing.efspSubmissionId = data.submissionId || data.envelopeId;
      filing.efspConfirmation = data.confirmationNumber || null;
      this._updateStatus(filingId, FILING_STATUS.SUBMITTED);
      this._notify('filing_submitted', filing);

      return {
        filingId,
        submissionId: filing.efspSubmissionId,
        confirmationNumber: filing.efspConfirmation,
        status: FILING_STATUS.SUBMITTED,
      };
    } catch (err) {
      this._notify('filing_error', { filingId, error: err.message });
      throw err;
    }
  }

  // ─── STATUS TRACKING ─────────────────────────────────────────────
  async checkFilingStatus(filingId) {
    const filing = this.filings.get(filingId);
    if (!filing) throw new Error(`Filing ${filingId} not found`);
    if (!filing.efspSubmissionId) return { status: filing.status };

    const auth = getAuthManager();
    try {
      const res = await fetch(
        `${this.apiUrl}/status/${filing.efspSubmissionId}`,
        { headers: auth?.getAuthHeaders() || {} }
      );
      if (!res.ok) return { status: filing.status };

      const data = await res.json();
      const newStatus = this._mapEfspStatus(data.status);
      if (newStatus !== filing.status) {
        this._updateStatus(filingId, newStatus);
      }

      if (newStatus === FILING_STATUS.FILED && data.filedStampedUrl) {
        filing.filedStampedCopy = data.filedStampedUrl;
      }
      if (newStatus === FILING_STATUS.REJECTED) {
        filing.rejectionReason = data.rejectionReason || 'Rejected by court clerk';
      }

      return {
        status: newStatus,
        submissionId: filing.efspSubmissionId,
        filedStampedCopy: filing.filedStampedCopy,
        rejectionReason: filing.rejectionReason,
        efspRawStatus: data.status,
      };
    } catch {
      return { status: filing.status };
    }
  }

  // Poll for status updates
  async pollStatus(filingId, intervalMs = 30000, maxAttempts = 60) {
    let attempts = 0;
    const terminalStatuses = [FILING_STATUS.FILED, FILING_STATUS.REJECTED, FILING_STATUS.ERROR];

    while (attempts < maxAttempts) {
      const result = await this.checkFilingStatus(filingId);
      if (terminalStatuses.includes(result.status)) return result;
      attempts++;
      await new Promise(r => setTimeout(r, intervalMs));
    }
    return { status: this.filings.get(filingId)?.status, timedOut: true };
  }

  // ─── FILING HISTORY ──────────────────────────────────────────────
  getFilingHistory() {
    return [...this.filings.values()]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getFiling(filingId) {
    return this.filings.get(filingId) || null;
  }

  getFilingsByCase(caseNumber) {
    return [...this.filings.values()]
      .filter(f => f.court.caseNumber === caseNumber)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // ─── INTERNAL HELPERS ────────────────────────────────────────────
  _isNewCase(filingType) {
    return ['petition_dissolution'].includes(filingType);
  }

  _isInitialFiling(filingType) {
    return ['petition_dissolution', 'response_dissolution'].includes(filingType);
  }

  _mapEfspStatus(efspStatus) {
    const statusStr = (efspStatus || '').toLowerCase();
    if (statusStr.includes('accept') || statusStr.includes('filed')) return FILING_STATUS.FILED;
    if (statusStr.includes('reject')) return FILING_STATUS.REJECTED;
    if (statusStr.includes('submit') || statusStr.includes('pending')) return FILING_STATUS.SUBMITTED;
    if (statusStr.includes('review')) return FILING_STATUS.ACCEPTED;
    return FILING_STATUS.SUBMITTED;
  }

  _updateStatus(filingId, newStatus) {
    const filing = this.filings.get(filingId);
    if (!filing) return;
    filing.status = newStatus;
    filing.updatedAt = new Date().toISOString();
    filing.statusHistory.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
    });
  }

  // ─── COURT INFO ──────────────────────────────────────────────────
  static getAvailableCourts() {
    return Object.values(COURT_CODES);
  }

  static getCourtInfo(countyCode) {
    return COURT_CODES[countyCode] || null;
  }

  static getFilingFees(filingType) {
    return FILING_FEES[filingType] || null;
  }

  static estimateFees(filingType, feeWaiverGranted = false) {
    if (feeWaiverGranted) return { amount: 0, waived: true };
    const fee = FILING_FEES[filingType];
    if (!fee) return { amount: 0, unknown: true };
    return { amount: fee.base, firstPaper: fee.firstPaper };
  }

  // ─── LISTENERS ───────────────────────────────────────────────────
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  _notify(event, data) {
    this.listeners.forEach(fn => {
      try { fn(event, data); } catch (e) { console.error('EFSP listener error:', e); }
    });
  }

  destroy() {
    this.listeners.clear();
    this.filings.clear();
  }
}

// ─── FACTORY ─────────────────────────────────────────────────────────
let _instance = null;

export function createEFSPGateway(config = {}) {
  if (_instance) return _instance;
  _instance = new EFSPGateway(config);
  return _instance;
}

export function getEFSPGateway() {
  return _instance;
}

export default {
  EFSPGateway,
  createEFSPGateway,
  getEFSPGateway,
  FILING_STATUS,
  COURT_CODES,
  FILING_FEES,
};
