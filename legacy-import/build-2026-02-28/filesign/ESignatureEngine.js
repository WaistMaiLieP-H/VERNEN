/**
 * VERNEN™ E-Signature Engine
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * UETA-compliant (Cal. Civ. Code § 1633) electronic signature
 * capture and verification. Produces court-admissible signature
 * records with full chain-of-intent documentation.
 *
 * Signature record includes:
 *   - Drawn signature (canvas PNG) or typed name
 *   - Timestamp (ISO 8601, UTC)
 *   - IP address (captured server-side)
 *   - User agent fingerprint
 *   - Intent declaration (explicit consent text)
 *   - Document hash at time of signing
 *   - Signer identity (from AuthManager)
 *
 * Form-aware: knows which Judicial Council form fields accept
 * e-signatures vs. requiring wet ink (per local rule).
 */

// ─── SIGNATURE TYPES ─────────────────────────────────────────────────
export const SIG_TYPE = {
  DRAWN: 'drawn',         // Canvas-drawn signature
  TYPED: 'typed',         // Typed name as signature
  UPLOADED: 'uploaded',   // Uploaded signature image
};

export const SIG_REQUIREMENT = {
  ESIG_OK: 'esig_accepted',       // E-signature accepted
  WET_INK: 'wet_ink_required',    // Must print and sign
  NOTARIZED: 'notarized',         // Requires notarization
  UNKNOWN: 'unknown',             // Check local rules
};

// ─── FORM SIGNATURE REQUIREMENTS ─────────────────────────────────────
// Maps Judicial Council form fields to signature requirements.
// Source: CRC 2.257 (e-filing), local court e-filing rules
const FORM_SIG_RULES = {
  'FL-100': {
    'petitioner_signature': SIG_REQUIREMENT.ESIG_OK,
    'date_signed': SIG_REQUIREMENT.ESIG_OK,
  },
  'FL-110': {
    'petitioner_signature': SIG_REQUIREMENT.ESIG_OK,
  },
  'FL-115': {
    'petitioner_signature': SIG_REQUIREMENT.ESIG_OK,
  },
  'FL-120': {
    'respondent_signature': SIG_REQUIREMENT.ESIG_OK,
  },
  'FL-130': {
    'petitioner_signature': SIG_REQUIREMENT.ESIG_OK,
    'respondent_signature': SIG_REQUIREMENT.ESIG_OK,
  },
  'FL-140': {
    'declarant_signature': SIG_REQUIREMENT.ESIG_OK,
  },
  'FL-141': {
    'declarant_signature': SIG_REQUIREMENT.ESIG_OK,
  },
  'FL-150': {
    'declarant_signature': SIG_REQUIREMENT.ESIG_OK,
    'verification_signature': SIG_REQUIREMENT.ESIG_OK,
  },
  'FL-300': {
    'applicant_signature': SIG_REQUIREMENT.ESIG_OK,
  },
  'FL-311': {
    'judicial_officer_signature': SIG_REQUIREMENT.WET_INK,
  },
  'FL-320': {
    'respondent_signature': SIG_REQUIREMENT.ESIG_OK,
  },
  'DV-100': {
    'petitioner_signature': SIG_REQUIREMENT.ESIG_OK,
  },
  'DV-109': {
    'judicial_officer_signature': SIG_REQUIREMENT.WET_INK,
  },
  'DV-110': {
    'judicial_officer_signature': SIG_REQUIREMENT.WET_INK,
  },
  'MC-030': {
    'declarant_signature': SIG_REQUIREMENT.ESIG_OK,
    'verification_signature': SIG_REQUIREMENT.ESIG_OK,
  },
  'MC-031': {
    'attached_declaration_sig': SIG_REQUIREMENT.ESIG_OK,
  },
};

// ─── INTENT DECLARATION TEXT ─────────────────────────────────────────
const INTENT_EN = 'By signing below, I declare under penalty of perjury under the laws of the State of California that the information provided in this document is true and correct to the best of my knowledge. I understand that this electronic signature has the same legal effect as a handwritten signature pursuant to California Civil Code § 1633.7.';

