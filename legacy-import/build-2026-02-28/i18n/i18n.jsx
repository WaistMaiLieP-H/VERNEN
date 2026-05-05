/**
 * VERNEN™ Internationalization (i18n) Runtime
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Provides translation loading, lookup, interpolation, and React context
 * for all 13 supported languages. Falls back to English for missing keys.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

// ─── SUPPORTED LANGUAGES ───────────────────────────────────────────
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文（简体）', dir: 'ltr' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', dir: 'ltr' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  { code: 'tl', name: 'Tagalog', nativeName: 'Tagalog', dir: 'ltr' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr' },
  { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl Ayisyen', dir: 'ltr' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali', dir: 'ltr' },
  { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ', dir: 'ltr' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', dir: 'ltr' }
];

// ─── STRING CACHE ──────────────────────────────────────────────────
const stringCache = new Map();
let fallbackStrings = null;

/**
 * Deep-get a nested key from an object: "assembly.tabs.parties" → obj.assembly.tabs.parties
 */
function getNestedValue(obj, keyPath) {
  return keyPath.split('.').reduce((current, key) => {
    if (current == null) return undefined;
    return current[key];
  }, obj);
}

/**
 * Interpolate variables: "Form is {percent}% complete" + {percent: 80} → "Form is 80% complete"
 */
function interpolate(template, vars) {
  if (!vars || typeof template !== 'string') return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return vars[key] !== undefined ? String(vars[key]) : match;
  });
}

// ─── LOADER ────────────────────────────────────────────────────────
/**
 * Load UI strings for a language. Returns the strings object.
 * In production, this would fetch from /i18n/ui_strings_{lang}.json
 * For bundled builds, strings are imported at build time.
 */
export async function loadStrings(langCode) {
  if (stringCache.has(langCode)) return stringCache.get(langCode);

  try {
    // Dynamic import for bundled builds
    const module = await import(`./ui_strings_${langCode}.json`);
    const strings = module.default || module;
    stringCache.set(langCode, strings);

    // Cache English as fallback
    if (langCode === 'en') fallbackStrings = strings;
    if (!fallbackStrings) {
      const enModule = await import('./ui_strings_en.json');
      fallbackStrings = enModule.default || enModule;
      stringCache.set('en', fallbackStrings);
    }

    return strings;
  } catch (err) {
    console.warn(`[i18n] Failed to load strings for "${langCode}", falling back to English.`, err);
    if (!fallbackStrings) {
      try {
        const enModule = await import('./ui_strings_en.json');
        fallbackStrings = enModule.default || enModule;
        stringCache.set('en', fallbackStrings);
      } catch (enErr) {
        console.error('[i18n] Failed to load English fallback strings.', enErr);
        return {};
      }
    }
    return fallbackStrings;
  }
}

// ─── TRANSLATION FUNCTION ──────────────────────────────────────────
/**
 * Create a translation function for a loaded strings object.
 *
 * Usage:
 *   const t = createTranslator(strings);
 *   t('assembly.tabs.parties')              → "Parties"
 *   t('a11y.formProgress', { percent: 80 }) → "Form is 80% complete"
 *   t('nonexistent.key')                    → "nonexistent.key" (with console warning)
 */
export function createTranslator(strings) {
  return function t(keyPath, vars) {
    let value = getNestedValue(strings, keyPath);

    // Fallback to English
    if (value === undefined && fallbackStrings) {
      value = getNestedValue(fallbackStrings, keyPath);
    }

    // Key not found anywhere
    if (value === undefined) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[i18n] Missing translation key: "${keyPath}"`);
      }
      return keyPath;
    }

    return interpolate(value, vars);
  };
}

// ─── REACT CONTEXT ─────────────────────────────────────────────────
const I18nContext = createContext({
  language: 'en',
  direction: 'ltr',
  strings: {},
  t: (key) => key,
  setLanguage: () => {}
});

/**
 * I18n Provider — wraps the app to provide translation context.
 *
 * Usage:
 *   <I18nProvider initialLanguage="en">
 *     <App />
 *   </I18nProvider>
 */
export function I18nProvider({ children, initialLanguage = 'en' }) {
  const [language, setLanguageState] = useState(initialLanguage);
  const [strings, setStrings] = useState({});
  const [direction, setDirection] = useState('ltr');
  const [loading, setLoading] = useState(true);

  const setLanguage = useCallback(async (langCode) => {
    const lang = LANGUAGES.find(l => l.code === langCode);
    if (!lang) {
      console.warn(`[i18n] Unsupported language: "${langCode}"`);
      return;
    }

    setLoading(true);
    const loaded = await loadStrings(langCode);
    setStrings(loaded);
    setDirection(lang.dir);
    setLanguageState(langCode);
    setLoading(false);

    // Update document direction for RTL support
    if (typeof document !== 'undefined') {
      document.documentElement.dir = lang.dir;
      document.documentElement.lang = langCode;
    }
  }, []);

  // Load initial language
  React.useEffect(() => {
    setLanguage(initialLanguage);
  }, [initialLanguage, setLanguage]);

  const t = useMemo(() => createTranslator(strings), [strings]);

  const value = useMemo(() => ({
    language, direction, strings, t, setLanguage, loading
  }), [language, direction, strings, t, setLanguage, loading]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook to access i18n context.
 *
 * Usage:
 *   const { t, language, setLanguage, direction } = useI18n();
 *   <h1>{t('dashboard.welcome')}</h1>
 *   <button onClick={() => setLanguage('es')}>Español</button>
 */
export function useI18n() {
  return useContext(I18nContext);
}

/**
 * Get language metadata by code.
 */
export function getLanguageInfo(code) {
  return LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
}

/**
 * Detect browser language and return closest supported language code.
 */
export function detectBrowserLanguage() {
  if (typeof navigator === 'undefined') return 'en';
  const browserLang = navigator.language || navigator.userLanguage || 'en';
  const code = browserLang.split('-')[0].toLowerCase();
  const match = LANGUAGES.find(l => l.code === code);
  return match ? match.code : 'en';
}

export default {
  LANGUAGES, loadStrings, createTranslator,
  I18nProvider, useI18n, getLanguageInfo, detectBrowserLanguage
};
