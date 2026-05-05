/**
 * VERNEN™ Platform Integration Router
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Central pipeline connecting all VERNEN™ components:
 * GDN Navigator, Validation Engine, Filing Guide Generator,
 * Audit Report Generator, and future modules.
 *
 * Architecture: Event bus + state management + component orchestration.
 */

// ==================== EVENT BUS ====================
class EventBus {
  constructor() {
    this.listeners = new Map();
    this.history = [];
    this.maxHistory = 500;
  }

  on(event, callback, options = {}) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    const entry = { callback, once: options.once || false, priority: options.priority || 0 };
    this.listeners.get(event).push(entry);
    this.listeners.get(event).sort((a, b) => b.priority - a.priority);
    return () => this.off(event, callback);
  }

  once(event, callback) {
    return this.on(event, callback, { once: true });
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const entries = this.listeners.get(event).filter((e) => e.callback !== callback);
    if (entries.length === 0) this.listeners.delete(event);
    else this.listeners.set(event, entries);
  }

  emit(event, data = {}) {
    const record = { event, data, timestamp: Date.now() };
    this.history.push(record);
    if (this.history.length > this.maxHistory) this.history.shift();

    if (!this.listeners.has(event)) return;
    const entries = [...this.listeners.get(event)];
    for (const entry of entries) {
      try {
        entry.callback(data, record);
      } catch (err) {
        console.error(`[VERNEN EventBus] Error in handler for "${event}":`, err);
      }
      if (entry.once) this.off(event, entry.callback);
    }
  }

  getHistory(filter = {}) {
    let results = [...this.history];
    if (filter.event) results = results.filter((r) => r.event === filter.event);
    if (filter.since) results = results.filter((r) => r.timestamp >= filter.since);
    if (filter.limit) results = results.slice(-filter.limit);
    return results;
  }

  clear() {
    this.listeners.clear();
    this.history = [];
  }
}

// ==================== STATE MANAGER ====================
class StateManager {
  constructor() {
    this.state = {
      user: { language: "en", county: null, feeWaiverStatus: null },
      gdn: { activeForm: null, activeField: null, completionProgress: {}, notes: {} },
      validation: { lastResults: null, complianceScore: null, pendingFixes: [] },
      filing: { activeGuide: null, completedSteps: new Set(), pendingForms: [] },
      audit: { lastReport: null, riskLevel: null, findings: [] },
      session: { startedAt: Date.now(), lastActivity: Date.now(), actionCount: 0 },
    };
    this.subscribers = new Map();
    this.snapshots = [];
  }

  get(path) {
    return path.split(".").reduce((obj, key) => obj?.[key], this.state);
  }

  set(path, value) {
    const keys = path.split(".");
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, this.state);
    const oldValue = target[lastKey];
    target[lastKey] = value;
    this.state.session.lastActivity = Date.now();
    this.state.session.actionCount++;
    this.notifySubscribers(path, value, oldValue);
  }

  subscribe(pathPrefix, callback) {
    if (!this.subscribers.has(pathPrefix)) this.subscribers.set(pathPrefix, []);
    this.subscribers.get(pathPrefix).push(callback);
    return () => {
      const subs = this.subscribers.get(pathPrefix)?.filter((c) => c !== callback);
      if (subs?.length) this.subscribers.set(pathPrefix, subs);
      else this.subscribers.delete(pathPrefix);
    };
  }

  notifySubscribers(path, newValue, oldValue) {
    for (const [prefix, callbacks] of this.subscribers) {
      if (path.startsWith(prefix)) {
        callbacks.forEach((cb) => {
          try { cb({ path, newValue, oldValue }); }
          catch (err) { console.error(`[VERNEN State] Subscriber error for "${prefix}":`, err); }
        });
      }
    }
  }

  snapshot() {
    const snap = JSON.parse(JSON.stringify(this.state, (key, val) => val instanceof Set ? [...val] : val));
    this.snapshots.push({ state: snap, timestamp: Date.now() });
    if (this.snapshots.length > 20) this.snapshots.shift();
    return snap;
  }

  restore(index) {
    if (index < 0 || index >= this.snapshots.length) return false;
    this.state = JSON.parse(JSON.stringify(this.snapshots[index].state));
    return true;
  }

  getSessionStats() {
    return {
      duration: Date.now() - this.state.session.startedAt,
      actionCount: this.state.session.actionCount,
      lastActivity: this.state.session.lastActivity,
      snapshotCount: this.snapshots.length,
    };
  }
}

