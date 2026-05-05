/**
 * VERNEN™ Platform Integration Router
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Central pipeline connecting GDN Navigator, Validation Engine,
 * Filing Guide Generator, and Audit Report Generator with
 * event bus, state management, and component orchestration.
 */

// ─── EVENT BUS ──────────────────────────────────────────────
class EventBus {
  constructor() {
    this.listeners = new Map();
    this.history = [];
    this.maxHistory = 500;
  }

  on(event, callback, options = {}) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    const entry = { callback, once: options.once || false, id: crypto.randomUUID() };
    this.listeners.get(event).push(entry);
    return entry.id;
  }

  once(event, callback) {
    return this.on(event, callback, { once: true });
  }

  off(event, listenerId) {
    if (!this.listeners.has(event)) return;
    const list = this.listeners.get(event).filter((e) => e.id !== listenerId);
    this.listeners.set(event, list);
  }

  emit(event, payload = {}) {
    const entry = { event, payload, timestamp: Date.now() };
    this.history.push(entry);
    if (this.history.length > this.maxHistory) this.history.shift();

    if (!this.listeners.has(event)) return;
    const toRemove = [];
    for (const listener of this.listeners.get(event)) {
      try {
        listener.callback(payload);
      } catch (err) {
        console.error(`[EventBus] Error in handler for "${event}":`, err);
      }
      if (listener.once) toRemove.push(listener.id);
    }
    toRemove.forEach((id) => this.off(event, id));
  }

  getHistory(event = null, limit = 50) {
    const filtered = event ? this.history.filter((e) => e.event === event) : this.history;
    return filtered.slice(-limit);
  }

  clear() {
    this.listeners.clear();
    this.history = [];
  }
}

// ─── STATE MANAGER ──────────────────────────────────────────
class StateManager {
  constructor() {
    this.state = {
      currentForm: null,
      currentCounty: null,
      currentLanguage: 'en',
      formData: {},
      validationResults: null,
      filingGuide: null,
      auditReport: null,
      navigationStack: [],
      userPreferences: {
        language: 'en',
        defaultCounty: null,
        showAnnotations: true,
        autoValidate: true,
        theme: 'dark',
      },
      session: {
        startedAt: Date.now(),
        lastActivity: Date.now(),
        formProgress: {},
        completedForms: [],
      },
    };
    this.subscribers = new Map();
    this.snapshots = [];
  }

  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.state);
  }

  set(path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, this.state);
    const oldValue = target[last];
    target[last] = value;
    this.state.session.lastActivity = Date.now();
    this.notifySubscribers(path, value, oldValue);
    return value;
  }

  subscribe(path, callback) {
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, []);
    }
    const id = crypto.randomUUID();
    this.subscribers.get(path).push({ callback, id });
    return () => this.unsubscribe(path, id);
  }

  unsubscribe(path, id) {
    if (!this.subscribers.has(path)) return;
    const list = this.subscribers.get(path).filter((s) => s.id !== id);
    this.subscribers.set(path, list);
  }

  notifySubscribers(path, newValue, oldValue) {
    // Notify exact path subscribers
    if (this.subscribers.has(path)) {
      for (const sub of this.subscribers.get(path)) {
        try {
          sub.callback(newValue, oldValue, path);
        } catch (err) {
          console.error(`[StateManager] Subscriber error for "${path}":`, err);
        }
      }
    }
    // Notify wildcard subscribers
    if (this.subscribers.has('*')) {
      for (const sub of this.subscribers.get('*')) {
        try {
          sub.callback(newValue, oldValue, path);
        } catch (err) {
          console.error(`[StateManager] Wildcard subscriber error:`, err);
        }
      }
    }
  }

  snapshot() {
    const snap = JSON.parse(JSON.stringify(this.state));
    this.snapshots.push({ state: snap, timestamp: Date.now() });
    if (this.snapshots.length > 20) this.snapshots.shift();
    return snap;
  }

  restore(index) {
    if (index >= 0 && index < this.snapshots.length) {
      this.state = JSON.parse(JSON.stringify(this.snapshots[index].state));
      return true;
    }
    return false;
  }

  getFormProgress(formId) {
    return this.state.session.formProgress[formId] || { completed: 0, total: 0, fields: {} };
  }

  updateFormProgress(formId, fieldId, value) {
    if (!this.state.session.formProgress[formId]) {
      this.state.session.formProgress[formId] = { completed: 0, total: 0, fields: {} };
    }
    const progress = this.state.session.formProgress[formId];
    progress.fields[fieldId] = { value, filledAt: Date.now() };
    progress.completed = Object.keys(progress.fields).filter((k) => progress.fields[k].value).length;
    this.notifySubscribers(`session.formProgress.${formId}`, progress, null);
  }

  reset() {
    this.snapshot(); // save before reset
    this.state.formData = {};
    this.state.validationResults = null;
    this.state.filingGuide = null;
    this.state.auditReport = null;
    this.state.navigationStack = [];
  }

  export() {
    return JSON.parse(JSON.stringify(this.state));
  }

  import(data) {
    this.snapshot();
    this.state = { ...this.state, ...data };
  }
}

