import { useState } from "react";
import { LanguageProvider, useLanguage } from "../i18n/LanguageProvider";
import glossaryData from "../glossary/legal-glossary.json";

/* ─── Language Toggle ─── */
function LanguageToggle() {
  const { lang, setLang, toggleLabel, toggleLang } = useLanguage();
  return (
    <button
      onClick={() => setLang(toggleLang)}
      className="lang-toggle"
      aria-label={`Switch to ${toggleLabel}`}
    >
      <span className="lang-flag">{lang === "en" ? "🇪🇸" : "🇺🇸"}</span>
      {toggleLabel}
    </button>
  );
}

/* ─── Header ─── */
function Header() {
  const { t } = useLanguage();
  return (
    <header className="header">
      <div className="header-brand">
        <h1 className="brand-name">{t("app.name")}</h1>
        <span className="brand-tagline">{t("app.tagline")}</span>
      </div>
      <nav className="header-nav">
        <a href="#audit">{t("nav.audit")}</a>
        <a href="#glossary">{t("nav.glossary")}</a>
        <a href="#pricing">{t("nav.pricing")}</a>
        <a href="#about">{t("nav.about")}</a>
        <LanguageToggle />
      </nav>
    </header>
  );
}

/* ─── Hero Section ─── */
function Hero() {
  const { t } = useLanguage();
  return (
    <section className="hero">
      <h2 className="hero-headline">{t("hero.headline")}</h2>
      <p className="hero-sub">{t("hero.subheadline")}</p>
      <div className="hero-actions">
        <a href="#audit" className="btn btn-primary">{t("hero.cta_primary")}</a>
        <a href="#about" className="btn btn-secondary">{t("hero.cta_secondary")}</a>
      </div>
    </section>
  );
}

/* ─── Audit Domain Selector ─── */
function AuditForm() {
  const { t, lang } = useLanguage();
  const [domain, setDomain] = useState("");
  const [outputLang, setOutputLang] = useState(lang);
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const domains = [
    "constitutional", "family_court", "cps", "law_enforcement",
    "fbi", "attorney_conduct", "psychiatry", "fcs_mediator",
    "victim_rights", "labor", "state_agency", "fcra",
    "ssa_disability", "military"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !domain) return;
    setProcessing(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("domain", domain);
      formData.append("lang", outputLang);

      const response = await fetch("/api/audit", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setResults({ error: t("errors.audit_failed") });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <section id="audit" className="audit-section">
      <h2>{t("audit.title")}</h2>
      <form onSubmit={handleSubmit} className="audit-form">
        {/* File Upload */}
        <div className="form-group">
          <label>{t("audit.upload_label")}</label>
          <input
            type="file"
            accept=".pdf,.docx,.txt,.doc"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <span className="form-hint">{t("audit.upload_hint")}</span>
        </div>

        {/* Domain Selection */}
        <div className="form-group">
          <label>{t("audit.select_domain")}</label>
          <select value={domain} onChange={(e) => setDomain(e.target.value)}>
            <option value="">—</option>
            {domains.map((d) => (
              <option key={d} value={d}>{t(`audit.domains.${d}`)}</option>
            ))}
          </select>
        </div>

        {/* Output Language */}
        <div className="form-group">
          <label>{t("audit.language_output")}</label>
          <div className="radio-group">
            <label>
              <input type="radio" name="lang" value="en"
                checked={outputLang === "en"} onChange={() => setOutputLang("en")} />
              {t("audit.language_english")}
            </label>
            <label>
              <input type="radio" name="lang" value="es"
                checked={outputLang === "es"} onChange={() => setOutputLang("es")} />
              {t("audit.language_spanish")}
            </label>
            <label>
              <input type="radio" name="lang" value="both"
                checked={outputLang === "both"} onChange={() => setOutputLang("both")} />
              {t("audit.language_both")}
            </label>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" className="btn btn-primary" disabled={processing || !file || !domain}>
          {processing ? t("audit.processing") : t("audit.submit")}
        </button>
        {processing && <p className="processing-note">{t("audit.estimated_time")}</p>}
      </form>

      {/* Results */}
      {results && !results.error && (
        <AuditResults data={results} />
      )}
      {results?.error && (
        <div className="error-message">{results.error}</div>
      )}
    </section>
  );
}

/* ─── Audit Results Display ─── */
function AuditResults({ data }) {
  const { t } = useLanguage();
  return (
    <div className="audit-results">
      <h3>{t("results.title")}</h3>
      <div className="findings-content">
        {data.findings}
      </div>
      <div className="results-actions">
        <button className="btn btn-secondary">{t("results.download_pdf")}</button>
        <button className="btn btn-secondary">{t("results.download_docx")}</button>
        <a href="#audit" className="btn btn-outline">{t("results.new_audit")}</a>
      </div>
      <p className="disclaimer">{data.disclaimer}</p>
    </div>
  );
}

/* ─── Glossary Section ─── */
function Glossary() {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState("");

  const filtered = glossaryData.terms.filter((term) => {
    const q = search.toLowerCase();
    return (
      term.en.toLowerCase().includes(q) ||
      term.es.toLowerCase().includes(q) ||
      term.en_def.toLowerCase().includes(q) ||
      term.es_def.toLowerCase().includes(q)
    );
  });

  return (
    <section id="glossary" className="glossary-section">
      <h2>{t("glossary.title")}</h2>
      <input
        type="text"
        placeholder={t("glossary.search_placeholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="glossary-search"
      />
      <div className="glossary-grid">
        {filtered.length === 0 && <p>{t("glossary.no_results")}</p>}
        {filtered.map((term) => (
          <div key={term.id} className="glossary-card">
            <div className="glossary-term-en">
              <strong>{term.en}</strong>
            </div>
            <div className="glossary-term-es">
              <strong>{term.es}</strong>
            </div>
            <p className="glossary-def">
              {lang === "en" ? term.en_def : term.es_def}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="footer">
      <div className="footer-links">
        <a href="#privacy">{t("footer.privacy")}</a>
        <a href="#terms">{t("footer.terms")}</a>
        <a href="#contact">{t("footer.contact")}</a>
        <a href="#accessibility">{t("footer.accessibility")}</a>
      </div>
      <p className="footer-copyright">{t("app.copyright")}</p>
      <p className="footer-vernen">{t("app.tagline")}</p>
    </footer>
  );
}

/* ─── Main App ─── */
function AppContent() {
  return (
    <div className="app">
      <Header />
      <main>
        <Hero />
        <AuditForm />
        <Glossary />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