// ==================== PLATFORM ROUTER ====================
const EVENTS = {
  // GDN Events
  GDN_FORM_SELECTED: "gdn:form:selected",
  GDN_FIELD_FOCUSED: "gdn:field:focused",
  GDN_FIELD_COMPLETED: "gdn:field:completed",
  GDN_FORM_PROGRESS: "gdn:form:progress",
  GDN_LANGUAGE_CHANGED: "gdn:language:changed",

  // Validation Events
  VALIDATION_REQUESTED: "validation:requested",
  VALIDATION_COMPLETE: "validation:complete",
  VALIDATION_FIX_APPLIED: "validation:fix:applied",

  // Filing Events
  FILING_GUIDE_REQUESTED: "filing:guide:requested",
  FILING_GUIDE_GENERATED: "filing:guide:generated",
  FILING_STEP_COMPLETED: "filing:step:completed",

  // Audit Events
  AUDIT_REQUESTED: "audit:requested",
  AUDIT_COMPLETE: "audit:complete",

  // Platform Events
  PLATFORM_INITIALIZED: "platform:initialized",
  PLATFORM_ERROR: "platform:error",
  USER_SETTINGS_CHANGED: "user:settings:changed",
  SESSION_SAVED: "session:saved",
  SESSION_RESTORED: "session:restored",
};

class PlatformRouter {
  constructor() {
    this.eventBus = new EventBus();
    this.state = new StateManager();
    this.modules = new Map();
    this.pipelines = new Map();
    this.initialized = false;
  }

  // ---------- MODULE REGISTRATION ----------
  registerModule(name, moduleInstance) {
    if (this.modules.has(name)) {
      console.warn(`[VERNEN Router] Module "${name}" already registered. Overwriting.`);
    }
    this.modules.set(name, {
      instance: moduleInstance,
      registeredAt: Date.now(),
      status: "registered",
    });
    return this;
  }

  getModule(name) {
    return this.modules.get(name)?.instance || null;
  }

  // ---------- PIPELINE DEFINITIONS ----------
  registerPipeline(name, steps) {
    this.pipelines.set(name, { steps, createdAt: Date.now() });
    return this;
  }

  async executePipeline(name, initialData = {}) {
    const pipeline = this.pipelines.get(name);
    if (!pipeline) throw new Error(`Pipeline "${name}" not found.`);

    let data = { ...initialData };
    const results = [];

    for (const step of pipeline.steps) {
      try {
        const result = await step.handler(data, this);
        results.push({ step: step.name, status: "success", result });
        data = { ...data, ...result };
        this.eventBus.emit(`pipeline:${name}:step:complete`, { step: step.name, result });
      } catch (err) {
        results.push({ step: step.name, status: "error", error: err.message });
        this.eventBus.emit(EVENTS.PLATFORM_ERROR, { pipeline: name, step: step.name, error: err });
        if (step.required !== false) break;
      }
    }

    return { pipeline: name, results, finalData: data };
  }