// ─── PLATFORM ROUTER ────────────────────────────────────────
class PlatformRouter {
  constructor() {
    this.bus = new EventBus();
    this.state = new StateManager();
    this.modules = new Map();
    this.middleware = [];
    this.initialized = false;

    this._setupCoreEvents();
  }

  // Register a module (GDN, Validation, Filing Guide, Audit)
  registerModule(name, module) {
    this.modules.set(name, module);
    this.bus.emit('module:registered', { name, timestamp: Date.now() });
    return this;
  }

  // Add middleware to the pipeline
  use(middlewareFn) {
    this.middleware.push(middlewareFn);
    return this;
  }

  // Initialize all modules
  async initialize(config = {}) {
    if (this.initialized) return;

    // Apply config
    if (config.language) this.state.set('currentLanguage', config.language);
    if (config.county) this.state.set('currentCounty', config.county);
    if (config.preferences) this.state.set('userPreferences', { ...this.state.get('userPreferences'), ...config.preferences });

    // Initialize registered modules
    for (const [name, mod] of this.modules) {
      if (typeof mod.initialize === 'function') {
        try {
          await mod.initialize(this);
          this.bus.emit('module:initialized', { name });
        } catch (err) {
          this.bus.emit('module:error', { name, error: err.message });
          console.error(`[Router] Failed to init module "${name}":`, err);
        }
      }
    }

    this.initialized = true;
    this.bus.emit('platform:ready', { modules: Array.from(this.modules.keys()) });
  }

  // Core pipeline: Process a user action through middleware + modules
  async dispatch(action) {
    const context = {
      action,
      state: this.state,
      bus: this.bus,
      modules: this.modules,
      timestamp: Date.now(),
      results: {},
    };

    // Run middleware chain
    for (const mw of this.middleware) {
      try {
        const result = await mw(context);
        if (result === false) return context; // middleware halted pipeline
      } catch (err) {
        this.bus.emit('pipeline:error', { action: action.type, error: err.message });
        console.error(`[Router] Middleware error:`, err);
      }
    }

    // Route to handler
    try {
      await this._route(context);
    } catch (err) {
      this.bus.emit('pipeline:error', { action: action.type, error: err.message });
    }

    this.bus.emit('pipeline:complete', { action: action.type, duration: Date.now() - context.timestamp });
    return context;
  }

