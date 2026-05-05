import { useState, useEffect, createContext, useContext, useRef } from "react";

/* ═══════════════════════════════════════════════════════
   TRANSLATIONS — Complete EN/ES locale system
   ═══════════════════════════════════════════════════════ */
const translations = {
  en: {
    app: { name: "Hartmann Legal Analytics", tagline: "Powered by VERNEN™", copyright: "© 2026 Michael Vernen Thomas Hartmann. All rights reserved." },
    nav: { home: "Home", audit: "Compliance Audit", glossary: "Legal Glossary", pricing: "Pricing", about: "About", login: "Log In", signup: "Get Started", language: "Español" },
    hero: {
      headline: "AI-Powered Legal Compliance Auditing",
      subheadline: "Identify procedural defects, rights violations, and compliance failures across 14 specialized legal domains.",
      cta_primary: "Start Your Audit",
      cta_secondary: "See How It Works",
      badge: "Bilingual EN/ES"
    },
    audit: {
      title: "Compliance Audit",
      upload_label: "Upload Document",
      upload_hint: "PDF, DOCX, or plain text — court orders, agency correspondence, police reports, medical evaluations, CPS determinations",
      upload_drop: "Drop file here or click to browse",
      select_domain: "Select Audit Domain",
      domains: {
        constitutional: "Constitutional & Civil Rights",
        family_court: "Family Court Orders",
        cps: "CPS / Child Welfare",
        law_enforcement: "Law Enforcement Conduct (POST)",
        fbi: "FBI / Federal Law Enforcement",
        attorney_conduct: "Attorney Ethics (State Bar)",
        psychiatry: "Psychiatry & Neurology (ABPN)",
        fcs_mediator: "FCS Custody Mediator Conduct",
        victim_rights: "Marsy's Law / Victim Rights",
        labor: "Labor & Employment",
        state_agency: "State Agency Correspondence",
        fcra: "FCRA / Consumer Reports",
        ssa_disability: "SSA Disability Determination",
        military: "USMC Military Standards"
      },
      language_output: "Report Language",
      language_english: "English",
      language_spanish: "Spanish",
      language_both: "Bilingual (EN + ES)",
      submit: "Run Audit",
      processing: "Analyzing...",
      estimated_time: "Estimated: 30–90 seconds",
      disclaimer: "This analysis is for informational purposes only and does not constitute legal advice. Consult a qualified attorney for legal determinations."
    },
    results: {
      title: "Audit Findings",
      severity_critical: "Critical", severity_major: "Major", severity_minor: "Minor", severity_advisory: "Advisory",
      download_pdf: "Download PDF", download_docx: "Download DOCX", new_audit: "New Audit"
    },
    glossary: {
      title: "Legal Glossary",
      subtitle: "Bilingual legal terminology reference — EN ↔ ES",
      search: "Search terms in English or Spanish...",
      english: "English", spanish: "Español", definition: "Definition",
      no_results: "No matching terms found.",
      domains_all: "All Domains",
      domain_labels: {
        family_court: "Family Court", constitutional: "Constitutional Rights", cps: "Child Welfare",
        law_enforcement: "Law Enforcement", attorney_conduct: "Attorney Ethics"
      }
    },
    features: {
      title: "How It Works",
      steps: [
        { num: "01", title: "Upload", desc: "Submit any legal document — court orders, agency letters, police reports, medical evaluations" },
        { num: "02", title: "Analyze", desc: "VERNEN™ audits against the exact statute, regulation, or professional code that governs the document" },
        { num: "03", title: "Report", desc: "Receive findings ranked by severity with cited standards — in English, Spanish, or both" }
      ]
    },
    domains_section: {
      title: "14 Specialized Audit Domains",
      subtitle: "Every document audited against its specific Standard of Creation"
    },
    pricing: {
      title: "Pricing",
      subtitle: "Simple, transparent pricing for everyone",
      tiers: [
        { name: "Starter", price: "$9.99", unit: "per audit", features: ["Single document audit", "Any domain", "EN or ES output", "PDF report"], cta: "Buy Audit" },
        { name: "Professional", price: "$79", unit: "per month", features: ["25 audits / month", "All 14 domains", "Bilingual reports", "Priority processing", "DOCX + PDF export"], cta: "Subscribe", featured: true },
        { name: "Enterprise", price: "Custom", unit: "volume pricing", features: ["Unlimited audits", "API access", "Custom domains", "Dedicated support", "White-label option"], cta: "Contact Us" }
      ]
    },
    about: {
      title: "About",
      p1: "Hartmann Legal Analytics provides AI-powered compliance auditing across legal, regulatory, and institutional domains.",
      p2: "Built on the VERNEN™ analysis engine, the platform identifies procedural defects, rights violations, and compliance failures that manual review often misses.",
      methodology: "Standard of Creation (S.o.C.) Methodology",
      methodology_desc: "Every document is audited against the specific legal standard that governed its creation — not general principles, but the exact statute, regulation, or professional code that applies.",
      creator: "Created by Michael Vernen Thomas Hartmann"
    },
    footer: { privacy: "Privacy", terms: "Terms", contact: "Contact", accessibility: "Accessibility" }
  },
  es: {
    app: { name: "Hartmann Legal Analytics", tagline: "Impulsado por VERNEN™", copyright: "© 2026 Michael Vernen Thomas Hartmann. Todos los derechos reservados." },
    nav: { home: "Inicio", audit: "Auditoría", glossary: "Glosario Legal", pricing: "Precios", about: "Acerca de", login: "Iniciar Sesión", signup: "Comenzar", language: "English" },
    hero: {
      headline: "Auditoría de Cumplimiento Legal con IA",
      subheadline: "Identifique defectos de procedimiento, violaciones de derechos e incumplimientos en 14 dominios legales especializados.",
      cta_primary: "Iniciar Auditoría",
      cta_secondary: "Cómo Funciona",
      badge: "Bilingüe EN/ES"
    },
    audit: {
      title: "Auditoría de Cumplimiento",
      upload_label: "Subir Documento",
      upload_hint: "PDF, DOCX o texto — órdenes judiciales, correspondencia de agencias, informes policiales, evaluaciones médicas",
      upload_drop: "Arrastre archivo aquí o haga clic para buscar",
      select_domain: "Seleccionar Dominio",
      domains: {
        constitutional: "Derechos Constitucionales y Civiles",
        family_court: "Órdenes de Tribunal de Familia",
        cps: "CPS / Bienestar Infantil",
        law_enforcement: "Conducta Policial (POST)",
        fbi: "FBI / Fuerzas Federales",
        attorney_conduct: "Ética de Abogados",
        psychiatry: "Psiquiatría y Neurología (ABPN)",
        fcs_mediator: "Mediadores de Custodia (FCS)",
        victim_rights: "Ley de Marsy / Derechos de Víctimas",
        labor: "Trabajo y Empleo",
        state_agency: "Correspondencia de Agencias",
        fcra: "FCRA / Informes del Consumidor",
        ssa_disability: "Discapacidad SSA",
        military: "Estándares Militares USMC"
      },
      language_output: "Idioma del Informe",
      language_english: "Inglés",
      language_spanish: "Español",
      language_both: "Bilingüe (EN + ES)",
      submit: "Ejecutar Auditoría",
      processing: "Analizando...",
      estimated_time: "Tiempo estimado: 30–90 segundos",
      disclaimer: "Este análisis es solo para fines informativos y no constituye asesoramiento legal. Consulte a un abogado calificado."
    },
    results: {
      title: "Hallazgos",
      severity_critical: "Crítico", severity_major: "Mayor", severity_minor: "Menor", severity_advisory: "Informativo",
      download_pdf: "Descargar PDF", download_docx: "Descargar DOCX", new_audit: "Nueva Auditoría"
    },
    glossary: {
      title: "Glosario Legal",
      subtitle: "Referencia bilingüe de terminología legal — EN ↔ ES",
      search: "Buscar términos en inglés o español...",
      english: "English", spanish: "Español", definition: "Definición",
      no_results: "No se encontraron términos.",
      domains_all: "Todos los Dominios",
      domain_labels: {
        family_court: "Tribunal de Familia", constitutional: "Derechos Constitucionales", cps: "Bienestar Infantil",
        law_enforcement: "Fuerzas del Orden", attorney_conduct: "Ética de Abogados"
      }
    },
    features: {
      title: "Cómo Funciona",
      steps: [
        { num: "01", title: "Subir", desc: "Envíe cualquier documento legal — órdenes judiciales, cartas de agencias, informes policiales, evaluaciones médicas" },
        { num: "02", title: "Analizar", desc: "VERNEN™ audita contra el estatuto, regulación o código profesional exacto que gobierna el documento" },
        { num: "03", title: "Informe", desc: "Reciba hallazgos clasificados por gravedad con estándares citados — en inglés, español, o ambos" }
      ]
    },
    domains_section: {
      title: "14 Dominios de Auditoría",
      subtitle: "Cada documento auditado contra su Estándar de Creación específico"
    },
    pricing: {
      title: "Precios",
      subtitle: "Precios simples y transparentes para todos",
      tiers: [
        { name: "Inicial", price: "$9.99", unit: "por auditoría", features: ["Auditoría de documento único", "Cualquier dominio", "Salida EN o ES", "Informe PDF"], cta: "Comprar" },
        { name: "Profesional", price: "$79", unit: "por mes", features: ["25 auditorías / mes", "Los 14 dominios", "Informes bilingües", "Procesamiento prioritario", "Exportar DOCX + PDF"], cta: "Suscribirse", featured: true },
        { name: "Empresarial", price: "Personalizado", unit: "precios por volumen", features: ["Auditorías ilimitadas", "Acceso API", "Dominios personalizados", "Soporte dedicado", "Marca blanca"], cta: "Contáctenos" }
      ]
    },
    about: {
      title: "Acerca de",
      p1: "Hartmann Legal Analytics proporciona auditoría de cumplimiento con IA en dominios legales, regulatorios e institucionales.",
      p2: "Construido sobre el motor VERNEN™, identifica defectos de procedimiento, violaciones de derechos e incumplimientos que la revisión manual frecuentemente omite.",
      methodology: "Metodología del Estándar de Creación (S.o.C.)",
      methodology_desc: "Cada documento se audita contra el estándar legal específico que gobernó su creación — no principios generales, sino el estatuto o código exacto que aplica.",
      creator: "Creado por Michael Vernen Thomas Hartmann"
    },
    footer: { privacy: "Privacidad", terms: "Términos", contact: "Contacto", accessibility: "Accesibilidad" }
  }
};