  // ---------- BUILT-IN PIPELINES ----------
  initializeDefaultPipelines() {
    // Pipeline: Form → Validate → Filing Guide
    this.registerPipeline("form_to_filing", [
      {
        name: "select_form",
        handler: async (data) => {
          this.state.set("gdn.activeForm", data.formId);
          this.eventBus.emit(EVENTS.GDN_FORM_SELECTED, { formId: data.formId });
          return { formId: data.formId };
        },
      },
      {
        name: "validate_form",
        handler: async (data) => {
          const validator = this.getModule("validationEngine");
          if (!validator) throw new Error("Validation Engine not registered");
          const results = validator.validateForm(data.formId, data.formData || {});
          this.state.set("validation.lastResults", results);
          this.eventBus.emit(EVENTS.VALIDATION_COMPLETE, results);
          return { validationResults: results };
        },
      },
      {
        name: "generate_filing_guide",
        handler: async (data) => {
          const filingGen = this.getModule("filingGuideGenerator");
          if (!filingGen) throw new Error("Filing Guide Generator not registered");
          const guide = filingGen.generateFilingGuide(data.formId, data.county || this.state.get("user.county"), {
            language: this.state.get("user.language"),
            includeFeeWaiver: this.state.get("user.feeWaiverStatus") === "approved",
          });
          this.state.set("filing.activeGuide", guide);
          this.eventBus.emit(EVENTS.FILING_GUIDE_GENERATED, guide);
          return { filingGuide: guide };
        },
      },
    ]);

    // Pipeline: Full Audit
    this.registerPipeline("full_audit", [
      {
        name: "collect_form_data",
        handler: async (data) => ({ formId: data.formId, formData: data.formData }),
      },
      {
        name: "run_validation",
        handler: async (data) => {
          const validator = this.getModule("validationEngine");
          if (!validator) return { validationResults: null };
          return { validationResults: validator.validateForm(data.formId, data.formData || {}) };
        },
      },
      {
        name: "generate_audit_report",
        handler: async (data) => {
          const auditor = this.getModule("auditReportGenerator");
          if (!auditor) return { auditReport: null };
          return { auditReport: auditor.generateReport(data) };
        },
        required: false,
      },
      {
        name: "generate_filing_guide",
        handler: async (data) => {
          const filingGen = this.getModule("filingGuideGenerator");
          if (!filingGen) return { filingGuide: null };
          return { filingGuide: filingGen.generateFilingGuide(data.formId, this.state.get("user.county")) };
        },
        required: false,
      },
    ]);

    return this;
  }

  // ---------- EVENT WIRING ----------
  wireDefaultEvents() {
    // Auto-validate when form data changes
    this.eventBus.on(EVENTS.GDN_FORM_PROGRESS, (data) => {
      if (data.completionPercent >= 100) {
        this.eventBus.emit(EVENTS.VALIDATION_REQUESTED, { formId: data.formId, formData: data.formData });
      }
    });

    // Auto-save session on significant actions
    let saveTimer = null;
    this.eventBus.on(EVENTS.GDN_FIELD_COMPLETED, () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        this.state.snapshot();
        this.eventBus.emit(EVENTS.SESSION_SAVED, this.state.getSessionStats());
      }, 5000);
    });

    // Language propagation
    this.eventBus.on(EVENTS.GDN_LANGUAGE_CHANGED, (data) => {
      this.state.set("user.language", data.language);
      this.eventBus.emit(EVENTS.USER_SETTINGS_CHANGED, { key: "language", value: data.language });
    });

    return this;
  }

  // ---------- INITIALIZATION ----------
  initialize(options = {}) {
    if (this.initialized) {
      console.warn("[VERNEN Router] Already initialized.");
      return this;
    }

    this.initializeDefaultPipelines();
    this.wireDefaultEvents();

    if (options.county) this.state.set("user.county", options.county);
    if (options.language) this.state.set("user.language", options.language);
    if (options.feeWaiverStatus) this.state.set("user.feeWaiverStatus", options.feeWaiverStatus);

    this.initialized = true;
    this.eventBus.emit(EVENTS.PLATFORM_INITIALIZED, {
      modules: [...this.modules.keys()],
      pipelines: [...this.pipelines.keys()],
      timestamp: Date.now(),
    });

    return this;
  }

  // ---------- CONVENIENCE METHODS ----------
  async processForm(formId, formData, county) {
    if (county) this.state.set("user.county", county);
    return this.executePipeline("form_to_filing", { formId, formData });
  }

  async runFullAudit(formId, formData) {
    return this.executePipeline("full_audit", { formId, formData });
  }

  getStatus() {
    return {
      initialized: this.initialized,
      modules: [...this.modules.entries()].map(([name, mod]) => ({ name, status: mod.status, registeredAt: mod.registeredAt })),
      pipelines: [...this.pipelines.keys()],
      session: this.state.getSessionStats(),
      eventHistory: this.eventBus.getHistory({ limit: 10 }),
    };
  }

  destroy() {
    this.eventBus.clear();
    this.modules.clear();
    this.pipelines.clear();
    this.initialized = false;
  }
}

// ==================== SINGLETON FACTORY ====================
let instance = null;

function getRouter() {
  if (!instance) instance = new PlatformRouter();
  return instance;
}

function resetRouter() {
  if (instance) instance.destroy();
  instance = null;
}

// ==================== EXPORTS ====================
module.exports = {
  PlatformRouter,
  EventBus,
  StateManager,
  EVENTS,
  getRouter,
  resetRouter,
};