  // ─── INTERNAL ROUTING ───────────────────────────────────
  async _route(ctx) {
    const { type, payload } = ctx.action;

    switch (type) {
      case 'FORM_SELECT':
        return this._handleFormSelect(ctx, payload);
      case 'FORM_FIELD_UPDATE':
        return this._handleFieldUpdate(ctx, payload);
      case 'VALIDATE_FORM':
        return this._handleValidation(ctx, payload);
      case 'GENERATE_FILING_GUIDE':
        return this._handleFilingGuide(ctx, payload);
      case 'GENERATE_AUDIT_REPORT':
        return this._handleAuditReport(ctx, payload);
      case 'CHANGE_LANGUAGE':
        return this._handleLanguageChange(ctx, payload);
      case 'CHANGE_COUNTY':
        return this._handleCountyChange(ctx, payload);
      case 'NAVIGATE':
        return this._handleNavigation(ctx, payload);
      case 'EXPORT_PACKAGE':
        return this._handleExportPackage(ctx, payload);
      default:
        this.bus.emit('route:unknown', { type });
    }
  }

  async _handleFormSelect(ctx, { formId }) {
    this.state.set('currentForm', formId);
    this.state.set('navigationStack', [...this.state.get('navigationStack'), { view: 'form', formId }]);
    this.bus.emit('form:selected', { formId });

    // Auto-validate if enabled
    if (this.state.get('userPreferences.autoValidate') && this.state.get('formData')[formId]) {
      await this.dispatch({ type: 'VALIDATE_FORM', payload: { formId } });
    }
  }

  async _handleFieldUpdate(ctx, { formId, fieldId, value }) {
    const formData = this.state.get('formData') || {};
    if (!formData[formId]) formData[formId] = {};
    formData[formId][fieldId] = value;
    this.state.set('formData', formData);
    this.state.updateFormProgress(formId, fieldId, value);
    this.bus.emit('form:field_updated', { formId, fieldId, value });

    // Auto-validate on field change
    if (this.state.get('userPreferences.autoValidate')) {
      await this.dispatch({ type: 'VALIDATE_FORM', payload: { formId } });
    }
  }

  async _handleValidation(ctx, { formId }) {
    const validationModule = this.modules.get('validation');
    if (!validationModule) {
      this.bus.emit('validation:error', { error: 'Validation module not registered' });
      return;
    }

    const formData = this.state.get('formData')?.[formId] || {};
    let results;
    if (typeof validationModule.validateForm === 'function') {
      results = validationModule.validateForm(formId, formData);
    } else {
      results = { score: 0, findings: [], error: 'validateForm not available' };
    }

    this.state.set('validationResults', results);
    ctx.results.validation = results;
    this.bus.emit('validation:complete', { formId, score: results.score, findingCount: results.findings?.length || 0 });
  }

  async _handleFilingGuide(ctx, { formId, countyKey }) {
    const filingModule = this.modules.get('filing');
    if (!filingModule) {
      this.bus.emit('filing:error', { error: 'Filing guide module not registered' });
      return;
    }

    const county = countyKey || this.state.get('currentCounty');
    let guide;
    if (typeof filingModule.generateFilingGuide === 'function') {
      guide = filingModule.generateFilingGuide(formId, county);
    } else {
      guide = { error: 'generateFilingGuide not available' };
    }

    this.state.set('filingGuide', guide);
    ctx.results.filingGuide = guide;
    this.bus.emit('filing:guide_generated', { formId, county });
  }

  async _handleAuditReport(ctx, { formId, formData }) {
    const auditModule = this.modules.get('audit');
    if (!auditModule) {
      this.bus.emit('audit:error', { error: 'Audit module not registered' });
      return;
    }

    const data = formData || this.state.get('formData')?.[formId] || {};
    const validationResults = this.state.get('validationResults');
    const filingGuide = this.state.get('filingGuide');

    let report;
    if (typeof auditModule.generateReport === 'function') {
      report = auditModule.generateReport({ formId, formData: data, validationResults, filingGuide });
    } else {
      report = { error: 'generateReport not available' };
    }

    this.state.set('auditReport', report);
    ctx.results.auditReport = report;
    this.bus.emit('audit:report_generated', { formId });
  }

  async _handleLanguageChange(ctx, { language }) {
    this.state.set('currentLanguage', language);
    this.state.set('userPreferences.language', language);
    this.bus.emit('language:changed', { language });
  }

