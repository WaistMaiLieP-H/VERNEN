import { createContext, useContext, useState, useEffect } from "react";
import en from "./en.json";
import es from "./es.json";

const translations = { en, es };

const LanguageContext = createContext({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
  glossary: [],
});

/**
 * Resolve a nested key like "nav.home" from translation object
 */
function resolve(obj, path) {
  return path.split(".").reduce((acc, part) => acc?.[part], obj) || path;
}

/**
 * Detect browser language, default to English
 */
function detectLanguage() {
  const stored = localStorage.getItem("hla_lang");
  if (stored && translations[stored]) return stored;

  const browser = navigator.language?.slice(0, 2);
  if (browser === "es") return "es";
  return "en";
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectLanguage);

  const setLang = (newLang) => {
    setLangState(newLang);
    localStorage.setItem("hla_lang", newLang);
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  /**
   * Translation function
   * Usage: t("nav.home") → "Home" or "Inicio"
   */
  const t = (key) => resolve(translations[lang], key);

  /**
   * Get opposite language label for toggle
   */
  const toggleLabel = lang === "en" ? "Español" : "English";
  const toggleLang = lang === "en" ? "es" : "en";

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        t,
        toggleLabel,
        toggleLang,
        translations,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export default LanguageProvider;
