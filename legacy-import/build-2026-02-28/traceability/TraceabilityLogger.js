/**
 * VERNEN™ Statutory Traceability Log
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Records every statutory source consulted during an audit run.
 * Produces a verifiable PDF appendix showing:
 *   - Which code sections were consulted
 *   - Version/effective date of the statute
 *   - Retrieval timestamp
 *   - Content hash (SHA-256) of retrieved text
 *   - Which audit finding referenced the source
 *   - Platform version and engine version
 *
 * Compliance targets:
 *   - EU AI Act Art. 13 (transparency), Art. 14 (human oversight)
 *   - Colorado SB 24-205 (AI transparency in consequential decisions)
 *   - California SB 942 (AI transparency, effective 2026)
 *
 * Architecture:
 *   AuditReportGenerator → TraceabilityLogger.log() at each lookup
 *   TraceabilityLogger.finalize() → structured JSON + PDF render
 */

// ─── CONSTANTS ───────────────────────────────────────────────────────
const PLATFORM_VERSION = '1.0.0-beta';
const ENGINE_VERSION = '1.0.0';

function sha256(text) {
  // Browser-native SHA-256
  const encoder = new TextEncoder();
  return crypto.subtle.digest('SHA-256', encoder.encode(text))
    .then(buf => Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0')).join(''));
}

// ─── LOG ENTRY TYPES ─────────────────────────────────────────────────
export const SOURCE_TYPES = {
  CA_STATUTE: 'california_statute',
  CA_REGULATION: 'california_regulation',
  CA_RULE_OF_COURT: 'california_rule_of_court',
  US_CODE: 'us_code',
  CASE_LAW: 'case_law',
  JUDICIAL_COUNCIL_FORM: 'judicial_council_form',
  LOCAL_RULE: 'local_rule',
  SECONDARY_SOURCE: 'secondary_source',
};

// ─── TRACEABILITY LOGGER ─────────────────────────────────────────────
export class TraceabilityLogger {
  constructor(config = {}) {
    this.sessionId = config.sessionId || `trace_${Date.now()}`;
    this.auditId = config.auditId || null;
    this.formId = config.formId || null;
    this.userId = config.userId || 'anonymous';
    this.language = config.language || 'en';
    this.entries = [];
    this.startTime = new Date().toISOString();
    this.finalized = false;
    this.metadata = {
      platformVersion: PLATFORM_VERSION,
      engineVersion: ENGINE_VERSION,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  // ─── CORE LOGGING ────────────────────────────────────────────────
  async log(entry) {
    if (this.finalized) {
      console.warn('TraceabilityLogger: Cannot log after finalization');
      return null;
    }

    const contentHash = entry.retrievedText
      ? await sha256(entry.retrievedText)
      : null;

    const record = {
      entryId: `${this.sessionId}_${this.entries.length + 1}`,
      sequence: this.entries.length + 1,
      timestamp: new Date().toISOString(),
      sourceType: entry.sourceType || SOURCE_TYPES.CA_STATUTE,
      // Source identification
      citation: {
        code: entry.code || null,           // e.g., "FAM", "CCP", "PEN"
        section: entry.section || null,     // e.g., "3044", "271"
        title: entry.title || null,         // e.g., "11" (CCR title)
        rule: entry.rule || null,           // e.g., "5.220" (CRC)
        fullCitation: entry.fullCitation || null,  // human-readable
      },
      // Version & retrieval
      effectiveDate: entry.effectiveDate || null,
      retrievalTimestamp: new Date().toISOString(),
      contentHash,
      contentLength: entry.retrievedText?.length || 0,
      // Audit linkage
      findingId: entry.findingId || null,
      findingDescription: entry.findingDescription || null,
      severity: entry.severity || null,
      // Context
      purpose: entry.purpose || 'compliance_check',
      formField: entry.formField || null,
    };

    this.entries.push(record);
    return record;
  }

  // ─── CONVENIENCE LOGGERS ─────────────────────────────────────────
  async logStatute(code, section, text, findingId = null) {
    return this.log({
      sourceType: SOURCE_TYPES.CA_STATUTE,
      code,
      section,
      fullCitation: `Cal. ${code} Code § ${section}`,
      retrievedText: text,
      findingId,
    });
  }

  async logRegulation(title, section, text, findingId = null) {
    return this.log({
      sourceType: SOURCE_TYPES.CA_REGULATION,
      title,
      section,
      fullCitation: `${title} CCR § ${section}`,
      retrievedText: text,
      findingId,
    });
  }

  async logRuleOfCourt(rule, text, findingId = null) {
    return this.log({
      sourceType: SOURCE_TYPES.CA_RULE_OF_COURT,
      rule,
      fullCitation: `CRC Rule ${rule}`,
      retrievedText: text,
      findingId,
    });
  }

  async logUSCode(title, section, text, findingId = null) {
    return this.log({
      sourceType: SOURCE_TYPES.US_CODE,
      title,
      section,
      fullCitation: `${title} U.S.C. § ${section}`,
      retrievedText: text,
      findingId,
    });
  }

  // ─── FINALIZATION ────────────────────────────────────────────────
  async finalize() {
    if (this.finalized) return this.getReport();
    this.finalized = true;
    this.endTime = new Date().toISOString();

    // Generate integrity hash of entire log
    const logContent = JSON.stringify(this.entries);
    this.logHash = await sha256(logContent);

    return this.getReport();
  }

  getReport() {
    return {
      reportId: this.sessionId,
      auditId: this.auditId,
      formId: this.formId,
      userId: this.userId,
      language: this.language,
      startTime: this.startTime,
      endTime: this.endTime || null,
      finalized: this.finalized,
      metadata: this.metadata,
      summary: {
        totalSourcesConsulted: this.entries.length,
        uniqueStatutes: [...new Set(this.entries
          .filter(e => e.sourceType === SOURCE_TYPES.CA_STATUTE)
          .map(e => e.citation.fullCitation))].length,
        uniqueRegulations: [...new Set(this.entries
          .filter(e => e.sourceType === SOURCE_TYPES.CA_REGULATION)
          .map(e => e.citation.fullCitation))].length,
        uniqueRules: [...new Set(this.entries
          .filter(e => e.sourceType === SOURCE_TYPES.CA_RULE_OF_COURT)
          .map(e => e.citation.fullCitation))].length,
        findingsLinked: [...new Set(this.entries
          .filter(e => e.findingId).map(e => e.findingId))].length,
        sourceTypes: this._countByField('sourceType'),
      },
      logIntegrityHash: this.logHash || null,
      entries: this.entries,
    };
  }

  _countByField(field) {
    return this.entries.reduce((acc, e) => {
      acc[e[field]] = (acc[e[field]] || 0) + 1;
      return acc;
    }, {});
  }

  // ─── PDF RENDER DATA ─────────────────────────────────────────────
  // Returns structured data for PDF generation via ExportEngine
  toPDFData() {
    const report = this.getReport();
    return {
      title: 'Statutory Traceability Log',
      subtitle: `Audit Session: ${this.sessionId}`,
      generatedAt: new Date().toISOString(),
      sections: [
        {
          heading: 'Log Overview',
          type: 'key_value',
          data: {
            'Report ID': report.reportId,
            'Audit ID': report.auditId || 'N/A',
            'Form Audited': report.formId || 'N/A',
            'Session Start': new Date(report.startTime).toLocaleString(),
            'Session End': report.endTime ? new Date(report.endTime).toLocaleString() : 'In Progress',
            'Platform Version': report.metadata.platformVersion,
            'Engine Version': report.metadata.engineVersion,
            'Log Integrity Hash': report.logIntegrityHash || 'Pending finalization',
          },
        },
        {
          heading: 'Sources Consulted Summary',
          type: 'key_value',
          data: {
            'Total Sources Consulted': report.summary.totalSourcesConsulted,
            'Unique Statutes': report.summary.uniqueStatutes,
            'Unique Regulations': report.summary.uniqueRegulations,
            'Unique Rules of Court': report.summary.uniqueRules,
            'Audit Findings Linked': report.summary.findingsLinked,
          },
        },
        {
          heading: 'Detailed Source Log',
          type: 'table',
          columns: ['#', 'Timestamp', 'Source Type', 'Citation', 'Content Hash', 'Finding Linked'],
          rows: report.entries.map(e => [
            e.sequence,
            new Date(e.timestamp).toLocaleString(),
            e.sourceType.replace(/_/g, ' '),
            e.citation.fullCitation || 'N/A',
            e.contentHash ? `${e.contentHash.slice(0, 12)}...` : 'N/A',
            e.findingId || '—',
          ]),
        },
        {
          heading: 'Compliance Attestation',
          type: 'text',
          content: [
            'This Statutory Traceability Log was generated automatically by VERNEN™ to document all legal sources consulted during the above audit session.',
            `All statutory text was retrieved from official California Legislative Information (leginfo.legislature.ca.gov) and related authoritative sources. Content hashes (SHA-256) verify the exact text analyzed at the recorded timestamps.`,
            'This log is provided to support due diligence documentation and judicial transparency requirements. It does not constitute legal advice.',
            `Generated by VERNEN™ v${PLATFORM_VERSION} — © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.`,
          ],
        },
      ],
    };
  }

  // ─── SERIALIZATION ───────────────────────────────────────────────
  toJSON() {
    return JSON.stringify(this.getReport(), null, 2);
  }

  static fromJSON(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    const logger = new TraceabilityLogger({
      sessionId: data.reportId,
      auditId: data.auditId,
      formId: data.formId,
      userId: data.userId,
      language: data.language,
    });
    logger.entries = data.entries || [];
    logger.startTime = data.startTime;
    logger.endTime = data.endTime;
    logger.finalized = data.finalized;
    logger.logHash = data.logIntegrityHash;
    logger.metadata = data.metadata;
    return logger;
  }
}

// ─── FACTORY ─────────────────────────────────────────────────────────
const _activeLogs = new Map();

export function createTraceabilityLog(config = {}) {
  const logger = new TraceabilityLogger(config);
  _activeLogs.set(logger.sessionId, logger);
  return logger;
}

export function getTraceabilityLog(sessionId) {
  return _activeLogs.get(sessionId) || null;
}

export function getAllActiveLogs() {
  return [..._activeLogs.values()].filter(l => !l.finalized);
}

export function clearFinalizedLogs() {
  for (const [id, log] of _activeLogs) {
    if (log.finalized) _activeLogs.delete(id);
  }
}

export default {
  TraceabilityLogger,
  createTraceabilityLog,
  getTraceabilityLog,
  SOURCE_TYPES,
};
