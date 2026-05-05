/**
 * VERNEN™ Module Connector
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Registers all engine modules with the PlatformRouter so the
 * dispatch pipeline can route actions to the correct handlers.
 * Each module is wrapped in an adapter that normalizes its API
 * to match what PlatformRouter._route() expects.
 */

import { validateForm, validateFilingPackage, getSupportedForms, getRulesForForm } from '../validation_engine/FormValidationEngine.js';
import { generateFilingGuide, generateFilingPackageGuide, getAvailableCourts, getFeeForForm } from '../filing_guide/FilingGuideGenerator.js';
import { generateReport, generatePackageReport } from '../audit/AuditReportGenerator.js';
import { createAssemblyEngine } from '../assembly/DocumentAssemblyEngine.js';
import DataLayer from '../data/DataLayerConnector.js';

// ─── MODULE ADAPTERS ───────────────────────────────────────────

/**
 * Validation Module Adapter
 * Wraps FormValidationEngine exports to match router's expected interface:
 *   module.validateForm(formId, formData) → results
 */
function createValidationAdapter() {
  return {
    name: 'validation',

    initialize(router) {
      console.log('[ModuleConnector] Validation engine registered');
    },

    validateForm(formId, formData) {
      return validateForm(formId, formData);
    },

    validatePackage(formPackages) {
      return validateFilingPackage(formPackages);
    },

    getSupportedForms() {
      return getSupportedForms();
    },

    getRulesForForm(formId) {
      return getRulesForForm(formId);
    },
  };
}

/**
 * Filing Guide Module Adapter
 * Wraps FilingGuideGenerator exports to match router's expected interface:
 *   module.generateFilingGuide(formId, countyKey) → guide
 */
function createFilingAdapter() {
  return {
    name: 'filing',

    initialize(router) {
      console.log('[ModuleConnector] Filing guide engine registered');
    },

    generateFilingGuide(formId, countyKey) {
      return generateFilingGuide(formId, countyKey);
    },

    generatePackageGuide(formIds, countyKey) {
      return generateFilingPackageGuide(formIds, countyKey);
    },

    getAvailableCourts() {
      return getAvailableCourts();
    },

    getFeeForForm(formId) {
      return getFeeForForm(formId);
    },
  };
}

/**
 * Audit Report Module Adapter
 * Wraps AuditReportGenerator exports to match router's expected interface:
 *   module.generateReport({ formId, formData, validationResults, filingGuide }) → report
 */
function createAuditAdapter() {
  return {
    name: 'audit',

    initialize(router) {
      console.log('[ModuleConnector] Audit report engine registered');
    },

    generateReport({ formId, formData, validationResults, filingGuide }) {
      return generateReport({
        formId,
        formData: formData || {},
        validationResults: validationResults || null,
        filingGuide: filingGuide || null,
      });
    },

    generatePackageReport(formPackages) {
      return generatePackageReport(formPackages);
    },
  };
}

/**
 * Document Assembly Module Adapter
 * Wraps DocumentAssemblyEngine to match router's expected interface.
 * Maintains a persistent engine instance for cross-form propagation.
 */
function createAssemblyAdapter() {
  let engine = null;

  return {
    name: 'assembly',

    initialize(router) {
      engine = createAssemblyEngine();
      console.log('[ModuleConnector] Assembly engine registered');

      // Listen for county changes to update assembly context
      router.bus.on('county:changed', ({ county }) => {
        if (engine) {
          engine.setContext({ courtCounty: county });
        }
      });
    },

    getEngine() {
      if (!engine) engine = createAssemblyEngine();
      return engine;
    },

    setContext(contextData) {
      if (!engine) engine = createAssemblyEngine(contextData);
      else engine.setContext(contextData);
    },

    assemblePackage(formIds, formDataMap, contextData) {
      if (!engine) engine = createAssemblyEngine(contextData);
      else if (contextData) engine.setContext(contextData);

      const results = {};
      for (const formId of formIds) {
        const data = formDataMap[formId] || {};
        try {
          results[formId] = engine.populateForm(formId, data);
        } catch (err) {
          results[formId] = { error: err.message, formId };
        }
      }
      return results;
    },

    /**
     * Pre-load annotations for a batch of forms via DataLayerConnector.
     * Call before assemblePackage when forms haven't been browsed in GDN.
     * @param {string[]} formIds
     * @returns {Promise<Object>} Map of formId → annotation
     */
    async preloadAnnotations(formIds) {
      return DataLayer.getAnnotations(formIds);
    },
  };
}

// ─── CONNECT ALL MODULES ──────────────────────────────────────

/**
 * Registers all engine modules with the platform router.
 * Called once from App.jsx after PlatformProvider initializes.
 *
 * @param {PlatformRouter} router - The initialized platform router instance
 */
export function connectAllModules(router) {
  if (!router) {
    console.error('[ModuleConnector] No router provided');
    return;
  }

  // Register each adapter
  router.registerModule('validation', createValidationAdapter());
  router.registerModule('filing', createFilingAdapter());
  router.registerModule('audit', createAuditAdapter());
  router.registerModule('assembly', createAssemblyAdapter());

  // Wire cross-module event listeners for automatic cascading

  // When validation completes, auto-generate filing guide if county is set
  router.bus.on('validation:complete', ({ formId, score }) => {
    const county = router.state.get('currentCounty');
    if (county && score > 0) {
      router.dispatch({ type: 'GENERATE_FILING_GUIDE', payload: { formId, countyKey: county } });
    }
  });

  // When filing guide is generated, auto-generate audit report
  router.bus.on('filing:guide_generated', ({ formId }) => {
    const formData = router.state.get('formData')?.[formId];
    if (formData && Object.keys(formData).length > 0) {
      router.dispatch({ type: 'GENERATE_AUDIT_REPORT', payload: { formId } });
    }
  });

  // When a form is selected, log it for session tracking
  router.bus.on('form:selected', ({ formId }) => {
    const session = router.state.get('session') || {};
    if (!session.selectedForms) session.selectedForms = [];
    if (!session.selectedForms.includes(formId)) {
      session.selectedForms.push(formId);
      router.state.set('session.selectedForms', session.selectedForms);
    }
  });

  // Expose DataLayer for direct access from router context
  router.dataLayer = DataLayer;

  console.log('[ModuleConnector] All modules connected, cascading wired, DataLayer attached');
}

  console.log('[ModuleConnector] All modules connected. Cross-module listeners active.');
}

export {
  createValidationAdapter,
  createFilingAdapter,
  createAuditAdapter,
  createAssemblyAdapter,
};