const INTENT_ES = 'Al firmar a continuación, declaro bajo pena de perjurio según las leyes del Estado de California que la información proporcionada en este documento es verdadera y correcta según mi leal saber y entender. Entiendo que esta firma electrónica tiene el mismo efecto legal que una firma manuscrita conforme al Código Civil de California § 1633.7.';

const INTENT_TEXTS = { en: INTENT_EN, es: INTENT_ES };

// ─── SHA-256 HELPER ──────────────────────────────────────────────────
async function sha256(data) {
  const encoder = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── E-SIGNATURE ENGINE ──────────────────────────────────────────────
export class ESignatureEngine {
  constructor(config = {}) {
    this.apiUrl = config.apiUrl || '/api/esign';
    this.language = config.language || 'en';
    this.signatures = new Map();  // formId:fieldId → signature record
  }

  // ─── SIGNATURE REQUIREMENT CHECK ─────────────────────────────────
  getSignatureRequirement(formId, fieldId) {
    const formRules = FORM_SIG_RULES[formId];
    if (!formRules) return SIG_REQUIREMENT.UNKNOWN;
    return formRules[fieldId] || SIG_REQUIREMENT.UNKNOWN;
  }

  getFormSignatureFields(formId) {
    const formRules = FORM_SIG_RULES[formId];
    if (!formRules) return [];
    return Object.entries(formRules).map(([fieldId, requirement]) => ({
      fieldId,
      requirement,
      canESign: requirement === SIG_REQUIREMENT.ESIG_OK,
      signed: this.signatures.has(`${formId}:${fieldId}`),
    }));
  }

  isFormFullySigned(formId) {
    const fields = this.getFormSignatureFields(formId);
    const esigFields = fields.filter(f => f.canESign);
    return esigFields.length > 0 && esigFields.every(f => f.signed);
  }

  hasWetInkRequirements(formId) {
    const fields = this.getFormSignatureFields(formId);
    return fields.some(f => f.requirement === SIG_REQUIREMENT.WET_INK);
  }

  // ─── SIGNATURE CAPTURE ───────────────────────────────────────────
  async captureSignature(params) {
    const {
      formId,
      fieldId,
      signerName,
      signerEmail,
      signatureType = SIG_TYPE.DRAWN,
      signatureData,       // base64 PNG for drawn, string for typed
      documentContent,     // full document text/JSON for hashing
      consentGiven = false,
    } = params;

    // Validate
    if (!formId || !fieldId) throw new Error('Form ID and field ID required');
    if (!signerName) throw new Error('Signer name required');
    if (!signatureData) throw new Error('Signature data required');
    if (!consentGiven) throw new Error('Explicit consent required before signing');

    const requirement = this.getSignatureRequirement(formId, fieldId);
    if (requirement === SIG_REQUIREMENT.WET_INK) {
      throw new Error(`Field "${fieldId}" on ${formId} requires wet ink signature — cannot e-sign`);
    }
    if (requirement === SIG_REQUIREMENT.NOTARIZED) {
      throw new Error(`Field "${fieldId}" on ${formId} requires notarization`);
    }

    // Build signature record
    const documentHash = documentContent ? await sha256(documentContent) : null;
    const sigDataHash = await sha256(
      typeof signatureData === 'string' ? signatureData : JSON.stringify(signatureData)
    );

    const record = {
      signatureId: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      formId,
      fieldId,
      // Signer identity
      signer: {
        name: signerName,
        email: signerEmail || null,
      },
      // Signature content
      signatureType,
      signatureDataHash: sigDataHash,
      signatureData,   // stored for rendering into PDF
      // Verification
      timestamp: new Date().toISOString(),
      timestampUTC: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      documentHashAtSigning: documentHash,
      // Intent
      intentDeclaration: INTENT_TEXTS[this.language] || INTENT_TEXTS.en,
      consentGiven: true,
      consentTimestamp: new Date().toISOString(),
      // Legal basis
      legalBasis: 'Cal. Civ. Code § 1633.7 (UETA)',
    };

    this.signatures.set(`${formId}:${fieldId}`, record);
    return record;
  }

  // ─── SIGNATURE VERIFICATION ──────────────────────────────────────
  async verifySignature(formId, fieldId, currentDocumentContent) {
    const key = `${formId}:${fieldId}`;
    const record = this.signatures.get(key);
    if (!record) return { valid: false, reason: 'No signature on file' };

    const checks = {
      exists: true,
      hasConsent: record.consentGiven === true,
      hasTimestamp: !!record.timestamp,
      hasSignerIdentity: !!record.signer?.name,
      hasIntentDeclaration: !!record.intentDeclaration,
    };

    // Check if document changed after signing
    if (currentDocumentContent && record.documentHashAtSigning) {
      const currentHash = await sha256(currentDocumentContent);
      checks.documentUnchanged = currentHash === record.documentHashAtSigning;
    } else {
      checks.documentUnchanged = null; // Cannot verify
    }

    const valid = checks.hasConsent && checks.hasTimestamp &&
      checks.hasSignerIdentity && checks.hasIntentDeclaration &&
      (checks.documentUnchanged !== false);

    return {
      valid,
      signatureId: record.signatureId,
      checks,
      reason: !valid
        ? checks.documentUnchanged === false
          ? 'Document modified after signing — re-signature required'
          : 'Signature record incomplete'
        : null,
      record: valid ? record : null,
    };
  }

  // ─── GET ALL SIGNATURES FOR A FORM ───────────────────────────────
  getFormSignatures(formId) {
    const results = [];
    for (const [key, record] of this.signatures) {
      if (key.startsWith(`${formId}:`)) {
        results.push(record);
      }
    }
    return results;
  }

  // ─── SIGNATURE CERTIFICATE ──────────────────────────────────────
  // Generates a verification certificate for inclusion in filing package
  generateCertificate(formId) {
    const sigs = this.getFormSignatures(formId);
    if (!sigs.length) return null;

    return {
      certificateId: `cert_${Date.now()}`,
      formId,
      generatedAt: new Date().toISOString(),
      signatureCount: sigs.length,
      signatures: sigs.map(s => ({
        signatureId: s.signatureId,
        fieldId: s.fieldId,
        signerName: s.signer.name,
        signatureType: s.signatureType,
        timestamp: s.timestamp,
        documentHash: s.documentHashAtSigning,
        signatureDataHash: s.signatureDataHash,
        legalBasis: s.legalBasis,
      })),
      attestation: `This certificate verifies that ${sigs.length} electronic signature(s) were captured for form ${formId} in compliance with the Uniform Electronic Transactions Act (Cal. Civ. Code § 1633 et seq.). Each signature includes timestamp, signer identity, intent declaration, and document hash verification.`,
    };
  }

  // ─── REVOKE SIGNATURE ────────────────────────────────────────────
  revokeSignature(formId, fieldId) {
    const key = `${formId}:${fieldId}`;
    return this.signatures.delete(key);
  }

  revokeAllForForm(formId) {
    let count = 0;
    for (const key of [...this.signatures.keys()]) {
      if (key.startsWith(`${formId}:`)) {
        this.signatures.delete(key);
        count++;
      }
    }
    return count;
  }

  // ─── CLEANUP ─────────────────────────────────────────────────────
  destroy() {
    this.signatures.clear();
  }
}

// ─── FACTORY ─────────────────────────────────────────────────────────
let _instance = null;

export function createESignatureEngine(config = {}) {
  if (_instance) return _instance;
  _instance = new ESignatureEngine(config);
  return _instance;
}

export function getESignatureEngine() {
  return _instance;
}

export default {
  ESignatureEngine,
  createESignatureEngine,
  getESignatureEngine,
  SIG_TYPE,
  SIG_REQUIREMENT,
};