  async _handleCountyChange(ctx, { county }) {
    this.state.set('currentCounty', county);
    this.state.set('userPreferences.defaultCounty', county);
    this.bus.emit('county:changed', { county });

    // Auto-regenerate filing guide if a form is selected
    const currentForm = this.state.get('currentForm');
    if (currentForm) {
      await this.dispatch({ type: 'GENERATE_FILING_GUIDE', payload: { formId: currentForm, countyKey: county } });
    }
  }

  async _handleNavigation(ctx, { view, params }) {
    const stack = this.state.get('navigationStack') || [];
    stack.push({ view, params, timestamp: Date.now() });
    this.state.set('navigationStack', stack);
    this.bus.emit('navigation:changed', { view, params });
  }

  async _handleExportPackage(ctx, { formIds, countyKey, format = 'json' }) {
    const results = {
      exportedAt: new Date().toISOString(),
      platform: 'VERNEN™',
      version: '1.0',
      forms: [],
    };

    for (const formId of formIds) {
      const formPackage = {
        formId,
        formData: this.state.get('formData')?.[formId] || {},
        progress: this.state.getFormProgress(formId),
      };

      // Run validation
      await this.dispatch({ type: 'VALIDATE_FORM', payload: { formId } });
      formPackage.validation = this.state.get('validationResults');

      // Generate filing guide
      await this.dispatch({ type: 'GENERATE_FILING_GUIDE', payload: { formId, countyKey } });
      formPackage.filingGuide = this.state.get('filingGuide');

      results.forms.push(formPackage);
    }

    ctx.results.exportPackage = results;
    this.bus.emit('export:complete', { formCount: formIds.length, format });
    return results;
  }

  // ─── CORE EVENTS ────────────────────────────────────────
  _setupCoreEvents() {
    // Log all pipeline events
    this.bus.on('pipeline:error', ({ action, error }) => {
      console.error(`[VERNEN Pipeline] Error in ${action}: ${error}`);
    });

    this.bus.on('platform:ready', ({ modules }) => {
      console.log(`[VERNEN Platform] Ready. Modules: ${modules.join(', ')}`);
    });

    // Auto-save session state periodically
    this._autoSaveInterval = setInterval(() => {
      if (this.initialized) {
        this.state.snapshot();
      }
    }, 5 * 60 * 1000); // every 5 minutes
  }

  // ─── BUILT-IN MIDDLEWARE ────────────────────────────────
  static loggingMiddleware() {
    return (ctx) => {
      console.log(`[Action] ${ctx.action.type}`, ctx.action.payload || '');
    };
  }

  static timestampMiddleware() {
    return (ctx) => {
      ctx.action._processedAt = Date.now();
    };
  }

  static rateLimitMiddleware(maxPerSecond = 10) {
    const timestamps = [];
    return (ctx) => {
      const now = Date.now();
      const cutoff = now - 1000;
      while (timestamps.length && timestamps[0] < cutoff) timestamps.shift();
      if (timestamps.length >= maxPerSecond) {
        console.warn(`[RateLimit] Action ${ctx.action.type} throttled`);
        return false;
      }
      timestamps.push(now);
    };
  }

  // ─── CLEANUP ────────────────────────────────────────────
  destroy() {
    clearInterval(this._autoSaveInterval);
    this.bus.clear();
    this.modules.clear();
    this.middleware = [];
    this.initialized = false;
  }
}

// ─── FACTORY ────────────────────────────────────────────────
function createPlatform(config = {}) {
  const router = new PlatformRouter();

  // Add default middleware
  router.use(PlatformRouter.timestampMiddleware());
  if (config.debug) {
    router.use(PlatformRouter.loggingMiddleware());
  }
  if (config.rateLimit) {
    router.use(PlatformRouter.rateLimitMiddleware(config.rateLimit));
  }

  return router;
}

export { PlatformRouter, EventBus, StateManager, createPlatform };
export default PlatformRouter;
