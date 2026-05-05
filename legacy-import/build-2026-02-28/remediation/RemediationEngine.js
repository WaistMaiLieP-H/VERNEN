/**
 * VERNEN™ Remediation Engine
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Transforms audit findings into actionable remediation plans.
 * Generates sequenced task lists with deep links back into the GDN,
 * priority ordering, statutory references, and estimated effort.
 *
 * Pipeline position:
 *   AuditReportGenerator → RemediationEngine → GDN_Navigator
 *   (findings in)        → (playbook out)    → (user fixes)
 *
 * Each remediation step maps to:
 *   - The specific audit finding it addresses
 *   - The form and field(s) requiring correction
 *   - The statutory basis for the correction
 *   - A GDN deep link to navigate directly to the fix
 *   - Estimated time and complexity
 */

// ─── SEVERITY → PRIORITY MAPPING ────────────────────────────────────
const SEVERITY_PRIORITY = {
  critical: 1,    // Filing will be rejected
  high: 2,        // Legal deficiency — may prejudice case
  medium: 3,      // Compliance gap — should fix before filing
  low: 4,         // Best practice — recommended improvement
  info: 5,        // Advisory only
};

const COMPLEXITY = {
  SIMPLE: 'simple',         // Single field edit, < 2 min
  MODERATE: 'moderate',     // Multiple fields or research needed, 5-15 min
  COMPLEX: 'complex',       // Cross-form impact, may need new documents, 15-30 min
  REQUIRES_REVIEW: 'requires_review',  // Attorney consultation recommended
};

// ─── REMEDIATION ENGINE ──────────────────────────────────────────────
export class RemediationEngine {
  constructor(config = {}) {
    this.formRegistry = config.formRegistry || null;
    this.scenarioIndex = config.scenarioIndex || null;
    this.annotations = config.annotations || {};
  }

  /**
   * Generate a remediation playbook from audit findings.
   * @param {Object} auditReport - Output from AuditReportGenerator
   * @returns {Object} Structured remediation playbook
   */
  generatePlaybook(auditReport) {
    if (!auditReport?.findings?.length) {
      return this._emptyPlaybook(auditReport);
    }

    const steps = auditReport.findings
      .map((finding, idx) => this._findingToStep(finding, idx + 1, auditReport))
      .sort((a, b) => a.priority - b.priority || a.sequence - b.sequence);

    // Group by form for efficient navigation
    const byForm = this._groupByForm(steps);

    // Calculate totals
    const summary = this._summarize(steps, auditReport);

    return {
      playbookId: `playbook_${Date.now()}`,
      auditId: auditReport.auditId || null,
      formId: auditReport.formId || null,
      generatedAt: new Date().toISOString(),
      summary,
      steps,
      byForm,
      phases: this._buildPhases(steps),
    };
  }

  // ─── FINDING → STEP CONVERSION ──────────────────────────────────
  _findingToStep(finding, sequence, auditReport) {
    const formId = finding.formId || auditReport.formId;
    const annotation = this.annotations[formId] || null;
    const fieldInfo = this._resolveFieldInfo(finding, annotation);
    const complexity = this._assessComplexity(finding, fieldInfo);
    const estimatedMinutes = this._estimateTime(complexity);

    return {
      stepId: `step_${sequence}`,
      sequence,
      priority: SEVERITY_PRIORITY[finding.severity] || 3,
      severity: finding.severity || 'medium',
      complexity,
      estimatedMinutes,

      // What's wrong
      finding: {
        id: finding.findingId || finding.id || `f_${sequence}`,
        description: finding.description || finding.message,
        category: finding.category || 'compliance',
        severity: finding.severity,
      },

      // What to fix
      remediation: {
        action: this._determineAction(finding),
        instruction: this._generateInstruction(finding, fieldInfo),
        fieldPath: finding.fieldPath || finding.field || null,
        formId,
        formTitle: this._getFormTitle(formId),
        suggestedValue: finding.suggestedValue || null,
        alternatives: finding.alternatives || [],
      },

      // Legal basis
      statutory: {
        citation: finding.citation || finding.statutoryBasis || null,
        code: finding.code || null,
        section: finding.section || null,
        requirement: finding.requirement || null,
      },

      // Navigation
      gdnLink: this._buildGDNLink(formId, finding.fieldPath || finding.field),

      // Status tracking
      status: 'pending',   // pending, in_progress, completed, skipped
      completedAt: null,
      notes: null,
    };
  }