/* ═══════════════════════════════════════════════════════
   GLOSSARY DATA — EN↔ES legal terms
   ═══════════════════════════════════════════════════════ */
const glossaryTerms = [
  { id: "custody", en: "Custody", es: "Custodia", en_def: "Legal right to make decisions about a child's care and/or physical possession of a child.", es_def: "Derecho legal para tomar decisiones sobre el cuidado de un menor y/o posesión física del menor.", domain: "family_court" },
  { id: "sole_legal_custody", en: "Sole Legal Custody", es: "Custodia Legal Exclusiva", en_def: "One parent has the right and responsibility to make decisions relating to the health, education, and welfare of the child.", es_def: "Un padre tiene el derecho y responsabilidad de tomar decisiones sobre la salud, educación y bienestar del menor.", domain: "family_court" },
  { id: "joint_legal_custody", en: "Joint Legal Custody", es: "Custodia Legal Compartida", en_def: "Both parents share the right and responsibility to make decisions relating to the child.", es_def: "Ambos padres comparten el derecho y responsabilidad de tomar decisiones sobre el menor.", domain: "family_court" },
  { id: "restraining_order", en: "Restraining Order", es: "Orden de Restricción", en_def: "Court order prohibiting specific acts such as contacting or approaching another person.", es_def: "Orden judicial que prohíbe actos específicos como contactar o acercarse a otra persona.", domain: "family_court" },
  { id: "domestic_violence", en: "Domestic Violence", es: "Violencia Doméstica", en_def: "Abuse committed against a current or former spouse, cohabitant, co-parent, or dating partner.", es_def: "Abuso cometido contra cónyuge actual o anterior, conviviente, co-padre/madre, o pareja.", domain: "family_court" },
  { id: "due_process", en: "Due Process", es: "Debido Proceso", en_def: "Constitutional guarantee that legal proceedings will be fair with notice and opportunity to be heard.", es_def: "Garantía constitucional de que los procedimientos serán justos con notificación y oportunidad de ser escuchado.", domain: "constitutional" },
  { id: "equal_protection", en: "Equal Protection", es: "Protección Igualitaria", en_def: "14th Amendment guarantee that no person shall be denied equal protection of the laws.", es_def: "Garantía de la Enmienda 14 de que ninguna persona será privada de protección igualitaria de las leyes.", domain: "constitutional" },
  { id: "section_1983", en: "Section 1983 Claim", es: "Demanda bajo Sección 1983", en_def: "Federal civil rights action against state actors who violate constitutional rights under color of law.", es_def: "Acción federal de derechos civiles contra actores estatales que violan derechos constitucionales.", domain: "constitutional" },
  { id: "custodial_interference", en: "Custodial Interference", es: "Interferencia de Custodia", en_def: "Taking, detaining, or concealing a child in violation of a custody order.", es_def: "Tomar, detener u ocultar a un menor en violación de una orden de custodia.", domain: "family_court" },
  { id: "mandated_reporter", en: "Mandated Reporter", es: "Reportero Obligatorio", en_def: "Person required by law to report suspected child abuse or neglect (Penal Code § 11165.7).", es_def: "Persona obligada por ley a reportar sospecha de abuso o negligencia infantil (Penal Code § 11165.7).", domain: "cps" },
  { id: "probable_cause", en: "Probable Cause", es: "Causa Probable", en_def: "Sufficient reason based on known facts to believe a crime has been committed.", es_def: "Razón suficiente basada en hechos conocidos para creer que se cometió un delito.", domain: "law_enforcement" },
  { id: "miranda_rights", en: "Miranda Rights", es: "Derechos Miranda", en_def: "Right to remain silent and have an attorney during custodial interrogation.", es_def: "Derecho a permanecer en silencio y tener un abogado durante interrogatorio bajo custodia.", domain: "law_enforcement" },
  { id: "best_interest", en: "Best Interest of the Child", es: "Mejor Interés del Menor", en_def: "Standard courts use for custody and visitation decisions (Family Code § 3011).", es_def: "Estándar que tribunales usan para decisiones de custodia y visitas (Family Code § 3011).", domain: "family_court" },
  { id: "ex_parte", en: "Ex Parte", es: "Ex Parte", en_def: "Proceeding or communication by one party without notice to the opposing party.", es_def: "Procedimiento o comunicación por una parte sin notificación a la parte contraria.", domain: "family_court" },
  { id: "contempt", en: "Contempt of Court", es: "Desacato al Tribunal", en_def: "Willful disobedience of a court order, punishable by fine or imprisonment.", es_def: "Desobediencia intencional de una orden judicial, sancionable con multa o encarcelamiento.", domain: "family_court" },
  { id: "color_of_law", en: "Under Color of Law", es: "Bajo Apariencia de Ley", en_def: "Actions taken by government officials using their authority, whether lawful or not.", es_def: "Acciones tomadas por funcionarios gubernamentales usando su autoridad, sean legales o no.", domain: "constitutional" },
  { id: "qualified_immunity", en: "Qualified Immunity", es: "Inmunidad Calificada", en_def: "Doctrine protecting officials from civil liability unless they violated clearly established law.", es_def: "Doctrina que protege funcionarios de responsabilidad civil a menos que violaron ley claramente establecida.", domain: "constitutional" },
  { id: "fiduciary_duty", en: "Fiduciary Duty", es: "Deber Fiduciario", en_def: "Legal obligation to act in the best interest of another party.", es_def: "Obligación legal de actuar en el mejor interés de otra parte.", domain: "attorney_conduct" },
  { id: "pro_se", en: "Pro Se / Self-Represented", es: "Pro Se / Auto-Representado", en_def: "A party who represents themselves in court without an attorney.", es_def: "Una parte que se representa a sí misma en el tribunal sin abogado.", domain: "family_court" },
  { id: "preponderance", en: "Preponderance of Evidence", es: "Preponderancia de la Evidencia", en_def: "Civil standard requiring something is more likely true than not.", es_def: "Estándar civil que requiere que algo sea más probablemente cierto que falso.", domain: "family_court" },
  { id: "welfare_check", en: "Welfare Check", es: "Verificación de Bienestar", en_def: "Law enforcement visit to check on a person's safety and well-being.", es_def: "Visita policial para verificar la seguridad y bienestar de una persona.", domain: "law_enforcement" },
  { id: "subpoena", en: "Subpoena", es: "Citación Judicial", en_def: "Court order requiring a person to testify or produce documents.", es_def: "Orden judicial que requiere que una persona testifique o produzca documentos.", domain: "family_court" },
  { id: "habeas_corpus", en: "Writ of Habeas Corpus", es: "Recurso de Habeas Corpus", en_def: "Court order requiring a detained person be brought before the court.", es_def: "Orden judicial que requiere que una persona detenida sea presentada ante el tribunal.", domain: "constitutional" },
  { id: "substantiated", en: "Substantiated Allegation", es: "Alegación Sustanciada", en_def: "CPS finding that credible evidence supports an allegation of abuse or neglect.", es_def: "Hallazgo de CPS que evidencia creíble apoya la alegación de abuso o negligencia.", domain: "cps" }
];

