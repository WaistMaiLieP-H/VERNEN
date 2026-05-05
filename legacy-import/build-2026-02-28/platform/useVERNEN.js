/**
 * VERNEN™ Custom React Hooks
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Reactive hooks that feed live data between modules:
 *   useFormData    — read/write form fields, track progress
 *   useValidation  — trigger validation, get live scores
 *   useFilingGuide — generate/read filing guides per county
 *   useAudit       — generate/read audit reports
 *   useAssembly    — build multi-form packages
 *   useLanguage    — i18n language switching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePlatform } from './PlatformContext.jsx';

// ─── useFormData ──────────────────────────────────────────────
/**
 * Manages form field data with auto-sync to platform state.
 * Any field update flows through the router → triggers auto-validate.
 *
 * @param {string} formId - The form to manage (e.g. 'FL-300')
 * @returns {{ fields, updateField, clearForm, progress, selectForm }}
 */
export function useFormData(formId) {
  const { state, dispatch } = usePlatform();
  const fields = (formId && state?.formData?.[formId]) || {};
  const progress = formId ? (state?.session?.formProgress?.[formId] || { completed: 0, total: 0, fields: {} }) : null;

  const selectForm = useCallback((id) => {
    dispatch({ type: 'FORM_SELECT', payload: { formId: id } });
  }, [dispatch]);

  const updateField = useCallback((fieldId, value) => {
    if (!formId) return;
    dispatch({
      type: 'FORM_FIELD_UPDATE',
      payload: { formId, fieldId, value },
    });
  }, [dispatch, formId]);

  const clearForm = useCallback(() => {
    if (!formId) return;
    // Reset form data by setting empty object
    const formData = { ...(state?.formData || {}) };
    formData[formId] = {};
    // Direct state update for clearing
    dispatch({ type: 'FORM_FIELD_UPDATE', payload: { formId, fieldId: '__clear__', value: null } });
  }, [dispatch, formId, state?.formData]);

  return { fields, updateField, clearForm, progress, selectForm };
}

// ─── useValidation ────────────────────────────────────────────
/**
 * Provides validation results and manual trigger.
 * Results auto-update when form data changes (via autoValidate).
 *
 * @param {string} formId - The form to validate
 * @returns {{ results, score, findings, validate, isValid, findingCounts }}
 */
export function useValidation(formId) {
  const { state, dispatch } = usePlatform();
  const results = state?.validationResults;

  const validate = useCallback(() => {
    if (!formId) return;
    dispatch({ type: 'VALIDATE_FORM', payload: { formId } });
  }, [dispatch, formId]);

  // Auto-validate when formId changes
  useEffect(() => {
    if (formId && state?.formData?.[formId]) {
      validate();
    }
  }, [formId]); // eslint-disable-line react-hooks/exhaustive-deps

  const score = results?.score ?? null;
  const findings = results?.findings || [];
  const isValid = score !== null && score >= 80;
  const findingCounts = {
    errors: findings.filter(f => f.severity === 'error').length,
    warnings: findings.filter(f => f.severity === 'warning').length,
    info: findings.filter(f => f.severity === 'info').length,
  };

  return { results, score, findings, validate, isValid, findingCounts };
}

// ─── useFilingGuide ───────────────────────────────────────────
/**
 * Provides filing guide data and generation trigger.
 * Auto-cascades from validation → filing guide → audit.
 *
 * @param {string} formId
 * @param {string} countyKey
 * @returns {{ guide, generate, loading, courts }}
 */
export function useFilingGuide(formId, countyKey) {
  const { state, dispatch, on, off } = usePlatform();
  const [loading, setLoading] = useState(false);
  const guide = state?.filingGuide;

  const generate = useCallback((overrideFormId, overrideCounty) => {
    const fId = overrideFormId || formId;
    const cKey = overrideCounty || countyKey;
    if (!fId || !cKey) return;
    setLoading(true);
    dispatch({
      type: 'GENERATE_FILING_GUIDE',
      payload: { formId: fId, countyKey: cKey },
    });
  }, [dispatch, formId, countyKey]);

  // Listen for completion to clear loading
  useEffect(() => {
    const id = on('filing:guide_generated', () => setLoading(false));
    return () => off('filing:guide_generated', id);
  }, [on, off]);

  // Get available courts from module
  const courts = state?.session?.availableCourts || [];

  return { guide, generate, loading, courts };
}