  // ─── INSTRUCTION GENERATION ──────────────────────────────────────
  _determineAction(finding) {
    const category = (finding.category || '').toLowerCase();
    const severity = (finding.severity || '').toLowerCase();

    if (finding.missingField || category === 'missing_required') return 'complete_field';
    if (finding.incorrectValue || category === 'incorrect_value') return 'correct_value';
    if (finding.formattingError || category === 'formatting') return 'reformat';
    if (category === 'missing_document') return 'attach_document';
    if (category === 'missing_signature') return 'sign';
    if (category === 'cross_reference') return 'reconcile';
    if (category === 'procedural') return 'follow_procedure';
    if (severity === 'critical' && category === 'jurisdictional') return 'verify_jurisdiction';
    return 'review_and_correct';
  }

  _generateInstruction(finding, fieldInfo) {
    const action = this._determineAction(finding);
    const fieldLabel = fieldInfo?.label || finding.field || 'this field';

    const instructions = {
      complete_field: `Enter the required information for "${fieldLabel}". ${finding.requirement || ''}`.trim(),
      correct_value: `The current value for "${fieldLabel}" does not meet requirements. ${finding.suggestedValue
        ? `Suggested correction: ${finding.suggestedValue}`
        : finding.requirement || 'Review and correct the entry.'}`,
      reformat: `Reformat "${fieldLabel}" to comply with the required format. ${finding.requirement || ''}`.trim(),
      attach_document: `Attach the required supporting document: ${finding.description || fieldLabel}.`,
      sign: `This form requires a signature at "${fieldLabel}". Review the completed form, then sign.`,
      reconcile: `The value in "${fieldLabel}" must match the corresponding entry on ${finding.crossRefForm || 'the related form'}. Verify both entries are consistent.`,
      follow_procedure: `${finding.description || 'Follow the required procedural step.'}`,
      verify_jurisdiction: `Verify the correct court jurisdiction. ${finding.description || ''}`.trim(),
      review_and_correct: `Review "${fieldLabel}": ${finding.description || finding.message || 'Correction needed.'}`,
    };

    return instructions[action] || instructions.review_and_correct;
  }

  // ─── COMPLEXITY & TIME ESTIMATION ────────────────────────────────
  _assessComplexity(finding, fieldInfo) {
    if (finding.requiresAttorney) return COMPLEXITY.REQUIRES_REVIEW;
    if (finding.crossRefForm || finding.category === 'cross_reference') return COMPLEXITY.COMPLEX;
    if (finding.category === 'missing_document') return COMPLEXITY.COMPLEX;
    if (finding.category === 'jurisdictional') return COMPLEXITY.COMPLEX;
    if (finding.severity === 'critical' && !finding.suggestedValue) return COMPLEXITY.MODERATE;
    if (finding.missingField && finding.suggestedValue) return COMPLEXITY.SIMPLE;
    if (finding.formattingError) return COMPLEXITY.SIMPLE;
    return COMPLEXITY.MODERATE;
  }

  _estimateTime(complexity) {
    const estimates = {
      [COMPLEXITY.SIMPLE]: 2,
      [COMPLEXITY.MODERATE]: 10,
      [COMPLEXITY.COMPLEX]: 25,
      [COMPLEXITY.REQUIRES_REVIEW]: 60,
    };
    return estimates[complexity] || 10;
  }

  // ─── HELPERS ─────────────────────────────────────────────────────
  _resolveFieldInfo(finding, annotation) {
    if (!annotation?.fields || !finding.field) return null;
    return annotation.fields.find(f =>
      f.id === finding.field || f.fieldPath === finding.fieldPath
    ) || null;
  }

  _getFormTitle(formId) {
    if (!formId) return 'Unknown Form';
    if (!this.formRegistry) return formId;
    const entry = Array.isArray(this.formRegistry)
      ? this.formRegistry.find(f => f.id === formId || f.formId === formId)
      : this.formRegistry[formId];
    return entry?.title || entry?.name || formId;
  }

  _buildGDNLink(formId, fieldPath) {
    if (!formId) return null;
    const base = `/gdn/${formId}`;
    return fieldPath ? `${base}?field=${encodeURIComponent(fieldPath)}` : base;
  }

  _groupByForm(steps) {
    const groups = {};
    for (const step of steps) {
      const formId = step.remediation.formId || '_general';
      if (!groups[formId]) {
        groups[formId] = {
          formId,
          formTitle: step.remediation.formTitle,
          steps: [],
          totalEstimatedMinutes: 0,
        };
      }
      groups[formId].steps.push(step);
      groups[formId].totalEstimatedMinutes += step.estimatedMinutes;
    }
    return groups;
  }