/* ═══════════════════════════════════════════════════════
   LANGUAGE CONTEXT
   ═══════════════════════════════════════════════════════ */
const LangCtx = createContext();
function useLang() { return useContext(LangCtx); }

function LangProvider({ children }) {
  const [lang, setLangState] = useState("en");
  const setLang = (l) => { setLangState(l); };
  const t = (key) => key.split(".").reduce((o, k) => o?.[k], translations[lang]) || key;
  const toggle = () => setLang(lang === "en" ? "es" : "en");
  return <LangCtx.Provider value={{ lang, setLang, t, toggle }}>{children}</LangCtx.Provider>;
}

/* ═══════════════════════════════════════════════════════
   ICONS (inline SVG to avoid dependencies)
   ═══════════════════════════════════════════════════════ */
const Icons = {
  Globe: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Upload: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Shield: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Arrow: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Book: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Scale: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"/><path d="M5 6l7-3 7 3"/><path d="M2 15l3-9 3 9a5.24 5.24 0 0 1-6 0z"/><path d="M16 15l3-9 3 9a5.24 5.24 0 0 1-6 0z"/></svg>,
};

/* ═══════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════ */

function Header() {
  const { t, toggle, lang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(10,12,16,0.95)" : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
      transition: "all 0.3s ease", padding: "0 clamp(20px, 4vw, 60px)"
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 64 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, color: "#e8e0d4", letterSpacing: "-0.02em", fontWeight: 400 }}>{t("app.name")}</span>
          <span style={{ fontSize: 10, color: "#8b7e6a", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>{t("app.tagline")}</span>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {["audit", "glossary", "pricing", "about"].map(s => (
            <a key={s} href={`#${s}`} style={{ color: "#9b9284", fontSize: 13, textDecoration: "none", letterSpacing: "0.03em", fontFamily: "'DM Sans', sans-serif", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = "#e8e0d4"} onMouseLeave={e => e.target.style.color = "#9b9284"}>
              {t(`nav.${s}`)}
            </a>
          ))}
          <button onClick={toggle} style={{
            display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 12px",
            color: "#c9b99a", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.2s", letterSpacing: "0.02em"
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(201,185,154,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>
            <Icons.Globe /> {t("nav.language")}
          </button>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  const { t } = useLang();
  return (
    <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "120px clamp(20px, 5vw, 80px) 80px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(139,126,106,0.08), transparent)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "15%", left: "8%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,185,154,0.04), transparent)", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 800, animation: "fadeUp 0.8s ease-out" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(201,185,154,0.08)", border: "1px solid rgba(201,185,154,0.15)", borderRadius: 20, padding: "6px 16px", marginBottom: 32, fontSize: 12, color: "#c9b99a", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.04em" }}>
          <Icons.Globe /> {t("hero.badge")}
        </div>
        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 400, color: "#e8e0d4", lineHeight: 1.1, marginBottom: 24, letterSpacing: "-0.02em" }}>
          {t("hero.headline")}
        </h1>
        <p style={{ fontSize: "clamp(16px, 1.8vw, 20px)", color: "#8b7e6a", lineHeight: 1.6, maxWidth: 600, margin: "0 auto 40px", fontFamily: "'DM Sans', sans-serif" }}>
          {t("hero.subheadline")}
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="#audit" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 32px", background: "linear-gradient(135deg, #c9b99a, #a89474)", color: "#0a0c10", borderRadius: 8, fontWeight: 600, fontSize: 15, textDecoration: "none", fontFamily: "'DM Sans', sans-serif", transition: "all 0.25s", boxShadow: "0 4px 20px rgba(201,185,154,0.2)" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
            {t("hero.cta_primary")} <Icons.Arrow />
          </a>
          <a href="#features" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 32px", background: "transparent", border: "1px solid rgba(201,185,154,0.25)", color: "#c9b99a", borderRadius: 8, fontSize: 15, textDecoration: "none", fontFamily: "'DM Sans', sans-serif", transition: "all 0.25s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,185,154,0.06)"; e.currentTarget.style.borderColor = "rgba(201,185,154,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(201,185,154,0.25)"; }}>
            {t("hero.cta_secondary")}
          </a>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const { t } = useLang();
  const steps = t("features.steps");
  return (
    <section id="features" style={{ padding: "100px clamp(20px, 5vw, 80px)", maxWidth: 1200, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 36, color: "#e8e0d4", fontWeight: 400, textAlign: "center", marginBottom: 60 }}>{t("features.title")}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32 }}>
        {Array.isArray(steps) && steps.map((step, i) => (
          <div key={i} style={{ padding: 32, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, transition: "all 0.3s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,185,154,0.04)"; e.currentTarget.style.borderColor = "rgba(201,185,154,0.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 32, color: "rgba(201,185,154,0.3)", marginBottom: 16 }}>{step.num}</div>
            <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, color: "#e8e0d4", fontWeight: 600, marginBottom: 12 }}>{step.title}</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#8b7e6a", lineHeight: 1.7 }}>{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AuditSection() {
  const { t, lang } = useLang();
  const [domain, setDomain] = useState("");
  const [outputLang, setOutputLang] = useState(lang);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const domainKeys = ["constitutional","family_court","cps","law_enforcement","fbi","attorney_conduct","psychiatry","fcs_mediator","victim_rights","labor","state_agency","fcra","ssa_disability","military"];

  useEffect(() => { setOutputLang(lang); }, [lang]);

  const handleFile = (e) => {
    const f = e.target?.files?.[0] || e.dataTransfer?.files?.[0];
    if (f) setFileName(f.name);
  };

  const radioStyle = (active) => ({
    display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
    background: active ? "rgba(201,185,154,0.1)" : "rgba(255,255,255,0.02)",
    border: `1px solid ${active ? "rgba(201,185,154,0.35)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: 8, cursor: "pointer", transition: "all 0.2s",
    color: active ? "#c9b99a" : "#8b7e6a", fontSize: 14, fontFamily: "'DM Sans', sans-serif"
  });

  return (
    <section id="audit" style={{ padding: "100px clamp(20px, 5vw, 80px)", maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 36, color: "#e8e0d4", fontWeight: 400, textAlign: "center", marginBottom: 48 }}>{t("audit.title")}</h2>

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "clamp(24px, 4vw, 48px)" }}>
        {/* Upload */}
        <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9b9284", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>{t("audit.upload_label")}</label>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e); }}
          onClick={() => document.getElementById("file-input").click()}
          style={{
            border: `2px dashed ${dragOver ? "rgba(201,185,154,0.5)" : "rgba(255,255,255,0.08)"}`,
            borderRadius: 12, padding: "40px 24px", textAlign: "center", cursor: "pointer",
            background: dragOver ? "rgba(201,185,154,0.04)" : "transparent", transition: "all 0.3s", marginBottom: 8
          }}>
          <input id="file-input" type="file" accept=".pdf,.docx,.txt,.doc" onChange={handleFile} style={{ display: "none" }} />
          <Icons.Upload />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: fileName ? "#c9b99a" : "#6b6259", marginTop: 12 }}>
            {fileName || t("audit.upload_drop")}
          </p>
        </div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#5a544a", marginBottom: 32 }}>{t("audit.upload_hint")}</p>

        {/* Domain */}
        <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9b9284", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>{t("audit.select_domain")}</label>
        <select value={domain} onChange={e => setDomain(e.target.value)} style={{
          width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, color: domain ? "#e8e0d4" : "#6b6259", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
          appearance: "none", cursor: "pointer", marginBottom: 32, outline: "none"
        }}>
          <option value="">—</option>
          {domainKeys.map(d => <option key={d} value={d} style={{ background: "#1a1c22", color: "#e8e0d4" }}>{t(`audit.domains.${d}`)}</option>)}
        </select>

        {/* Output Language */}
        <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9b9284", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 12 }}>{t("audit.language_output")}</label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 36 }}>
          {[["en", "language_english"], ["es", "language_spanish"], ["both", "language_both"]].map(([val, key]) => (
            <label key={val} style={radioStyle(outputLang === val)} onClick={() => setOutputLang(val)}>
              <input type="radio" name="olang" value={val} checked={outputLang === val} onChange={() => setOutputLang(val)} style={{ display: "none" }} />
              <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${outputLang === val ? "#c9b99a" : "rgba(255,255,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                {outputLang === val && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#c9b99a" }} />}
              </div>
              {t(`audit.${key}`)}
            </label>
          ))}
        </div>

        {/* Submit */}
        <button disabled={!fileName || !domain} style={{
          width: "100%", padding: "16px", background: (!fileName || !domain) ? "rgba(201,185,154,0.15)" : "linear-gradient(135deg, #c9b99a, #a89474)",
          border: "none", borderRadius: 8, color: (!fileName || !domain) ? "#6b6259" : "#0a0c10", fontWeight: 600, fontSize: 16,
          fontFamily: "'DM Sans', sans-serif", cursor: (!fileName || !domain) ? "not-allowed" : "pointer", transition: "all 0.3s",
          letterSpacing: "0.02em"
        }}>
          {t("audit.submit")}
        </button>
      </div>
    </section>
  );
}

function GlossarySection() {
  const { t, lang } = useLang();
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const domainLabels = t("glossary.domain_labels");
  const uniqueDomains = [...new Set(glossaryTerms.map(t => t.domain))];

  const filtered = glossaryTerms.filter(term => {
    const q = search.toLowerCase();
    const matchSearch = !q || term.en.toLowerCase().includes(q) || term.es.toLowerCase().includes(q) || term.en_def.toLowerCase().includes(q) || term.es_def.toLowerCase().includes(q);
    const matchDomain = domainFilter === "all" || term.domain === domainFilter;
    return matchSearch && matchDomain;
  });

  return (
    <section id="glossary" style={{ padding: "100px clamp(20px, 5vw, 80px)", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 36, color: "#e8e0d4", fontWeight: 400, marginBottom: 12 }}>{t("glossary.title")}</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#8b7e6a" }}>{t("glossary.subtitle")}</p>
      </div>

      {/* Search + Filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 250, position: "relative" }}>
          <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6b6259" }}><Icons.Search /></div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("glossary.search")}
            style={{ width: "100%", padding: "12px 12px 12px 40px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e8e0d4", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
        </div>
        <select value={domainFilter} onChange={e => setDomainFilter(e.target.value)} style={{
          padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, color: "#e8e0d4", fontSize: 14, fontFamily: "'DM Sans', sans-serif", appearance: "none", cursor: "pointer", outline: "none", minWidth: 180
        }}>
          <option value="all" style={{ background: "#1a1c22" }}>{t("glossary.domains_all")}</option>
          {uniqueDomains.map(d => <option key={d} value={d} style={{ background: "#1a1c22" }}>{(typeof domainLabels === "object" && domainLabels[d]) || d}</option>)}
        </select>
      </div>

      {/* Terms Grid */}
      {filtered.length === 0 ? (
        <p style={{ textAlign: "center", color: "#6b6259", fontFamily: "'DM Sans', sans-serif", padding: 40 }}>{t("glossary.no_results")}</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filtered.map(term => (
            <div key={term.id} style={{
              padding: "20px 24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10, transition: "all 0.25s"
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,185,154,0.2)"; e.currentTarget.style.background = "rgba(201,185,154,0.03)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600, color: "#e8e0d4" }}>{term.en}</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6b6259", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {(typeof domainLabels === "object" && domainLabels[term.domain]) || term.domain}
                </span>
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#c9b99a", marginBottom: 10, fontStyle: "italic" }}>{term.es}</div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#8b7e6a", lineHeight: 1.6, margin: 0 }}>
                {lang === "en" ? term.en_def : term.es_def}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PricingSection() {
  const { t } = useLang();
  const tiers = t("pricing.tiers");
  if (!Array.isArray(tiers)) return null;
  return (
    <section id="pricing" style={{ padding: "100px clamp(20px, 5vw, 80px)", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 60 }}>
        <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 36, color: "#e8e0d4", fontWeight: 400, marginBottom: 12 }}>{t("pricing.title")}</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#8b7e6a" }}>{t("pricing.subtitle")}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, alignItems: "start" }}>
        {tiers.map((tier, i) => (
          <div key={i} style={{
            padding: "36px 32px", background: tier.featured ? "rgba(201,185,154,0.06)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${tier.featured ? "rgba(201,185,154,0.25)" : "rgba(255,255,255,0.06)"}`,
            borderRadius: 14, position: "relative", transition: "all 0.3s"
          }}>
            <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#e8e0d4", fontWeight: 600, marginBottom: 8 }}>{tier.name}</h3>
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 40, color: tier.featured ? "#c9b99a" : "#e8e0d4", fontWeight: 400 }}>{tier.price}</span>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6b6259", marginBottom: 28 }}>{tier.unit}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px 0" }}>
              {tier.features.map((f, j) => (
                <li key={j} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#9b9284" }}>
                  <span style={{ color: "#c9b99a", flexShrink: 0 }}><Icons.Check /></span> {f}
                </li>
              ))}
            </ul>
            <button style={{
              width: "100%", padding: "14px", borderRadius: 8, fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", transition: "all 0.25s", letterSpacing: "0.02em",
              background: tier.featured ? "linear-gradient(135deg, #c9b99a, #a89474)" : "transparent",
              color: tier.featured ? "#0a0c10" : "#c9b99a",
              border: tier.featured ? "none" : "1px solid rgba(201,185,154,0.25)"
            }}>
              {tier.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function AboutSection() {
  const { t } = useLang();
  return (
    <section id="about" style={{ padding: "100px clamp(20px, 5vw, 80px)", maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 36, color: "#e8e0d4", fontWeight: 400, textAlign: "center", marginBottom: 40 }}>{t("about.title")}</h2>
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "clamp(24px, 4vw, 48px)" }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#9b9284", lineHeight: 1.8, marginBottom: 20 }}>{t("about.p1")}</p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#9b9284", lineHeight: 1.8, marginBottom: 32 }}>{t("about.p2")}</p>
        <div style={{ padding: "24px 28px", background: "rgba(201,185,154,0.04)", borderLeft: "3px solid rgba(201,185,154,0.3)", borderRadius: "0 8px 8px 0", marginBottom: 28 }}>
          <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#c9b99a", fontWeight: 600, marginBottom: 8 }}>{t("about.methodology")}</h4>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#8b7e6a", lineHeight: 1.7, margin: 0 }}>{t("about.methodology_desc")}</p>
        </div>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#6b6259", textAlign: "center", letterSpacing: "0.04em" }}>{t("about.creator")}</p>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useLang();
  return (
    <footer style={{ padding: "48px clamp(20px, 5vw, 80px)", borderTop: "1px solid rgba(255,255,255,0.06)", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", gap: 24 }}>
          {["privacy", "terms", "contact", "accessibility"].map(k => (
            <a key={k} href={`#${k}`} style={{ color: "#6b6259", fontSize: 12, textDecoration: "none", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.03em" }}>{t(`footer.${k}`)}</a>
          ))}
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#4a453e", margin: 0 }}>{t("app.copyright")}</p>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#3a362f", margin: "4px 0 0", letterSpacing: "0.06em" }}>{t("app.tagline")}</p>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════ */
export default function App() {
  return (
    <LangProvider>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { background: #0a0c10; color: #e8e0d4; -webkit-font-smoothing: antialiased; }
        ::selection { background: rgba(201,185,154,0.3); color: #e8e0d4; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0c10; }
        ::-webkit-scrollbar-thumb { background: rgba(201,185,154,0.2); border-radius: 3px; }
        input:focus, select:focus { border-color: rgba(201,185,154,0.4) !important; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={{ minHeight: "100vh", position: "relative" }}>
        {/* Subtle grain texture overlay */}
        <div style={{ position: "fixed", inset: 0, opacity: 0.015, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")", pointerEvents: "none", zIndex: 0 }} />
        <Header />
        <main style={{ position: "relative", zIndex: 1 }}>
          <Hero />
          <Features />
          <AuditSection />
          <GlossarySection />
          <PricingSection />
          <AboutSection />
        </main>
        <Footer />
      </div>
    </LangProvider>
  );
}