// ─── useAudit ─────────────────────────────────────────────────
/**
 * Provides audit report data and generation trigger.
 *
 * @param {string} formId
 * @returns {{ report, generate, loading, riskLevel, isReady }}
 */
export function useAudit(formId) {
  const { state, dispatch, on, off } = usePlatform();
  const [loading, setLoading] = useState(false);
  const report = state?.auditReport;

  const generate = useCallback((overrideFormId) => {
    const fId = overrideFormId || formId;
    if (!fId) return;
    setLoading(true);
    dispatch({
      type: 'GENERATE_AUDIT_REPORT',
      payload: { formId: fId },
    });
  }, [dispatch, formId]);

  useEffect(() => {
    const id = on('audit:report_generated', () => setLoading(false));
    return () => off('audit:report_generated', id);
  }, [on, off]);

  const riskLevel = report?.summary?.riskLevel || null;
  const isReady = report?.filingReadiness?.readyToFile || false;

  return { report, generate, loading, riskLevel, isReady };
}

// ─── useAssembly ──────────────────────────────────────────────
/**
 * Provides document assembly (multi-form package) capabilities.
 * Uses the persistent assembly engine registered via ModuleConnector.
 *
 * @returns {{ assemble, exportPackage, loading, packageResult }}
 */
export function useAssembly() {
  const { state, dispatch, on, off } = usePlatform();
  const [loading, setLoading] = useState(false);
  const [packageResult, setPackageResult] = useState(null);

  const assemble = useCallback(async (formIds, countyKey) => {
    if (!formIds || formIds.length === 0) return;
    setLoading(true);
    // Pre-load annotations for any forms not yet in cache
    if (state?.router?.dataLayer) {
      await state.router.dataLayer.getAnnotations(formIds);
    }
    const ctx = await dispatch({
      type: 'EXPORT_PACKAGE',
      payload: { formIds, countyKey: countyKey || state?.currentCounty },
    });
    if (ctx?.results?.exportPackage) {
      setPackageResult(ctx.results.exportPackage);
    }
    setLoading(false);
    return ctx?.results?.exportPackage;
  }, [dispatch, state?.currentCounty, state?.router?.dataLayer]);

  const exportPackage = useCallback(async (formIds, countyKey, format = 'json') => {
    const result = await assemble(formIds, countyKey);
    if (result && format === 'json') {
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VERNEN_package_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    return result;
  }, [assemble]);

  useEffect(() => {
    const id = on('export:complete', () => setLoading(false));
    return () => off('export:complete', id);
  }, [on, off]);

  return { assemble, exportPackage, loading, packageResult };
}

// ─── useLanguage ──────────────────────────────────────────────
/**
 * Manages language state with platform sync.
 *
 * @returns {{ language, changeLanguage, supportedLanguages }}
 */
export function useLanguage() {
  const { state, dispatch } = usePlatform();
  const language = state?.currentLanguage || 'en';

  const changeLanguage = useCallback((lang) => {
    dispatch({ type: 'CHANGE_LANGUAGE', payload: { language: lang } });
  }, [dispatch]);

  const supportedLanguages = [
    'en', 'es', 'zh', 'vi', 'ko', 'ar', 'tl', 'ru', 'pt', 'ht', 'so', 'ti', 'am',
  ];

  return { language, changeLanguage, supportedLanguages };
}

// ─── useCounty ────────────────────────────────────────────────
/**
 * Manages county selection with platform sync.
 *
 * @returns {{ county, changeCounty }}
 */
export function useCounty() {
  const { state, dispatch } = usePlatform();
  const county = state?.currentCounty;

  const changeCounty = useCallback((countyKey) => {
    dispatch({ type: 'CHANGE_COUNTY', payload: { county: countyKey } });
  }, [dispatch]);

  return { county, changeCounty };
}

// ─── usePlatformEvent ─────────────────────────────────────────
/**
 * Subscribe to a specific platform event.
 * Auto-cleans up on unmount.
 *
 * @param {string} event - Event name (e.g. 'validation:complete')
 * @param {Function} handler - Callback
 */
export function usePlatformEvent(event, handler) {
  const { on, off } = usePlatform();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const id = on(event, (payload) => handlerRef.current(payload));
    return () => off(event, id);
  }, [event, on, off]);
}