  // ─── PHASED EXECUTION PLAN ──────────────────────────────────────
  _buildPhases(steps) {
    return [
      {
        phase: 1,
        name: 'Critical Fixes',
        description: 'Must resolve before filing — rejection or prejudice risk',
        steps: steps.filter(s => s.priority <= 1).map(s => s.stepId),
      },
      {
        phase: 2,
        name: 'High Priority Corrections',
        description: 'Legal deficiencies that may prejudice your case',
        steps: steps.filter(s => s.priority === 2).map(s => s.stepId),
      },
      {
        phase: 3,
        name: 'Compliance Gaps',
        description: 'Should fix before filing for full compliance',
        steps: steps.filter(s => s.priority === 3).map(s => s.stepId),
      },
      {
        phase: 4,
        name: 'Best Practice Improvements',
        description: 'Recommended but not required for filing',
        steps: steps.filter(s => s.priority >= 4).map(s => s.stepId),
      },
    ].filter(p => p.steps.length > 0);
  }

  // ─── SUMMARY ─────────────────────────────────────────────────────
  _summarize(steps, auditReport) {
    const totalMinutes = steps.reduce((sum, s) => sum + s.estimatedMinutes, 0);
    return {
      totalSteps: steps.length,
      byPriority: {
        critical: steps.filter(s => s.severity === 'critical').length,
        high: steps.filter(s => s.severity === 'high').length,
        medium: steps.filter(s => s.severity === 'medium').length,
        low: steps.filter(s => s.severity === 'low').length,
        info: steps.filter(s => s.severity === 'info').length,
      },
      byComplexity: {
        simple: steps.filter(s => s.complexity === COMPLEXITY.SIMPLE).length,
        moderate: steps.filter(s => s.complexity === COMPLEXITY.MODERATE).length,
        complex: steps.filter(s => s.complexity === COMPLEXITY.COMPLEX).length,
        requiresReview: steps.filter(s => s.complexity === COMPLEXITY.REQUIRES_REVIEW).length,
      },
      estimatedTotalMinutes: totalMinutes,
      estimatedTotalDisplay: totalMinutes < 60
        ? `${totalMinutes} minutes`
        : `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
      formsAffected: [...new Set(steps.map(s => s.remediation.formId).filter(Boolean))].length,
      filingReadiness: steps.filter(s => s.severity === 'critical').length === 0
        ? 'Ready with corrections'
        : 'Critical issues must be resolved first',
    };
  }

  _emptyPlaybook(auditReport) {
    return {
      playbookId: `playbook_${Date.now()}`,
      auditId: auditReport?.auditId || null,
      formId: auditReport?.formId || null,
      generatedAt: new Date().toISOString(),
      summary: {
        totalSteps: 0,
        estimatedTotalMinutes: 0,
        estimatedTotalDisplay: '0 minutes',
        filingReadiness: 'No issues found — ready to file',
      },
      steps: [],
      byForm: {},
      phases: [],
    };
  }

  // ─── PROGRESS TRACKING ───────────────────────────────────────────
  // For use with PersistenceManager — track which steps are done
  static updateStepStatus(playbook, stepId, status, notes = null) {
    const step = playbook.steps.find(s => s.stepId === stepId);
    if (!step) return false;
    step.status = status;
    if (status === 'completed') step.completedAt = new Date().toISOString();
    if (notes) step.notes = notes;
    return true;
  }

  static getProgress(playbook) {
    if (!playbook?.steps?.length) return { completed: 0, total: 0, percent: 100 };
    const completed = playbook.steps.filter(s => s.status === 'completed').length;
    const skipped = playbook.steps.filter(s => s.status === 'skipped').length;
    const total = playbook.steps.length;
    const actionable = total - skipped;
    return {
      completed,
      skipped,
      total,
      actionable,
      percent: actionable > 0 ? Math.round((completed / actionable) * 100) : 100,
      remaining: actionable - completed,
      remainingMinutes: playbook.steps
        .filter(s => s.status === 'pending' || s.status === 'in_progress')
        .reduce((sum, s) => sum + s.estimatedMinutes, 0),
    };
  }

  static getNextStep(playbook) {
    return playbook?.steps?.find(s => s.status === 'pending' || s.status === 'in_progress') || null;
  }
}

// ─── EXPORTS ─────────────────────────────────────────────────────────
export { SEVERITY_PRIORITY, COMPLEXITY };

export default RemediationEngine;
