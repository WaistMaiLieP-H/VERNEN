/**
 * VERNEN™ Validation Results Component
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Renders form validation findings with severity indicators,
 * compliance scores, and filing readiness assessment.
 */

import { useState, useMemo } from "react";
import { validateForm, validateFilingPackage, SEVERITY, getSupportedForms, getRulesForForm } from "./FormValidationEngine";

// ─── SEVERITY STYLES ─────────────────────────────────────────────────
const SEVERITY_STYLES = {
  [SEVERITY.ERROR]: {
    bg: "bg-red-50", border: "border-red-200", text: "text-red-800",
    icon: "🚫", label: "Error — Filing will be rejected",
    badge: "bg-red-100 text-red-700",
  },
  [SEVERITY.WARNING]: {
    bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800",
    icon: "⚠️", label: "Warning — May cause delay",
    badge: "bg-amber-100 text-amber-700",
  },
  [SEVERITY.INFO]: {
    bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800",
    icon: "ℹ️", label: "Best Practice",
    badge: "bg-blue-100 text-blue-700",
  },
};

// ─── SCORE RING COMPONENT ────────────────────────────────────────────
function ScoreRing({ score, size = 120 }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

// ─── FINDING CARD ────────────────────────────────────────────────────
function FindingCard({ finding }) {
  const style = SEVERITY_STYLES[finding.severity];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg p-3 mb-2`}>
      <div className="flex items-start gap-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <span className="text-lg flex-shrink-0">{style.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${style.badge}`}>
              {finding.ruleId}
            </span>
            <span className={`text-sm font-medium ${style.text}`}>
              {finding.description}
            </span>
          </div>
          {(expanded || finding.severity === SEVERITY.ERROR) && (
            <p className={`text-sm mt-1 ${style.text} opacity-80`}>
              {finding.message}
            </p>
          )}
          {finding.missingForms && (
            <div className="flex gap-1 mt-2">
              {finding.missingForms.map((f) => (
                <span key={f} className="text-xs font-mono px-2 py-0.5 bg-white rounded border border-slate-200">
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
        <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

// ─── MAIN VALIDATION RESULTS COMPONENT ───────────────────────────────
export default function ValidationResults({ formId, fields, companionForms = [] }) {
  const [showAllRules, setShowAllRules] = useState(false);

  const result = useMemo(
    () => validateForm(formId, fields, companionForms),
    [formId, fields, companionForms]
  );

  const allRules = useMemo(
    () => getRulesForForm(formId),
    [formId]
  );

  const totalRuleCount =
    allRules.universal.length +
    allRules.formSpecific.length +
    allRules.deadlines.length +
    allRules.crossForm.length;

  const allFindings = [
    ...result.errors,
    ...result.warnings,
    ...result.info,
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 rounded-t-xl">
        <h2 className="text-lg font-bold">
          VERNEN™ <span className="font-light">Pre-Filing Compliance Check</span>
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {formId} · {totalRuleCount} rules checked · {new Date(result.timestamp).toLocaleString()}
        </p>
      </div>

      <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl">
        {/* Score + Summary */}
        <div className="p-6 flex items-center gap-6 border-b border-slate-200">
          <ScoreRing score={result.score} />
          <div className="flex-1">
            <div className={`text-xl font-bold ${result.passed ? "text-emerald-600" : "text-red-600"}`}>
              {result.passed ? "✓ Ready to File" : "✗ Not Ready — Issues Found"}
            </div>
            <div className="flex gap-4 mt-3">
              {result.errors.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-slate-600">{result.errors.length} error{result.errors.length !== 1 ? "s" : ""}</span>
                </div>
              )}
              {result.warnings.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm text-slate-600">{result.warnings.length} warning{result.warnings.length !== 1 ? "s" : ""}</span>
                </div>
              )}
              {result.info.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-slate-600">{result.info.length} tip{result.info.length !== 1 ? "s" : ""}</span>
                </div>
              )}
              {allFindings.length === 0 && (
                <span className="text-sm text-emerald-600">All checks passed</span>
              )}
            </div>
          </div>
        </div>

        {/* Findings */}
        {allFindings.length > 0 && (
          <div className="p-6">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
              Findings ({allFindings.length})
            </h3>
            {/* Errors first */}
            {result.errors.map((f, i) => <FindingCard key={`e-${i}`} finding={f} />)}
            {result.warnings.map((f, i) => <FindingCard key={`w-${i}`} finding={f} />)}
            {result.info.map((f, i) => <FindingCard key={`i-${i}`} finding={f} />)}
          </div>
        )}

        {/* Rule coverage */}
        <div className="px-6 pb-6">
          <button
            onClick={() => setShowAllRules(!showAllRules)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showAllRules ? "Hide" : "Show"} all {totalRuleCount} rules checked
          </button>
          {showAllRules && (
            <div className="mt-3 bg-slate-50 rounded-lg p-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium text-slate-700">Universal Rules:</span>{" "}
                  <span className="text-slate-500">{allRules.universal.length}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Form-Specific:</span>{" "}
                  <span className="text-slate-500">{allRules.formSpecific.length}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Deadline Rules:</span>{" "}
                  <span className="text-slate-500">{allRules.deadlines.length}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Cross-Form:</span>{" "}
                  <span className="text-slate-500">{allRules.crossForm.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 rounded-b-xl">
          <p className="text-xs text-slate-400 text-center">
            © 2024–2026 Michael Vernen Thomas Hartmann. VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
            Validation results are guidance only — verify with court clerk before filing.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Standalone validation runner for batch/package validation.
 * Use when validating multiple forms being filed together.
 */
export function FilingPackageValidator({ forms }) {
  const result = useMemo(
    () => validateFilingPackage(forms),
    [forms]
  );

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-lg border ${
        result.overallPassed
          ? "bg-emerald-50 border-emerald-200"
          : "bg-red-50 border-red-200"
      }`}>
        <div className="font-bold text-lg">
          {result.overallPassed ? "✓ Filing Package Ready" : "✗ Filing Package Has Issues"}
        </div>
        <p className="text-sm mt-1 text-slate-600">
          {result.forms.length} forms · {result.totalErrors} errors · {result.totalWarnings} warnings
        </p>
      </div>
      {result.forms.map((formResult, idx) => (
        <ValidationResults
          key={idx}
          formId={formResult.formId}
          fields={forms[idx]?.fields || {}}
          companionForms={forms.map((f) => f.formId)}
        />
      ))}
    </div>
  );
}
