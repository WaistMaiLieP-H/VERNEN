/**
 * VERNEN™ Guided Document Navigator (GDN)
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Core interactive component: loads form_registry, scenario_index,
 * and field-level annotation files to provide guided document
 * completion across 13 languages and 28 California Judicial Council forms.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import DataLayer from "../data/DataLayerConnector";

// ─── CONSTANTS ───────────────────────────────────────────────────────
const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "zh", label: "Chinese (Simplified)", native: "中文" },
  { code: "tl", label: "Tagalog", native: "Tagalog" },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt" },
  { code: "ko", label: "Korean", native: "한국어" },
  { code: "hy", label: "Armenian", native: "Հայերեն" },
  { code: "fa", label: "Farsi", native: "فارسی" },
  { code: "ar", label: "Arabic", native: "العربية" },
  { code: "ru", label: "Russian", native: "Русский" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
];

const FORM_TIERS = {
  A: {
    label: "Tier A — Core Family Law & DV",
    forms: [
      "FL-100","FL-110","FL-115","FL-120","FL-130","FL-140","FL-141",
      "FL-300","FL-305","FL-310","FL-311","FL-312","FL-320","FL-341",
      "DV-100","DV-109","DV-110","MC-030","MC-031","FW-001","FW-003",
    ],
  },
  B: {
    label: "Tier B — Financial, Property, Service & Appeals",
    forms: ["FL-150","FL-142","FL-160","FL-341D","FL-335","FL-330","SC-100","APP-002"],
  },
  C: {
    label: "Tier C — Juvenile, Civil Harassment, Housing, Elder Abuse, Criminal",
    forms: ["JV-100","CH-100","UD-100","EA-100","CR-160"],
  },
};

const DIFFICULTY_COLORS = {
  easy: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  moderate: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  complex: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
};

// ─── NAVIGATOR MODES ─────────────────────────────────────────────────
const MODES = {
  SCENARIO: "scenario",    // User describes situation → matched forms
  BROWSE: "browse",        // Browse all forms by tier
  FIELD_GUIDE: "field",    // Field-by-field walkthrough for selected form
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────
export default function GDN_Navigator() {
  // State
  const [mode, setMode] = useState(MODES.BROWSE);
  const [language, setLanguage] = useState("en");
  const [selectedTier, setSelectedTier] = useState("A");
  const [selectedForm, setSelectedForm] = useState(null);
  const [formAnnotation, setFormAnnotation] = useState(null);
  const [formRegistry, setFormRegistry] = useState(null);
  const [scenarioIndex, setScenarioIndex] = useState(null);
  const [activeFieldIndex, setActiveFieldIndex] = useState(0);
  const [scenarioMatch, setScenarioMatch] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [completedFields, setCompletedFields] = useState(new Set());
  const [userNotes, setUserNotes] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ─── DATA LOADING (via DataLayerConnector) ────────────────────────
  const loadFormRegistry = useCallback(async () => {
    try {
      const registry = await DataLayer.getFormRegistry();
      setFormRegistry(registry);
    } catch (err) {
      console.warn("Form registry load failed, using embedded catalog:", err);
      setFormRegistry({ forms: buildEmbeddedCatalog() });
    }
  }, []);

  const loadScenarioIndex = useCallback(async () => {
    try {
      const index = await DataLayer.getScenarioIndex();
      setScenarioIndex(index);
    } catch (err) {
      console.warn("Scenario index load failed:", err);
    }
  }, []);

  const loadFormAnnotation = useCallback(async (formId) => {
    setLoading(true);
    setError(null);
    try {
      const annotation = await DataLayer.getAnnotation(formId);
      if (!annotation) throw new Error(`No annotation found for ${formId}`);
      setFormAnnotation(annotation);
      setActiveFieldIndex(0);
      setCompletedFields(new Set());
    } catch (err) {
      setError(`Could not load annotations for ${formId}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFormRegistry(); loadScenarioIndex(); }, [loadFormRegistry, loadScenarioIndex]);

  useEffect(() => {
    if (selectedForm) loadFormAnnotation(selectedForm);
  }, [selectedForm, loadFormAnnotation]);

  // ─── SCENARIO MATCHING ───────────────────────────────────────────
  const matchScenarios = useCallback((query) => {
    if (!scenarioIndex?.scenarios || !query.trim()) return [];
    const terms = query.toLowerCase().split(/\s+/);
    return scenarioIndex.scenarios
      .map((s) => {
        const text = [
          s.title?.[language] || s.title?.en || "",
          s.description?.[language] || s.description?.en || "",
          ...(s.keywords || []),
        ].join(" ").toLowerCase();
        const score = terms.reduce((acc, t) => acc + (text.includes(t) ? 1 : 0), 0);
        return { ...s, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [scenarioIndex, language]);

  // ─── FIELD HELPERS ───────────────────────────────────────────────
  const currentFields = useMemo(() => {
    if (!formAnnotation?.fields) return [];
    return formAnnotation.fields;
  }, [formAnnotation]);

  const currentField = currentFields[activeFieldIndex] || null;

  const getLocalizedText = useCallback((obj, fallback = "") => {
    if (!obj) return fallback;
    if (typeof obj === "string") return obj;
    return obj[language] || obj.en || fallback;
  }, [language]);

  const progressPercent = currentFields.length
    ? Math.round((completedFields.size / currentFields.length) * 100)
    : 0;

  const toggleFieldComplete = (idx) => {
    setCompletedFields((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  // ─── EMBEDDED CATALOG (fallback) ─────────────────────────────────
  function buildEmbeddedCatalog() {
    const allForms = [];
    Object.entries(FORM_TIERS).forEach(([tier, data]) => {
      data.forms.forEach((id) => {
        allForms.push({
          form_id: id,
          tier,
          title: { en: id },
          domain: data.label,
        });
      });
    });
    return allForms;
  }

  // ─── RENDER: HEADER ──────────────────────────────────────────────
  const renderHeader = () => (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 rounded-t-xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            VERNEN™ <span className="font-light">Guided Document Navigator</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            28 forms · 13 languages · 10 legal domains
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Language selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-slate-700 text-white text-sm rounded-lg px-3 py-1.5 border border-slate-600 focus:ring-2 focus:ring-blue-500"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.native} ({l.label})
              </option>
            ))}
          </select>
          {/* Mode tabs */}
          <div className="flex bg-slate-700 rounded-lg p-0.5">
            {[
              { key: MODES.BROWSE, label: "Browse" },
              { key: MODES.SCENARIO, label: "Find My Forms" },
              { key: MODES.FIELD_GUIDE, label: "Field Guide", disabled: !selectedForm },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => !tab.disabled && setMode(tab.key)}
                disabled={tab.disabled}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  mode === tab.key
                    ? "bg-blue-600 text-white"
                    : tab.disabled
                    ? "text-slate-500 cursor-not-allowed"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ─── RENDER: BROWSE MODE ─────────────────────────────────────────
  const renderBrowseMode = () => (
    <div className="p-6">
      {/* Tier tabs */}
      <div className="flex gap-2 mb-6">
        {Object.entries(FORM_TIERS).map(([key, data]) => (
          <button
            key={key}
            onClick={() => setSelectedTier(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedTier === key
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tier {key} ({data.forms.length})
          </button>
        ))}
      </div>
      <p className="text-slate-500 text-sm mb-4">{FORM_TIERS[selectedTier].label}</p>
      {/* Form grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {FORM_TIERS[selectedTier].forms.map((formId) => {
          const regEntry = formRegistry?.forms?.find(
            (f) => f.form_id === formId || f.id === formId
          );
          const title = regEntry
            ? getLocalizedText(regEntry.title, formId)
            : formId;
          return (
            <button
              key={formId}
              onClick={() => {
                setSelectedForm(formId);
                setMode(MODES.FIELD_GUIDE);
              }}
              className={`text-left p-4 rounded-lg border transition-all hover:shadow-md ${
                selectedForm === formId
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-blue-300"
              }`}
            >
              <div className="font-mono text-sm font-bold text-blue-700">{formId}</div>
              <div className="text-sm text-slate-700 mt-1 line-clamp-2">{title}</div>
              {regEntry?.domain && (
                <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                  {getLocalizedText(regEntry.domain, "")}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ─── RENDER: SCENARIO MODE ───────────────────────────────────────
  const renderScenarioMode = () => {
    const matches = matchScenarios(searchQuery);
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">
            {getLocalizedText({
              en: "Describe your situation",
              es: "Describa su situación",
              zh: "描述您的情况",
              tl: "Ilarawan ang iyong sitwasyon",
            }, "Describe your situation")}
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            {getLocalizedText({
              en: "We'll match you with the right California court forms.",
              es: "Le emparejaremos con los formularios judiciales correctos de California.",
              zh: "我们将为您匹配正确的加州法院表格。",
            }, "We'll match you with the right California court forms.")}
          </p>
          <textarea
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={getLocalizedText({
              en: "e.g., I need to file for divorce and request custody of my children...",
              es: "ej., Necesito solicitar el divorcio y pedir la custodia de mis hijos...",
              zh: "例如，我需要申请离婚并要求孩子的监护权...",
            }, "Describe your situation...")}
            className="w-full p-4 border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
          />
          {/* Matched scenarios */}
          {matches.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                Matched Scenarios ({matches.length})
              </h3>
              {matches.map((s, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="font-medium text-slate-800">
                    {getLocalizedText(s.title, s.scenario_id)}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {getLocalizedText(s.description, "")}
                  </p>
                  {s.required_forms && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {s.required_forms.map((fId) => (
                        <button
                          key={fId}
                          onClick={() => {
                            setSelectedForm(fId);
                            setMode(MODES.FIELD_GUIDE);
                          }}
                          className="text-xs font-mono px-2 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                        >
                          {fId}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {searchQuery.trim() && matches.length === 0 && (
            <p className="mt-4 text-sm text-slate-400">
              No matching scenarios found. Try different keywords or browse forms directly.
            </p>
          )}
        </div>
      </div>
    );
  };

  // ─── RENDER: FIELD GUIDE MODE ────────────────────────────────────
  const renderFieldGuide = () => {
    if (!selectedForm) return (
      <div className="p-6 text-center text-slate-400">
        Select a form from Browse or Find My Forms to begin.
      </div>
    );

    if (loading) return (
      <div className="p-6 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-sm text-slate-500 mt-3">Loading {selectedForm} annotations...</p>
      </div>
    );

    if (error) return (
      <div className="p-6 text-center text-red-500 text-sm">{error}</div>
    );

    if (!formAnnotation || currentFields.length === 0) return (
      <div className="p-6 text-center text-slate-400">
        No field annotations available for {selectedForm}.
      </div>
    );

    return (
      <div className="flex flex-col lg:flex-row">
        {/* Left: Field list */}
        <div className="w-full lg:w-80 border-r border-slate-200 overflow-y-auto max-h-[600px]">
          <div className="p-3 bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-sm font-bold text-blue-700">{selectedForm}</span>
              <span className="text-xs text-slate-500">
                {completedFields.size}/{currentFields.length} fields
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          {currentFields.map((field, idx) => {
            const diff = field.difficulty || "moderate";
            const colors = DIFFICULTY_COLORS[diff] || DIFFICULTY_COLORS.moderate;
            const isActive = idx === activeFieldIndex;
            const isDone = completedFields.has(idx);
            return (
              <button
                key={idx}
                onClick={() => setActiveFieldIndex(idx)}
                className={`w-full text-left px-3 py-2.5 border-b border-slate-100 flex items-center gap-2 transition-colors ${
                  isActive ? "bg-blue-50" : "hover:bg-slate-50"
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isDone ? "bg-emerald-500" : "border-2 border-slate-300"
                }`}>
                  {isDone && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono text-slate-400">{field.field_id || `Field ${idx + 1}`}</div>
                  <div className="text-sm text-slate-700 truncate">
                    {getLocalizedText(field.label, field.field_id || `Field ${idx + 1}`)}
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} title={diff} />
              </button>
            );
          })}
        </div>

        {/* Right: Field detail */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[600px]">
          {currentField ? (
            <div>
              {/* Field header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-mono text-xs text-slate-400">
                    {currentField.field_id || `Field ${activeFieldIndex + 1}`}
                  </span>
                  <h3 className="text-lg font-semibold text-slate-800">
                    {getLocalizedText(currentField.label, "Untitled Field")}
                  </h3>
                </div>
                {currentField.difficulty && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    DIFFICULTY_COLORS[currentField.difficulty]?.bg || ""
                  } ${DIFFICULTY_COLORS[currentField.difficulty]?.text || ""}`}>
                    {currentField.difficulty}
                  </span>
                )}
              </div>

              {/* Instructions */}
              {currentField.instructions && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">
                    {getLocalizedText({ en: "Instructions", es: "Instrucciones", zh: "说明" }, "Instructions")}
                  </h4>
                  <p className="text-sm text-blue-700">
                    {getLocalizedText(currentField.instructions, "")}
                  </p>
                </div>
              )}

              {/* Common mistakes */}
              {currentField.common_mistakes && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-semibold text-amber-800 mb-1">
                    ⚠️ {getLocalizedText({ en: "Common Mistakes", es: "Errores Comunes", zh: "常见错误" }, "Common Mistakes")}
                  </h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {(Array.isArray(currentField.common_mistakes)
                      ? currentField.common_mistakes
                      : [currentField.common_mistakes]
                    ).map((m, i) => (
                      <li key={i}>• {getLocalizedText(m, m)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Legal reference */}
              {currentField.legal_reference && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-1">
                    📋 {getLocalizedText({ en: "Legal Reference", es: "Referencia Legal" }, "Legal Reference")}
                  </h4>
                  <p className="text-sm text-slate-600 font-mono">
                    {getLocalizedText(currentField.legal_reference, "")}
                  </p>
                </div>
              )}

              {/* Pro se tip */}
              {currentField.pro_se_tip && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-semibold text-emerald-800 mb-1">
                    💡 {getLocalizedText({ en: "Pro Se Tip", es: "Consejo Pro Se" }, "Pro Se Tip")}
                  </h4>
                  <p className="text-sm text-emerald-700">
                    {getLocalizedText(currentField.pro_se_tip, "")}
                  </p>
                </div>
              )}

              {/* User notes */}
              <div className="mt-4">
                <label className="text-sm font-medium text-slate-600 block mb-1">
                  {getLocalizedText({ en: "Your Notes", es: "Sus Notas", zh: "您的笔记" }, "Your Notes")}
                </label>
                <textarea
                  value={userNotes[`${selectedForm}-${activeFieldIndex}`] || ""}
                  onChange={(e) =>
                    setUserNotes((prev) => ({
                      ...prev,
                      [`${selectedForm}-${activeFieldIndex}`]: e.target.value,
                    }))
                  }
                  className="w-full p-3 border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder={getLocalizedText({
                    en: "Add your notes for this field...",
                    es: "Añada sus notas para este campo...",
                  }, "Add notes...")}
                />
              </div>

              {/* Navigation + complete */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setActiveFieldIndex(Math.max(0, activeFieldIndex - 1))}
                  disabled={activeFieldIndex === 0}
                  className="px-4 py-2 text-sm rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => toggleFieldComplete(activeFieldIndex)}
                  className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                    completedFields.has(activeFieldIndex)
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {completedFields.has(activeFieldIndex) ? "✓ Completed" : "Mark Complete"}
                </button>
                <button
                  onClick={() => setActiveFieldIndex(Math.min(currentFields.length - 1, activeFieldIndex + 1))}
                  disabled={activeFieldIndex >= currentFields.length - 1}
                  className="px-4 py-2 text-sm rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400">No field selected.</div>
          )}
        </div>
      </div>
    );
  };

  // ─── RENDER: MAIN ────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {renderHeader()}
      {mode === MODES.BROWSE && renderBrowseMode()}
      {mode === MODES.SCENARIO && renderScenarioMode()}
      {mode === MODES.FIELD_GUIDE && renderFieldGuide()}
      {/* Footer */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 text-center">
        <p className="text-xs text-slate-400">
          © 2024–2026 Michael Vernen Thomas Hartmann. VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
          This tool provides guidance only — not legal advice.
        </p>
      </div>
    </div>
  );
}
