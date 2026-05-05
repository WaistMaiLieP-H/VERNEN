/**
 * VERNEN™ Data Layer Connector
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Centralized data access layer — single import point for all engines.
 * Handles lazy loading, caching, tier resolution, and fallback logic
 * for form_registry, scenario_index, annotations, and glossaries.
 */

// ─── TIER CONFIGURATION ─────────────────────────────────────────────
const TIER_MAP = {
  A: [
    "FL-100","FL-110","FL-115","FL-120","FL-130","FL-140","FL-141",
    "FL-300","FL-305","FL-310","FL-311","FL-312","FL-320","FL-341",
    "DV-100","DV-109","DV-110","MC-030","MC-031","FW-001","FW-003",
  ],
  B: ["FL-142","FL-150","FL-160","FL-330","FL-335","FL-341D","SC-100","APP-002"],
  C: ["JV-100","CH-100","UD-100","EA-100","CR-160"],
};

function resolveTier(formId) {
  if (TIER_MAP.A.includes(formId)) return "A";
  if (TIER_MAP.B.includes(formId)) return "B";
  if (TIER_MAP.C.includes(formId)) return "C";
  return null;
}

// ─── CACHE ───────────────────────────────────────────────────────────
const _cache = {
  formRegistry: null,
  scenarioIndex: null,
  annotations: new Map(),
  glossaries: new Map(),
};

// ─── FORM REGISTRY ───────────────────────────────────────────────────
export async function getFormRegistry() {
  if (_cache.formRegistry) return _cache.formRegistry;
  try {
    const tierA = await import("./annotations/form_registry.json");
    let registry = { ...(tierA.default || tierA) };
    try {
      const tierBC = await import("./annotations/form_registry_tierc.json");
      const bcData = tierBC.default || tierBC;
      if (bcData.forms) {
        registry.forms = [...(registry.forms || []), ...bcData.forms];
      }
    } catch { /* Tier C registry not yet available */ }
    _cache.formRegistry = registry;
    return registry;
  } catch (err) {
    console.error("DataLayerConnector: form_registry load failed", err);
    return { forms: [] };
  }
}

// ─── SCENARIO INDEX ──────────────────────────────────────────────────
export async function getScenarioIndex() {
  if (_cache.scenarioIndex) return _cache.scenarioIndex;
  try {
    const data = await import("./annotations/scenario_index.json");
    let scenarios = [...((data.default || data).scenarios || [])];
    try {
      const tierC = await import("./annotations/scenario_index_tierc.json");
      const cData = tierC.default || tierC;
      if (cData.scenarios) scenarios = [...scenarios, ...cData.scenarios];
    } catch { /* Tier C scenarios not yet available */ }
    const index = { scenarios };
    _cache.scenarioIndex = index;
    return index;
  } catch (err) {
    console.error("DataLayerConnector: scenario_index load failed", err);
    return { scenarios: [] };
  }
}

// ─── ANNOTATION LOADER ───────────────────────────────────────────────
export async function getAnnotation(formId) {
  if (_cache.annotations.has(formId)) return _cache.annotations.get(formId);
  const tier = resolveTier(formId);
  if (!tier) {
    console.warn(`DataLayerConnector: unknown form "${formId}"`);
    return null;
  }
  try {
    let data;
    if (tier === "B") {
      data = await import(`./annotations/tierb/${formId}.json`);
    } else if (tier === "C") {
      data = await import(`./annotations/tierc/${formId}.json`);
    } else {
      data = await import(`./annotations/${formId}.json`);
    }
    const annotation = data.default || data;
    _cache.annotations.set(formId, annotation);
    return annotation;
  } catch (err) {
    console.error(`DataLayerConnector: annotation load failed for ${formId}`, err);
    return null;
  }
}

// ─── BATCH LOADER ────────────────────────────────────────────────────
export async function getAnnotations(formIds) {
  const results = {};
  await Promise.all(
    formIds.map(async (id) => {
      results[id] = await getAnnotation(id);
    })
  );
  return results;
}

// ─── GLOSSARY LOADER ─────────────────────────────────────────────────
export async function getGlossary(langCode) {
  if (_cache.glossaries.has(langCode)) return _cache.glossaries.get(langCode);
  try {
    const data = await import(`../i18n/ui_strings_${langCode}.json`);
    const glossary = data.default || data;
    _cache.glossaries.set(langCode, glossary);
    return glossary;
  } catch {
    return null;
  }
}

// ─── UTILITIES ───────────────────────────────────────────────────────
export function getTierForForm(formId) { return resolveTier(formId); }

export function getAllFormIds() {
  return [...TIER_MAP.A, ...TIER_MAP.B, ...TIER_MAP.C];
}

export function getFormIdsByTier(tier) {
  return TIER_MAP[tier] || [];
}

export function clearCache(type) {
  if (!type || type === "all") {
    _cache.formRegistry = null;
    _cache.scenarioIndex = null;
    _cache.annotations.clear();
    _cache.glossaries.clear();
  } else if (type === "annotations") {
    _cache.annotations.clear();
  } else if (type === "glossaries") {
    _cache.glossaries.clear();
  }
}

// ─── PRELOAD ─────────────────────────────────────────────────────────
export async function preloadTier(tier) {
  const ids = TIER_MAP[tier];
  if (!ids) return;
  await Promise.all(ids.map((id) => getAnnotation(id)));
}

export async function preloadAll() {
  await getFormRegistry();
  await getScenarioIndex();
  await Promise.all(Object.keys(TIER_MAP).map((t) => preloadTier(t)));
}

export default {
  getFormRegistry,
  getScenarioIndex,
  getAnnotation,
  getAnnotations,
  getGlossary,
  getTierForForm,
  getAllFormIds,
  getFormIdsByTier,
  clearCache,
  preloadTier,
  preloadAll,
};
