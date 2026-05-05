import { useState, useEffect, useRef, useCallback } from "react";

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS & DATA
// ════════════════════════════════════════════════════════════════════════════

const COURTS = {
  "Alameda Superior Court": { type: "state", county: "Alameda", div: "Family Law", judge_title: "Judge" },
  "Solano Superior Court": { type: "state", county: "Solano", div: "Family Law", judge_title: "Judge" },
  "Marin Superior Court": { type: "state", county: "Marin", div: "Family Law", judge_title: "Judge" },
  "Contra Costa Superior Court": { type: "state", county: "Contra Costa", div: "Family Law", judge_title: "Judge" },
  "N.D. Cal. – Oakland": { type: "federal", district: "Northern District of California", div: "Civil", judge_title: "District Judge" },
  "N.D. Cal. – San Francisco": { type: "federal", district: "Northern District of California", div: "Civil", judge_title: "District Judge" },
  "9th Circuit (Appellate)": { type: "appellate", div: "Civil Appeals", judge_title: "Circuit Judge" },
};

const CLAIMS = [
  { id: "custody_enforce", label: "Custody Enforcement", codes: ["Fam. Code § 3022", "Fam. Code § 3048", "Fam. Code § 3064"], category: "Family Law" },
  { id: "contempt_290", label: "Contempt of Court (FL)", codes: ["Fam. Code § 290", "CCP § 1209", "CCP § 1211"], category: "Family Law" },
  { id: "uccjea_challenge", label: "UCCJEA Jurisdictional Challenge", codes: ["Fam. Code § 3421", "Fam. Code § 3422", "Fam. Code § 3426"], category: "Family Law" },
  { id: "emergency_tro", label: "Emergency Protective Order / TRO", codes: ["CCP § 527", "FRCP 65", "Fam. Code § 6320", "Fam. Code § 6380"], category: "Family Law" },
  { id: "sanctions_271", label: "Sanctions – Fam. Code § 271", codes: ["Fam. Code § 271", "CCP § 128.5", "CCP § 128.7"], category: "Family Law" },
  { id: "civil_rights_1983", label: "Civil Rights — 42 U.S.C. § 1983", codes: ["42 U.S.C. § 1983", "42 U.S.C. § 1988", "14th Amendment"], category: "Federal Civil Rights" },
  { id: "rico_1962", label: "RICO — 18 U.S.C. § 1962", codes: ["18 U.S.C. § 1962(c)", "18 U.S.C. § 1962(d)", "18 U.S.C. § 1964(c)"], category: "Federal Civil Rights" },
  { id: "fraud_constructive", label: "Fraud / Constructive Trust", codes: ["Civ. Code § 1572", "Civ. Code § 2224", "CCP § 338(d)"], category: "Civil" },
  { id: "iied", label: "IIED / Negligence", codes: ["Civ. Code § 1714", "CACI 1600"], category: "Civil" },
  { id: "quiet_title", label: "Quiet Title", codes: ["CCP § 760.010", "CCP § 764.010"], category: "Civil" },
  { id: "false_arrest", label: "False Arrest / Malicious Prosecution", codes: ["42 U.S.C. § 1983", "Pen. Code § 847"], category: "Federal Civil Rights" },
  { id: "atty_fees_1021", label: "Attorney Fees – CCP § 1021.5", codes: ["CCP § 1021.5", "CCP § 1033.5"], category: "Civil" },
];

const PHASES = [
  { id: "setup", label: "Case Setup", icon: "⚙" },
  { id: "pleadings", label: "Pleadings", icon: "📄" },
  { id: "emergency", label: "Emergency Relief", icon: "🚨" },
  { id: "uccjea", label: "UCCJEA Analysis", icon: "⚖" },
  { id: "discovery", label: "Discovery", icon: "🔍" },
  { id: "motions", label: "Motions", icon: "📋" },
  { id: "contempt", label: "Contempt / OSC", icon: "⛓" },
  { id: "trial", label: "Trial", icon: "🏛" },
  { id: "verdict", label: "Verdict & Damages", icon: "💰" },
  { id: "appeal", label: "Appeal", icon: "📜" },
];

const LANGS = [
  { code: "en", label: "English" }, { code: "es", label: "Español" },
  { code: "zh", label: "中文" }, { code: "vi", label: "Tiếng Việt" },
  { code: "ar", label: "العربية" }, { code: "ko", label: "한국어" },
  { code: "pt", label: "Português" }, { code: "ru", label: "Русский" },
  { code: "tl", label: "Filipino" }, { code: "so", label: "Somali" },
  { code: "am", label: "አማርኛ" }, { code: "ht", label: "Kreyòl" }, { code: "ti", label: "ትግርኛ" },
];

const MOTION_TYPES = [
  { id: "tro", label: "TRO / Ex Parte", authority: "CCP § 527; FRCP 65" },
  { id: "osc_contempt", label: "OSC re: Contempt", authority: "Fam. Code § 290; CCP § 1209" },
  { id: "msj", label: "Motion for Summary Judgment", authority: "CCP § 437c; FRCP 56" },
  { id: "demurrer", label: "Demurrer", authority: "CCP § 430.10" },
  { id: "mts", label: "Motion to Strike", authority: "CCP § 435" },
  { id: "compel", label: "Motion to Compel Discovery", authority: "CCP § 2030.300; FRCP 37" },
  { id: "atty_fees_1988", label: "Attorney Fees – 42 U.S.C. § 1988", authority: "42 U.S.C. § 1988; FRCP 54(d)" },
  { id: "atty_fees_1021", label: "Attorney Fees – CCP § 1021.5", authority: "CCP § 1021.5" },
  { id: "sanctions_271", label: "Sanctions – Fam. Code § 271", authority: "Fam. Code § 271" },
  { id: "sanctions_128", label: "Sanctions – CCP § 128.5/128.7", authority: "CCP § 128.5; CCP § 128.7" },
  { id: "uccjea_object", label: "UCCJEA Objection to Jurisdiction", authority: "Fam. Code § 3426; Fam. Code § 3427" },
  { id: "dismiss", label: "Motion to Dismiss", authority: "FRCP 12(b)(1); CCP § 418.10" },
];

const DISCOVERY_TYPES = [
  { id: "rog", label: "Interrogatories", limit: "35 (state) / 25 (federal)", authority: "CCP § 2030.010; FRCP 33" },
  { id: "rfa", label: "Requests for Admission", limit: "No limit (state)", authority: "CCP § 2033.010; FRCP 36" },
  { id: "rpd", label: "Requests for Production", limit: "No limit", authority: "CCP § 2031.010; FRCP 34" },
  { id: "depo", label: "Deposition", limit: "10 (federal); 7 hrs/deponent", authority: "CCP § 2025.010; FRCP 30" },
  { id: "subpoena", label: "Subpoena – Third Party Records", limit: "Unlimited", authority: "CCP § 1985.3; FRCP 45" },
  { id: "exam", label: "Medical/Psychological Exam", limit: "1 per party", authority: "CCP § 2032.010; FRCP 35" },
];

const APPEAL_GROUNDS = [
  { id: "abuse_discretion", label: "Abuse of Discretion", standard: "Highly deferential – court must have exceeded bounds of reason" },
  { id: "de_novo", label: "Legal Error – De Novo Review", standard: "No deference – appellate court reviews legal conclusions independently" },
  { id: "substantial_evidence", label: "Insufficient Evidence", standard: "Whether substantial evidence supports the finding" },
  { id: "due_process", label: "Due Process Violation", standard: "Whether fundamental fairness was denied; de novo on constitutional questions" },
  { id: "jurisdiction", label: "Jurisdictional Error", standard: "De novo – jurisdiction is a question of law" },
  { id: "new_evidence", label: "Newly Discovered Evidence", standard: "CCP § 657; FRCP 60(b)(2) – must be newly discovered, not newly found" },
  { id: "fraud_court", label: "Fraud on the Court", standard: "FRCP 60(b)(3); Fam. Code § 215 – intrinsic/extrinsic fraud distinction" },
];

// ════════════════════════════════════════════════════════════════════════════
// AI ENGINE
// ════════════════════════════════════════════════════════════════════════════

async function callAI(systemPrompt, userMessage) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    const data = await response.json();
    return data.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "No response generated.";
  } catch (e) {
    return `[AI Error: ${e.message}]`;
  }
}

function buildJudgePrompt(court, caseData) {
  return `You are a ${COURTS[court]?.judge_title || "Judge"} presiding at ${court}. 
Case: ${caseData.title || "Untitled"} | Claims: ${(caseData.claims || []).join(", ")}
Apply California Rules of Court (or Federal Rules if federal court) with strict procedural fidelity.
When ruling: lead with RULING: [GRANT / DENY / GRANT IN PART / CONTINUE], then cite authority and state reasoning in 150 words max.
Be impartial. Flag standing, jurisdiction, or service issues sua sponte.`;
}

function buildOpposingPrompt(party, court) {
  return `You are opposing counsel representing ${party || "Respondent"} in ${court}.
Your job: zealously oppose the motion or position presented. Raise procedural defects first, then factual disputes, then legal arguments.
Cite specific authority. Keep response under 200 words. Be adversarial but professional.`;
}

function buildClerkPrompt(court) {
  return `You are the clerk at ${court} reviewing a filing for procedural compliance.
Check: correct form numbers, required signatures, proof of service, filing fees, CRC formatting, and jurisdictional prerequisites.
List any defects with the specific rule violated. Format as a numbered defect list. If no defects, state "FILING ACCEPTED."`;
}

// ════════════════════════════════════════════════════════════════════════════
// STORAGE
// ════════════════════════════════════════════════════════════════════════════

async function saveCase(caseData) {
  try { await window.storage.set("vernen_case", JSON.stringify(caseData)); } catch (e) {}
}
async function loadCase() {
  try {
    const r = await window.storage.get("vernen_case");
    return r ? JSON.parse(r.value) : null;
  } catch (e) { return null; }
}
async function clearCase() {
  try { await window.storage.delete("vernen_case"); } catch (e) {}
}

// ════════════════════════════════════════════════════════════════════════════
// UI PRIMITIVES
// ════════════════════════════════════════════════════════════════════════════

const S = {
  bg: "#0d0f13",
  panel: "#13161c",
  border: "#1e2330",
  borderHover: "#2a3045",
  gold: "#c9a227",
  goldDim: "#8a6d18",
  text: "#d8dce8",
  textDim: "#7a8099",
  textFaint: "#454d66",
  red: "#c94040",
  green: "#3a8f5a",
  blue: "#3060a8",
  accent: "#1a2035",
};

const css = {
  app: {
    background: S.bg,
    minHeight: "100vh",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    color: S.text,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    borderBottom: `1px solid ${S.border}`,
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: S.panel,
  },
  logo: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: S.gold,
    fontFamily: "monospace",
  },
  layout: { display: "flex", flex: 1, minHeight: 0 },
  sidebar: {
    width: 200,
    borderRight: `1px solid ${S.border}`,
    background: S.panel,
    padding: "12px 0",
    display: "flex",
    flexDirection: "column",
    gap: 2,
    overflowY: "auto",
  },
  sideItem: (active) => ({
    padding: "9px 16px",
    cursor: "pointer",
    fontSize: 13,
    color: active ? S.gold : S.textDim,
    background: active ? S.accent : "transparent",
    borderLeft: `2px solid ${active ? S.gold : "transparent"}`,
    display: "flex",
    alignItems: "center",
    gap: 8,
    transition: "all 0.15s",
    fontFamily: "monospace",
  }),
  content: { flex: 1, padding: "24px 32px", overflowY: "auto", maxWidth: 900 },
  card: {
    background: S.panel,
    border: `1px solid ${S.border}`,
    borderRadius: 6,
    padding: "20px 24px",
    marginBottom: 16,
  },
  h2: { fontSize: 18, fontWeight: 700, color: S.gold, marginBottom: 16, letterSpacing: "0.05em" },
  h3: { fontSize: 14, fontWeight: 700, color: S.text, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" },
  label: { fontSize: 12, color: S.textDim, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" },
  input: {
    width: "100%",
    background: S.bg,
    border: `1px solid ${S.border}`,
    borderRadius: 4,
    padding: "8px 10px",
    color: S.text,
    fontSize: 13,
    fontFamily: "'Georgia', serif",
    boxSizing: "border-box",
    outline: "none",
  },
  select: {
    width: "100%",
    background: S.bg,
    border: `1px solid ${S.border}`,
    borderRadius: 4,
    padding: "8px 10px",
    color: S.text,
    fontSize: 13,
    fontFamily: "monospace",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    background: S.bg,
    border: `1px solid ${S.border}`,
    borderRadius: 4,
    padding: "10px",
    color: S.text,
    fontSize: 13,
    fontFamily: "'Georgia', serif",
    resize: "vertical",
    minHeight: 100,
    boxSizing: "border-box",
  },
  btn: (variant = "primary") => ({
    padding: "9px 20px",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "monospace",
    letterSpacing: "0.05em",
    background: variant === "primary" ? S.gold : variant === "danger" ? S.red : S.border,
    color: variant === "primary" ? "#000" : S.text,
    fontWeight: 700,
  }),
  badge: (color = S.gold) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 3,
    fontSize: 11,
    fontFamily: "monospace",
    background: color + "22",
    color: color,
    border: `1px solid ${color}44`,
  }),
  code: {
    background: S.bg,
    border: `1px solid ${S.border}`,
    borderRadius: 4,
    padding: "12px 16px",
    fontSize: 12,
    fontFamily: "monospace",
    color: S.text,
    whiteSpace: "pre-wrap",
    lineHeight: 1.6,
  },
  aiBox: {
    background: "#0a1020",
    border: `1px solid ${S.blue}44`,
    borderRadius: 6,
    padding: "14px 18px",
    fontSize: 13,
    lineHeight: 1.7,
    marginTop: 12,
    fontFamily: "'Georgia', serif",
    color: S.text,
    whiteSpace: "pre-wrap",
  },
  row: { display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" },
  col: { flex: 1, minWidth: 140 },
  tag: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 3,
    fontSize: 11,
    fontFamily: "monospace",
    background: S.accent,
    color: S.textDim,
    border: `1px solid ${S.border}`,
    marginRight: 5,
    marginBottom: 5,
    cursor: "pointer",
  },
  tagActive: {
    background: S.gold + "22",
    color: S.gold,
    border: `1px solid ${S.gold}55`,
  },
  rule: { borderTop: `1px solid ${S.border}`, margin: "16px 0" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
};

// ════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function Spinner() {
  return <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: 14 }}>⟳</span>;
}

function AIPanel({ label, response, loading }) {
  if (!response && !loading) return null;
  return (
    <div style={css.aiBox}>
      <div style={{ ...css.badge(S.blue), marginBottom: 8 }}>{label || "AI RESPONSE"}</div>
      {loading ? <div style={{ color: S.textDim }}><Spinner /> Generating...</div> : <div>{response}</div>}
    </div>
  );
}

function Field({ label, children, col }) {
  return (
    <div style={{ marginBottom: 14, ...(col ? {} : {}) }}>
      {label && <label style={css.label}>{label}</label>}
      {children}
    </div>
  );
}

function ClaimSelector({ selected, onChange }) {
  const categories = [...new Set(CLAIMS.map(c => c.category))];
  return (
    <div>
      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: S.textFaint, fontFamily: "monospace", marginBottom: 5, textTransform: "uppercase" }}>{cat}</div>
          <div>
            {CLAIMS.filter(c => c.category === cat).map(c => {
              const active = selected.includes(c.id);
              return (
                <span
                  key={c.id}
                  onClick={() => onChange(active ? selected.filter(x => x !== c.id) : [...selected, c.id])}
                  style={{ ...css.tag, ...(active ? css.tagActive : {}) }}
                >
                  {c.label}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE: SETUP
// ════════════════════════════════════════════════════════════════════════════

function PhaseSetup({ caseData, update }) {
  return (
    <div>
      <div style={css.h2}>⚙ CASE SETUP</div>
      <div style={css.card}>
        <div style={css.h3}>Case Identification</div>
        <div style={css.grid2}>
          <Field label="Case Number">
            <input style={css.input} value={caseData.caseNumber || ""} onChange={e => update("caseNumber", e.target.value)} placeholder="RF09456481 / CV-25-0000" />
          </Field>
          <Field label="Court">
            <select style={css.select} value={caseData.court || ""} onChange={e => update("court", e.target.value)}>
              <option value="">-- Select Court --</option>
              {Object.keys(COURTS).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Case Title">
            <input style={css.input} value={caseData.title || ""} onChange={e => update("title", e.target.value)} placeholder="Hartmann v. Respondent" />
          </Field>
          <Field label="Filing Date">
            <input type="date" style={css.input} value={caseData.filingDate || ""} onChange={e => update("filingDate", e.target.value)} />
          </Field>
        </div>
      </div>
      <div style={css.card}>
        <div style={css.h3}>Parties</div>
        <div style={css.grid2}>
          <Field label="Petitioner / Plaintiff">
            <input style={css.input} value={caseData.petitioner || ""} onChange={e => update("petitioner", e.target.value)} placeholder="Michael Vernen Thomas Hartmann" />
          </Field>
          <Field label="Respondent / Defendant">
            <input style={css.input} value={caseData.respondent || ""} onChange={e => update("respondent", e.target.value)} placeholder="Christina Hartmann" />
          </Field>
          <Field label="Petitioner Role">
            <select style={css.select} value={caseData.petitionerRole || "Pro Se"} onChange={e => update("petitionerRole", e.target.value)}>
              <option>Pro Se</option><option>Petitioner w/ Counsel</option><option>Plaintiff (Federal)</option>
            </select>
          </Field>
          <Field label="Respondent's Attorney">
            <input style={css.input} value={caseData.respAtty || ""} onChange={e => update("respAtty", e.target.value)} placeholder="Name / Unknown" />
          </Field>
          <Field label="Minor Children">
            <input style={css.input} value={caseData.children || ""} onChange={e => update("children", e.target.value)} placeholder="Cole Hartmann, DOB 10/24/2008" />
          </Field>
          <Field label="Interface Language">
            <select style={css.select} value={caseData.language || "en"} onChange={e => update("language", e.target.value)}>
              {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </Field>
        </div>
      </div>
      <div style={css.card}>
        <div style={css.h3}>Claims / Causes of Action</div>
        <ClaimSelector selected={caseData.claims || []} onChange={v => update("claims", v)} />
        {(caseData.claims || []).length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: S.textFaint, marginBottom: 6 }}>SELECTED STATUTORY AUTHORITY:</div>
            {(caseData.claims || []).flatMap(id => CLAIMS.find(c => c.id === id)?.codes || []).map((code, i) => (
              <span key={i} style={{ ...css.badge(S.gold), marginRight: 5, marginBottom: 4, display: "inline-block" }}>{code}</span>
            ))}
          </div>
        )}
      </div>
      <div style={css.card}>
        <div style={css.h3}>Summary of Facts</div>
        <Field>
          <textarea
            style={{ ...css.textarea, minHeight: 140 }}
            value={caseData.facts || ""}
            onChange={e => update("facts", e.target.value)}
            placeholder="Chronological statement of operative facts, jurisdictional basis, and relief sought..."
          />
        </Field>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE: PLEADINGS
// ════════════════════════════════════════════════════════════════════════════

function PhasePleadings({ caseData, update }) {
  const [aiResp, setAiResp] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("petition");

  const MODES = [
    { id: "petition", label: "Petition / Complaint" },
    { id: "response", label: "Response / Answer" },
    { id: "cross", label: "Cross-Complaint" },
    { id: "demurrer_draft", label: "Demurrer Draft" },
  ];

  async function reviewPleading() {
    if (!caseData.court) return;
    setLoading(true);
    const prompt = buildClerkPrompt(caseData.court);
    const resp = await callAI(prompt, `Review this ${mode} for ${caseData.court}:\n\n${caseData["pleading_" + mode] || "(empty)"}\n\nClaims: ${(caseData.claims || []).map(id => CLAIMS.find(c => c.id === id)?.label).join(", ")}`);
    setAiResp(resp);
    setLoading(false);
  }

  async function draftPleading() {
    if (!caseData.court) return;
    setLoading(true);
    const sys = `You are a legal drafting assistant specializing in California family law and federal civil rights. Draft a ${mode} for ${caseData.court}. Use proper California judicial council formatting. Include caption, numbered paragraphs, and prayer for relief. Base it on the facts provided.`;
    const resp = await callAI(sys, `Draft a ${mode} for:\nTitle: ${caseData.title}\nCourt: ${caseData.court}\nPetitioner: ${caseData.petitioner}\nRespondent: ${caseData.respondent}\nClaims: ${(caseData.claims || []).map(id => CLAIMS.find(c => c.id === id)?.label).join(", ")}\nFacts: ${caseData.facts || "(not provided)"}`);
    update("pleading_" + mode, resp);
    setLoading(false);
  }

  return (
    <div>
      <div style={css.h2}>📄 PLEADINGS</div>
      <div style={css.card}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{ ...css.btn(mode === m.id ? "primary" : "secondary"), padding: "6px 14px" }}>{m.label}</button>
          ))}
        </div>
        <div style={css.h3}>{MODES.find(m => m.id === mode)?.label}</div>
        <Field>
          <textarea
            style={{ ...css.textarea, minHeight: 200 }}
            value={caseData["pleading_" + mode] || ""}
            onChange={e => update("pleading_" + mode, e.target.value)}
            placeholder={`Enter ${MODES.find(m => m.id === mode)?.label} text, or click 'Draft' to generate...`}
          />
        </Field>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={css.btn("primary")} onClick={draftPleading} disabled={loading}>
            {loading ? "Drafting..." : "Draft w/ AI"}
          </button>
          <button style={css.btn("secondary")} onClick={reviewPleading} disabled={loading}>
            Clerk Review
          </button>
        </div>
        <AIPanel label={mode === "petition" ? "CLERK COMPLIANCE REVIEW" : "AI DRAFT / REVIEW"} response={aiResp} loading={loading} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE: EMERGENCY RELIEF
// ════════════════════════════════════════════════════════════════════════════

function PhaseEmergency({ caseData, update }) {
  const [mode, setMode] = useState("tro_app");
  const [aiResp, setAiResp] = useState("");
  const [loading, setLoading] = useState(false);
  const [facts, setFacts] = useState(caseData.emergency_facts || "");

  const isFederal = COURTS[caseData.court]?.type === "federal";

  async function runAction(action) {
    setLoading(true);
    let sys, msg;
    if (action === "judge") {
      sys = buildJudgePrompt(caseData.court || "Alameda Superior Court", caseData);
      msg = `TRO APPLICATION:\nRelief Sought: ${caseData.tro_relief || "(not specified)"}\nStandard: ${isFederal ? "FRCP 65 (likelihood of success, irreparable harm, balance of hardships, public interest)" : "CCP § 527 (great or irreparable injury, reasonable probability of success)"}\nFacts: ${facts || caseData.facts}\nIrreparable Harm: ${caseData.tro_harm || "(not specified)"}\nNotice given to opposing party: ${caseData.tro_notice || "No (ex parte)"}`;
    } else if (action === "oppose") {
      sys = buildOpposingPrompt(caseData.respondent, caseData.court);
      msg = `Oppose this TRO application:\nRelief Sought: ${caseData.tro_relief}\nFacts stated: ${facts}`;
    } else if (action === "checklist") {
      sys = `You are a procedural compliance expert for California courts and federal N.D. Cal. courts.`;
      msg = `Generate a TRO filing checklist for ${caseData.court || "California Superior Court"}. Include: required forms (FL-300, FL-305, FL-303 for family; or Civil coversheet + complaint for federal), service requirements, notice requirements, bond/undertaking, declaration requirements, and order to show cause scheduling. Cite CCP § 527 or FRCP 65 as applicable. Format as numbered checklist.`;
    }
    const resp = await callAI(sys, msg);
    setAiResp(resp);
    update("emergency_facts", facts);
    setLoading(false);
  }

  return (
    <div>
      <div style={css.h2}>🚨 EMERGENCY RELIEF MODULE</div>
      <div style={css.card}>
        <div style={css.h3}>Applicable Authority</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          {["CCP § 527", "FRCP 65", "Fam. Code § 6320", "Fam. Code § 3064", "Fam. Code § 6380", "CRC 5.151"].map(a => (
            <span key={a} style={css.badge(S.gold)}>{a}</span>
          ))}
        </div>
        <div style={{ fontSize: 12, color: S.textDim, lineHeight: 1.6 }}>
          {isFederal
            ? "Federal Standard (FRCP 65): (1) Likelihood of success on merits; (2) Likelihood of irreparable harm; (3) Balance of hardships; (4) Public interest — Winter v. Nat. Res. Def. Council, 555 U.S. 7 (2008)"
            : "California Standard (CCP § 527(a)): Plaintiff must show (1) great or irreparable injury will result before matter can be heard; (2) reasonable probability of prevailing on merits — Butt v. State of California (1992) 4 Cal.4th 668"}
        </div>
      </div>
      <div style={css.card}>
        <div style={css.h3}>Application Details</div>
        <div style={css.grid2}>
          <Field label="Relief Requested">
            <textarea style={{ ...css.textarea, minHeight: 70 }} value={caseData.tro_relief || ""} onChange={e => update("tro_relief", e.target.value)} placeholder="Immediate return of minor child; prohibition on removing child from county..." />
          </Field>
          <Field label="Irreparable Harm">
            <textarea style={{ ...css.textarea, minHeight: 70 }} value={caseData.tro_harm || ""} onChange={e => update("tro_harm", e.target.value)} placeholder="Ongoing deprivation of custody rights, child alienation, imminent removal..." />
          </Field>
        </div>
        <Field label="Supporting Facts Declaration">
          <textarea style={{ ...css.textarea, minHeight: 120 }} value={facts} onChange={e => setFacts(e.target.value)} placeholder="Sworn factual basis for emergency relief — be specific, chronological, cite prior orders..." />
        </Field>
        <div style={css.grid2}>
          <Field label="Notice to Opposing Party">
            <select style={css.select} value={caseData.tro_notice || ""} onChange={e => update("tro_notice", e.target.value)}>
              <option value="">-- Select --</option>
              <option>No notice (ex parte – justify why)</option>
              <option>24-hour notice given</option>
              <option>48-hour notice given</option>
              <option>Full notice per CRC 3.1200</option>
            </select>
          </Field>
          <Field label="OSC Hearing Requested">
            <select style={css.select} value={caseData.tro_osc || ""} onChange={e => update("tro_osc", e.target.value)}>
              <option value="">-- Select --</option>
              <option>Yes – schedule OSC re preliminary injunction</option>
              <option>Yes – schedule OSC re contempt</option>
              <option>No OSC needed</option>
            </select>
          </Field>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={css.btn("primary")} onClick={() => runAction("judge")} disabled={loading}>Judicial Ruling</button>
          <button style={css.btn("secondary")} onClick={() => runAction("oppose")} disabled={loading}>Opposing Argument</button>
          <button style={css.btn("secondary")} onClick={() => runAction("checklist")} disabled={loading}>Filing Checklist</button>
        </div>
        <AIPanel label="SIMULATION OUTPUT" response={aiResp} loading={loading} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE: UCCJEA
// ════════════════════════════════════════════════════════════════════════════

function PhaseUCCJEA({ caseData, update }) {
  const [aiResp, setAiResp] = useState("");
  const [loading, setLoading] = useState(false);

  async function analyzeJurisdiction(mode) {
    setLoading(true);
    const sys = `You are a California family law expert specializing in UCCJEA jurisdictional analysis. 
Apply Fam. Code §§ 3421-3430. The UCCJEA gives exclusive continuing jurisdiction to the state that made the initial child custody determination, as long as the child or a parent remains in that state. 
Analyze the jurisdiction facts provided and issue a definitive analysis: which court has jurisdiction, whether any orders from competing courts are void, and what filings are required to assert/defend jurisdiction.
Be specific. Cite Fam. Code sections. Max 300 words.`;
    const userMsg = `UCCJEA JURISDICTIONAL ANALYSIS:
Home State at Filing: ${caseData.uccjea_homestate || "California (2007-present)"}
Originating Court & Order: ${caseData.uccjea_origin || "Alameda County – RF09456481 – 07/02/2009 sole custody to Petitioner"}
Competing Court: ${caseData.uccjea_competing || "Marin County – 08/19/2025 void TRO"}
Basis for Competing Filing: ${caseData.uccjea_competing_basis || "Christina filed DV in wrong venue after Alameda transferred to Solano 06/25/25"}
Petitioner's State: ${caseData.uccjea_pet_state || "California – Solano County"}
Respondent's State: ${caseData.uccjea_resp_state || "California – Marin County"}
Child's State: ${caseData.uccjea_child_state || "Unknown – believed in Marin County"}
Prior Transfer Orders: ${caseData.uccjea_transfers || "Judge Sato 06/25/25 transfer to Solano; Solano rejected (filing error)"}
Mode: ${mode}`;
    const resp = await callAI(sys, userMsg);
    setAiResp(resp);
    setLoading(false);
  }

  return (
    <div>
      <div style={css.h2}>⚖ UCCJEA JURISDICTIONAL ANALYSIS</div>
      <div style={css.card}>
        <div style={css.h3}>Governing Authority</div>
        {["Fam. Code § 3421 (Initial Jurisdiction)", "Fam. Code § 3422 (Exclusive Continuing Jurisdiction)", "Fam. Code § 3423 (Modification Jurisdiction)", "Fam. Code § 3426 (Simultaneous Proceedings)", "Fam. Code § 3427 (Inconvenient Forum)", "Fam. Code § 3428 (Jurisdiction Declined)"].map(s => (
          <span key={s} style={{ ...css.badge(S.gold), marginRight: 6, marginBottom: 5, display: "inline-block" }}>{s}</span>
        ))}
      </div>
      <div style={css.card}>
        <div style={css.h3}>Jurisdictional Inputs</div>
        <div style={css.grid2}>
          <Field label="Home State at Time of First Filing">
            <input style={css.input} value={caseData.uccjea_homestate || ""} onChange={e => update("uccjea_homestate", e.target.value)} placeholder="California (lived here 6+ months before filing)" />
          </Field>
          <Field label="Originating Court & Custody Order">
            <input style={css.input} value={caseData.uccjea_origin || ""} onChange={e => update("uccjea_origin", e.target.value)} placeholder="Alameda – RF09456481 – 07/02/2009" />
          </Field>
          <Field label="Competing Court & Basis">
            <input style={css.input} value={caseData.uccjea_competing || ""} onChange={e => update("uccjea_competing", e.target.value)} placeholder="Marin – 08/19/2025 – DV filing in wrong venue" />
          </Field>
          <Field label="Transfer Orders">
            <input style={css.input} value={caseData.uccjea_transfers || ""} onChange={e => update("uccjea_transfers", e.target.value)} placeholder="Sato 06/25/25 → Solano; Solano rejected" />
          </Field>
          <Field label="Current Location – Petitioner">
            <input style={css.input} value={caseData.uccjea_pet_state || ""} onChange={e => update("uccjea_pet_state", e.target.value)} placeholder="Benicia, Solano County, CA" />
          </Field>
          <Field label="Current Location – Child">
            <input style={css.input} value={caseData.uccjea_child_state || ""} onChange={e => update("uccjea_child_state", e.target.value)} placeholder="Believed Marin County" />
          </Field>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
          <button style={css.btn("primary")} onClick={() => analyzeJurisdiction("Full UCCJEA Analysis")} disabled={loading}>Analyze Jurisdiction</button>
          <button style={css.btn("secondary")} onClick={() => analyzeJurisdiction("Whether competing court orders are void")} disabled={loading}>Void Order Analysis</button>
          <button style={css.btn("secondary")} onClick={() => analyzeJurisdiction("Draft UCCJEA Declaration FL-105 talking points")} disabled={loading}>FL-105 Talking Points</button>
        </div>
        <AIPanel label="UCCJEA ANALYSIS" response={aiResp} loading={loading} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE: DISCOVERY
// ════════════════════════════════════════════════════════════════════════════

function PhaseDiscovery({ caseData, update }) {
  const [selectedType, setSelectedType] = useState("rog");
  const [aiResp, setAiResp] = useState("");
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState(caseData.respondent || "");
  const [customRequest, setCustomRequest] = useState("");

  const isFed = COURTS[caseData.court]?.type === "federal";
  const disc = DISCOVERY_TYPES.find(d => d.id === selectedType);

  async function generateDiscovery(action) {
    setLoading(true);
    const sys = `You are a California civil litigator generating discovery requests. Use ${isFed ? "Federal Rules of Civil Procedure" : "California Code of Civil Procedure"} format. Number requests sequentially. Include instructions and definitions sections. Tailor requests to the case facts.`;
    const msg = action === "draft"
      ? `Draft ${disc?.label} to ${target} for:\nCase: ${caseData.title}\nClaims: ${(caseData.claims || []).map(id => CLAIMS.find(c => c.id === id)?.label).join(", ")}\nFacts: ${caseData.facts}\nSpecific areas: ${customRequest || "All relevant to claims"}\nAuthority: ${disc?.authority}`
      : `Generate a meet and confer letter demanding compliance with ${disc?.label}. Party: ${target}. Court: ${caseData.court}. Deadline: 30 days. Include motion to compel warning citing ${disc?.authority}.`;
    const resp = await callAI(sys, msg);
    setAiResp(resp);
    setLoading(false);
  }

  return (
    <div>
      <div style={css.h2}>🔍 DISCOVERY</div>
      <div style={css.card}>
        <div style={css.h3}>Discovery Type</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {DISCOVERY_TYPES.map(d => (
            <button key={d.id} onClick={() => setSelectedType(d.id)} style={{ ...css.btn(selectedType === d.id ? "primary" : "secondary"), padding: "6px 12px", fontSize: 12 }}>{d.label}</button>
          ))}
        </div>
        {disc && (
          <div style={{ ...css.code, marginBottom: 14 }}>
            <span style={{ color: S.gold }}>Authority:</span> {disc.authority}{"\n"}
            <span style={{ color: S.gold }}>Limit:</span> {disc.limit}
          </div>
        )}
        <div style={css.grid2}>
          <Field label="Directed To">
            <input style={css.input} value={target} onChange={e => setTarget(e.target.value)} placeholder="Respondent / Third Party" />
          </Field>
          <Field label="Subject Area Focus">
            <input style={css.input} value={customRequest} onChange={e => setCustomRequest(e.target.value)} placeholder="Custody, financial, communications, CPS reports..." />
          </Field>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={css.btn("primary")} onClick={() => generateDiscovery("draft")} disabled={loading}>Generate Requests</button>
          <button style={css.btn("secondary")} onClick={() => generateDiscovery("meet")} disabled={loading}>Meet & Confer Letter</button>
        </div>
        <AIPanel label="DISCOVERY DRAFT" response={aiResp} loading={loading} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE: MOTIONS
// ════════════════════════════════════════════════════════════════════════════

function PhaseMotions({ caseData, update }) {
  const [selectedMotion, setSelectedMotion] = useState("tro");
  const [aiResp, setAiResp] = useState("");
  const [loading, setLoading] = useState(false);
  const [motionFacts, setMotionFacts] = useState("");
  const [role, setRole] = useState("judge");

  const mot = MOTION_TYPES.find(m => m.id === selectedMotion);

  async function runMotion() {
    setLoading(true);
    let sys, msg;
    if (role === "judge") {
      sys = buildJudgePrompt(caseData.court || "Alameda Superior Court", caseData);
      msg = `MOTION TYPE: ${mot?.label}\nAuthority: ${mot?.authority}\nMoving Party: ${caseData.petitioner}\nRelief Sought: ${motionFacts}\nRelevant Facts: ${caseData.facts}\nClaims: ${(caseData.claims||[]).map(id=>CLAIMS.find(c=>c.id===id)?.label).join(", ")}`;
    } else if (role === "oppose") {
      sys = buildOpposingPrompt(caseData.respondent, caseData.court);
      msg = `Oppose: ${mot?.label}\nMoving party argues: ${motionFacts}\nCase facts context: ${caseData.facts}`;
    } else {
      sys = `You are a legal motion drafting expert. Draft a ${mot?.label} for California ${COURTS[caseData.court]?.type === "federal" ? "federal" : "superior"} court. Include: notice of motion, memorandum of points and authorities, and proposed order. Cite ${mot?.authority}.`;
      msg = `Draft ${mot?.label}:\nCase: ${caseData.title}\nCourt: ${caseData.court}\nMoving Party: ${caseData.petitioner}\nRelief Sought: ${motionFacts}\nFacts: ${caseData.facts}`;
    }
    const resp = await callAI(sys, msg);
    setAiResp(resp);
    setLoading(false);
  }

  return (
    <div>
      <div style={css.h2}>📋 MOTIONS</div>
      <div style={css.card}>
        <div style={css.h3}>Select Motion</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {MOTION_TYPES.map(m => (
            <button key={m.id} onClick={() => setSelectedMotion(m.id)}
              style={{ ...css.btn(selectedMotion === m.id ? "primary" : "secondary"), padding: "5px 11px", fontSize: 11 }}>
              {m.label}
            </button>
          ))}
        </div>
        {mot && <div style={{ ...css.badge(S.gold), marginBottom: 14, fontSize: 12 }}>{mot.authority}</div>}
        <Field label="Relief / Argument">
          <textarea style={{ ...css.textarea, minHeight: 100 }} value={motionFacts} onChange={e => setMotionFacts(e.target.value)} placeholder="State the specific relief requested and key arguments..." />
        </Field>
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          {[{ v: "judge", label: "Judicial Ruling" }, { v: "oppose", label: "Opposition" }, { v: "draft", label: "Draft Motion" }].map(r => (
            <button key={r.v} onClick={() => setRole(r.v)} style={{ ...css.btn(role === r.v ? "primary" : "secondary"), padding: "6px 14px" }}>{r.label}</button>
          ))}
        </div>
        <button style={css.btn("primary")} onClick={runMotion} disabled={loading}>
          {loading ? "Processing..." : `Run – ${role === "judge" ? "Get Ruling" : role === "oppose" ? "Get Opposition" : "Draft Motion"}`}
        </button>
        <AIPanel label={role === "judge" ? "JUDICIAL RULING" : role === "oppose" ? "OPPOSITION ARGUMENT" : "MOTION DRAFT"} response={aiResp} loading={loading} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE: CONTEMPT / OSC
// ════════════════════════════════════════════════════════════════════════════

function PhaseContempt({ caseData, update }) {
  const [aiResp, setAiResp] = useState("");
  const [loading, setLoading] = useState(false);
  const [violations, setViolations] = useState(caseData.contempt_violations || "");
  const [orderViolated, setOrderViolated] = useState(caseData.contempt_order || "");

  async function runContempt(action) {
    setLoading(true);
    const sys = action === "judge"
      ? buildJudgePrompt(caseData.court || "Alameda Superior Court", caseData)
      : action === "oppose"
      ? buildOpposingPrompt(caseData.respondent, caseData.court)
      : `You are a California family law expert. Draft an OSC re Contempt (FL-410 packet) and points & authorities for contempt under Fam. Code § 290 and CCP § 1209-1211. Include: order violated, acts constituting contempt, wilfulness, proposed sanctions. Cite authority. Format as legal document.`;

    const msg = `CONTEMPT PROCEEDING:
Order Violated: ${orderViolated}
Violations Alleged: ${violations}
Violating Party: ${caseData.respondent}
Prior Orders: ${caseData.uccjea_origin || "Alameda 07/02/2009 sole custody"}
Statutory Basis: Fam. Code § 290; CCP § 1209; CCP § 1211
${action === "judge" ? "Rule on this OSC re Contempt. Address willfulness, purge conditions, and sanctions." : ""}
${action === "oppose" ? "Argue against contempt finding. Challenge willfulness element." : ""}`;

    const resp = await callAI(sys, msg);
    setAiResp(resp);
    update("contempt_violations", violations);
    update("contempt_order", orderViolated);
    setLoading(false);
  }

  return (
    <div>
      <div style={css.h2}>⛓ CONTEMPT / OSC MODULE</div>
      <div style={css.card}>
        <div style={css.h3}>Statutory Authority</div>
        {["Fam. Code § 290", "CCP § 1209", "CCP § 1211", "CCP § 1218", "FL-410 (OSC form)", "FL-411 (Factual Declaration)"].map(a => (
          <span key={a} style={{ ...css.badge(S.gold), marginRight: 6, marginBottom: 5, display: "inline-block" }}>{a}</span>
        ))}
        <div style={{ fontSize: 12, color: S.textDim, lineHeight: 1.6, marginTop: 10 }}>
          <strong style={{ color: S.text }}>Elements of Contempt (Fam. Code § 290):</strong> (1) Valid court order; (2) Knowledge of the order; (3) Ability to comply; (4) Willful failure to comply.
          <br />Penalties: Fine up to $1,000 per count; up to 5 days jail; community service; payment of attorney fees.
        </div>
      </div>
      <div style={css.card}>
        <div style={css.h3}>Contempt Specifications</div>
        <Field label="Order Being Violated (cite date, court, and specific provision)">
          <textarea style={{ ...css.textarea, minHeight: 80 }} value={orderViolated} onChange={e => setOrderViolated(e.target.value)} placeholder="07/02/2009 Alameda County Order RF09456481 — Sole physical and legal custody to Petitioner; Christina ordered to complete psychiatric evaluation..." />
        </Field>
        <Field label="Acts Constituting Contempt (date, act, willfulness)">
          <textarea style={{ ...css.textarea, minHeight: 120 }} value={violations} onChange={e => setViolations(e.target.value)} placeholder="07/09/2025 – Respondent retained minor child Cole Hartmann in Marin County in violation of sole custody order. Respondent had knowledge of order, was present at 2009 hearing, has never complied with psychiatric evaluation in 16+ years..." />
        </Field>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={css.btn("primary")} onClick={() => runContempt("judge")} disabled={loading}>Judicial Ruling</button>
          <button style={css.btn("secondary")} onClick={() => runContempt("oppose")} disabled={loading}>Opposition</button>
          <button style={css.btn("secondary")} onClick={() => runContempt("draft")} disabled={loading}>Draft OSC Packet</button>
        </div>
        <AIPanel label="CONTEMPT OUTPUT" response={aiResp} loading={loading} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE: TRIAL
// ════════════════════════════════════════════════════════════════════════════

function PhaseTrial({ caseData, update }) {
  const [stage, setStage] = useState("opening");
  const [aiResp, setAiResp] = useState("");
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");

  const isFed = COURTS[caseData.court]?.type === "federal";
  const isJury = caseData.trial_jury === "yes";

  const STAGES = [
    { id: "opening", label: "Opening Statement" },
    { id: "direct", label: "Direct Examination" },
    { id: "cross", label: "Cross Examination" },
    { id: "evidence", label: "Evidence Admission" },
    { id: "closing", label: "Closing Argument" },
    { id: "jury_select", label: isJury ? "Jury Selection" : "Bench Trial Statement" },
  ];

  async function runTrialAction() {
    setLoading(true);
    const sys = stage === "jury_select"
      ? `You are a jury consultant. Analyze juror responses for bias in a ${(caseData.claims||[]).map(id=>CLAIMS.find(c=>c.id===id)?.label).join("/")} case. Identify challenges for cause and peremptory challenges. Be specific.`
      : stage === "evidence"
      ? `You are a ${caseData.court} judge ruling on evidence objections. Apply California Evidence Code (or FRE if federal). Rule on admissibility with citation.`
      : buildJudgePrompt(caseData.court || "Alameda Superior Court", caseData);

    const msg = `TRIAL STAGE: ${stage.toUpperCase()}
Case: ${caseData.title}
Claims: ${(caseData.claims||[]).map(id=>CLAIMS.find(c=>c.id===id)?.label).join(", ")}
${stage} content / question: ${input}
Facts: ${caseData.facts}`;

    const resp = await callAI(sys, msg);
    setAiResp(resp);
    setLoading(false);
  }

  return (
    <div>
      <div style={css.h2}>🏛 TRIAL</div>
      <div style={css.card}>
        <div style={css.h3}>Trial Type</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <button style={css.btn(caseData.trial_jury === "yes" ? "primary" : "secondary")} onClick={() => update("trial_jury", "yes")}>Jury Trial</button>
          <button style={css.btn(caseData.trial_jury !== "yes" ? "primary" : "secondary")} onClick={() => update("trial_jury", "no")}>Bench Trial</button>
        </div>
        <div style={css.h3}>Trial Stage</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {STAGES.map(s => (
            <button key={s.id} onClick={() => setStage(s.id)} style={{ ...css.btn(stage === s.id ? "primary" : "secondary"), padding: "6px 12px", fontSize: 12 }}>{s.label}</button>
          ))}
        </div>
        <Field label={`${STAGES.find(s => s.id === stage)?.label} — Input`}>
          <textarea style={{ ...css.textarea, minHeight: 120 }} value={input} onChange={e => setInput(e.target.value)}
            placeholder={stage === "opening" ? "Draft your opening statement or ask for help drafting it..."
              : stage === "cross" ? "Witness statement to challenge, or question to ask..."
              : stage === "evidence" ? "Describe the evidence and any objection to rule on..."
              : stage === "jury_select" ? "Juror background / statement to analyze for bias..."
              : "Enter argument, question, or statement for AI analysis..."} />
        </Field>
        <button style={css.btn("primary")} onClick={runTrialAction} disabled={loading}>
          {loading ? "Processing..." : "Run Trial Simulation"}
        </button>
        <AIPanel label={`TRIAL – ${stage.toUpperCase()}`} response={aiResp} loading={loading} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE: VERDICT & DAMAGES
// ════════════════════════════════════════════════════════════════════════════

function PhaseVerdict({ caseData, update }) {
  const [aiResp, setAiResp] = useState("");
  const [loading, setLoading] = useState(false);

  const damages = {
    economic: parseFloat(caseData.dmg_economic || 0),
    emotional: parseFloat(caseData.dmg_emotional || 0),
    punitive: parseFloat(caseData.dmg_punitive || 0),
    attyFees: parseFloat(caseData.dmg_atty || 0),
    treble: caseData.dmg_treble === "yes",
    injunctive: caseData.dmg_injunctive || "",
  };
  const subtotal = damages.economic + damages.emotional + damages.punitive + damages.attyFees;
  const total = damages.treble ? damages.economic * 3 + damages.emotional + damages.punitive + damages.attyFees : subtotal;

  async function analyzeVerdict() {
    setLoading(true);
    const sys = `You are a California civil litigation expert analyzing verdict and damages. Apply California CACI damages instructions and/or federal damages standards. Evaluate reasonableness of damages, likelihood of collection, and post-judgment remedies.`;
    const msg = `VERDICT ANALYSIS:
Case: ${caseData.title} | Court: ${caseData.court}
Claims: ${(caseData.claims||[]).map(id=>CLAIMS.find(c=>c.id===id)?.label).join(", ")}
Economic Damages: $${damages.economic.toLocaleString()}
Emotional Distress: $${damages.emotional.toLocaleString()}
Punitive Damages: $${damages.punitive.toLocaleString()}
Attorney Fees: $${damages.attyFees.toLocaleString()}
Treble (RICO): ${damages.treble ? "Yes – triple economic damages" : "No"}
Total Requested: $${total.toLocaleString()}
Injunctive Relief: ${damages.injunctive}
Evaluate: damages reasonableness, jury verdict likelihood, collection prospects, and post-judgment enforcement options.`;
    const resp = await callAI(sys, msg);
    setAiResp(resp);
    setLoading(false);
  }

  return (
    <div>
      <div style={css.h2}>💰 VERDICT & DAMAGES CALCULATOR</div>
      <div style={css.card}>
        <div style={css.h3}>Damages Components</div>
        <div style={css.grid2}>
          <Field label="Economic Damages ($)">
            <input type="number" style={css.input} value={caseData.dmg_economic || ""} onChange={e => update("dmg_economic", e.target.value)} placeholder="0" />
          </Field>
          <Field label="Emotional Distress ($)">
            <input type="number" style={css.input} value={caseData.dmg_emotional || ""} onChange={e => update("dmg_emotional", e.target.value)} placeholder="0" />
          </Field>
          <Field label="Punitive Damages ($)">
            <input type="number" style={css.input} value={caseData.dmg_punitive || ""} onChange={e => update("dmg_punitive", e.target.value)} placeholder="0" />
          </Field>
          <Field label="Attorney Fees ($)">
            <input type="number" style={css.input} value={caseData.dmg_atty || ""} onChange={e => update("dmg_atty", e.target.value)} placeholder="0" />
          </Field>
        </div>
        <div style={css.grid2}>
          <Field label="RICO Treble Damages?">
            <select style={css.select} value={caseData.dmg_treble || "no"} onChange={e => update("dmg_treble", e.target.value)}>
              <option value="no">No</option>
              <option value="yes">Yes — 18 U.S.C. § 1964(c) (triple economic)</option>
            </select>
          </Field>
          <Field label="Injunctive Relief Sought">
            <input style={css.input} value={caseData.dmg_injunctive || ""} onChange={e => update("dmg_injunctive", e.target.value)} placeholder="Return of child; void Marin orders; enforcement of custody..." />
          </Field>
        </div>
        <div style={{ ...css.card, background: S.accent, border: `1px solid ${S.gold}33`, marginTop: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: S.textDim, fontFamily: "monospace", fontSize: 13 }}>Economic Damages</span>
            <span style={{ fontFamily: "monospace" }}>${damages.economic.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: S.textDim, fontFamily: "monospace", fontSize: 13 }}>Emotional Distress</span>
            <span style={{ fontFamily: "monospace" }}>${damages.emotional.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: S.textDim, fontFamily: "monospace", fontSize: 13 }}>Punitive Damages</span>
            <span style={{ fontFamily: "monospace" }}>${damages.punitive.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: S.textDim, fontFamily: "monospace", fontSize: 13 }}>Attorney Fees</span>
            <span style={{ fontFamily: "monospace" }}>${damages.attyFees.toLocaleString()}</span>
          </div>
          {damages.treble && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: S.gold }}>
              <span style={{ fontFamily: "monospace", fontSize: 13 }}>RICO Treble Multiplier (×3 on economic)</span>
              <span style={{ fontFamily: "monospace" }}>+${(damages.economic * 2).toLocaleString()}</span>
            </div>
          )}
          <div style={{ borderTop: `1px solid ${S.gold}44`, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "monospace", color: S.gold, fontWeight: 700 }}>TOTAL</span>
            <span style={{ fontFamily: "monospace", color: S.gold, fontWeight: 700, fontSize: 18 }}>${total.toLocaleString()}</span>
          </div>
        </div>
        <button style={{ ...css.btn("primary"), marginTop: 12 }} onClick={analyzeVerdict} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze Damages"}
        </button>
        <AIPanel label="DAMAGES ANALYSIS" response={aiResp} loading={loading} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE: APPEAL
// ════════════════════════════════════════════════════════════════════════════

function PhaseAppeal({ caseData, update }) {
  const [selectedGround, setSelectedGround] = useState([]);
  const [aiResp, setAiResp] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderAppealed, setOrderAppealed] = useState(caseData.appeal_order || "");

  const isFed = COURTS[caseData.court]?.type === "federal";
  const deadlines = {
    state: { notice: "60 days from entry of judgment (CRC 8.104)", record: "10 days after filing (CRC 8.121)", brief: "70 days after record certified (CRC 8.212)" },
    federal: { notice: "30 days from judgment (FRAP 4(a)(1)(A))", record: "14 days after filing (FRAP 10)", brief: "40 days after record filed (FRAP 31)" },
  };
  const d = isFed ? deadlines.federal : deadlines.state;

  async function runAppealAnalysis(action) {
    setLoading(true);
    const grounds = selectedGround.map(id => APPEAL_GROUNDS.find(g => g.id === id));
    const sys = action === "brief"
      ? `You are an appellate attorney drafting an opening brief. Apply California Rules of Court 8.200 series or FRAP 28. Structure: Statement of Appealability, Standard of Review, Statement of Facts, Argument (headings and subheadings per CRC 8.204), Conclusion. Cite authority precisely.`
      : `You are an appellate judge analyzing appeal viability. Apply the correct standard of review for each ground. Assess likelihood of reversal. Be direct.`;
    const msg = `APPEAL:
Order/Judgment Appealed: ${orderAppealed}
Court Below: ${caseData.court}
Appellate Court: ${isFed ? "9th Circuit" : "California Court of Appeal, 1st District"}
Grounds: ${grounds.map(g => `${g?.label} (Standard: ${g?.standard})`).join("; ")}
Case Facts: ${caseData.facts}
Claims at Trial: ${(caseData.claims||[]).map(id=>CLAIMS.find(c=>c.id===id)?.label).join(", ")}`;
    const resp = await callAI(sys, msg);
    setAiResp(resp);
    update("appeal_order", orderAppealed);
    setLoading(false);
  }

  return (
    <div>
      <div style={css.h2}>📜 APPEAL</div>
      <div style={css.card}>
        <div style={css.h3}>Deadlines</div>
        <div style={css.code}>
          Notice of Appeal:  {d.notice}{"\n"}Record Designation: {d.record}{"\n"}Opening Brief:     {d.brief}
        </div>
      </div>
      <div style={css.card}>
        <div style={css.h3}>Order / Judgment Appealed</div>
        <Field>
          <textarea style={{ ...css.textarea, minHeight: 80 }} value={orderAppealed} onChange={e => setOrderAppealed(e.target.value)} placeholder="08/19/2025 Marin County Order — Fullerton — Sole custody to Christina, no visitation to Petitioner — VOID for lack of UCCJEA jurisdiction..." />
        </Field>
        <div style={css.h3}>Grounds for Appeal</div>
        {APPEAL_GROUNDS.map(g => {
          const active = selectedGround.includes(g.id);
          return (
            <div key={g.id} onClick={() => setSelectedGround(active ? selectedGround.filter(x => x !== g.id) : [...selectedGround, g.id])}
              style={{ ...css.card, padding: "10px 14px", marginBottom: 8, cursor: "pointer", borderColor: active ? S.gold : S.border, background: active ? S.accent : S.panel }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: active ? S.gold : S.text, fontSize: 13, fontWeight: active ? 700 : 400 }}>{g.label}</span>
                {active && <span style={css.badge(S.gold)}>SELECTED</span>}
              </div>
              <div style={{ fontSize: 11, color: S.textDim, marginTop: 4 }}>{g.standard}</div>
            </div>
          );
        })}
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button style={css.btn("primary")} onClick={() => runAppealAnalysis("analyze")} disabled={loading || !selectedGround.length}>Analyze Viability</button>
          <button style={css.btn("secondary")} onClick={() => runAppealAnalysis("brief")} disabled={loading || !selectedGround.length}>Draft Brief Points</button>
        </div>
        <AIPanel label="APPEAL ANALYSIS" response={aiResp} loading={loading} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CASE STATUS BAR
// ════════════════════════════════════════════════════════════════════════════

function CaseBar({ caseData, onClear }) {
  if (!caseData.title && !caseData.caseNumber) return null;
  return (
    <div style={{ background: S.accent, borderBottom: `1px solid ${S.border}`, padding: "8px 24px", display: "flex", alignItems: "center", gap: 16, fontSize: 12, fontFamily: "monospace" }}>
      <span style={{ color: S.gold }}>{caseData.title || "Untitled"}</span>
      {caseData.caseNumber && <span style={{ color: S.textDim }}>#{caseData.caseNumber}</span>}
      {caseData.court && <span style={{ color: S.textDim }}>{caseData.court}</span>}
      {(caseData.claims || []).length > 0 && <span style={{ color: S.textFaint }}>{caseData.claims.length} claim(s)</span>}
      <span style={{ marginLeft: "auto", color: S.green }}>● AUTO-SAVED</span>
      <button onClick={onClear} style={{ ...css.btn("danger"), padding: "3px 10px", fontSize: 11 }}>Clear Case</button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [phase, setPhase] = useState("setup");
  const [caseData, setCaseData] = useState({});
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    loadCase().then(c => { if (c) setCaseData(c); });
  }, []);

  const update = useCallback((key, val) => {
    setCaseData(prev => {
      const next = { ...prev, [key]: val };
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveCase(next), 1200);
      return next;
    });
  }, []);

  async function clearCaseData() {
    if (confirm("Clear all case data? This cannot be undone.")) {
      await clearCase();
      setCaseData({});
    }
  }

  const renderPhase = () => {
    const props = { caseData, update };
    switch (phase) {
      case "setup": return <PhaseSetup {...props} />;
      case "pleadings": return <PhasePleadings {...props} />;
      case "emergency": return <PhaseEmergency {...props} />;
      case "uccjea": return <PhaseUCCJEA {...props} />;
      case "discovery": return <PhaseDiscovery {...props} />;
      case "motions": return <PhaseMotions {...props} />;
      case "contempt": return <PhaseContempt {...props} />;
      case "trial": return <PhaseTrial {...props} />;
      case "verdict": return <PhaseVerdict {...props} />;
      case "appeal": return <PhaseAppeal {...props} />;
      default: return null;
    }
  };

  return (
    <div style={css.app}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; background: ${S.bg}; }
        ::-webkit-scrollbar-thumb { background: ${S.border}; border-radius: 3px; }
        button:hover { opacity: 0.85; }
        input:focus, textarea:focus, select:focus { border-color: ${S.gold}88 !important; outline: none; }
      `}</style>

      <div style={css.header}>
        <div style={css.logo}>VERNEN™ CIVIL SUIT SIMULATOR</div>
        <div style={{ fontSize: 11, color: S.textFaint, fontFamily: "monospace", textAlign: "right" }}>
          {caseData.court && <span>⚖ {caseData.court}</span>}
          {" · "}
          <span style={{ color: S.textDim }}>AI-Powered Legal Simulation · Pro Se Edition</span>
        </div>
      </div>

      <CaseBar caseData={caseData} onClear={clearCaseData} />

      <div style={css.layout}>
        <div style={css.sidebar}>
          {PHASES.map(p => (
            <div key={p.id} onClick={() => setPhase(p.id)} style={css.sideItem(phase === p.id)}>
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${S.border}` }}>
            <div style={{ fontSize: 10, color: S.textFaint, fontFamily: "monospace", lineHeight: 1.6 }}>
              © 2026 VERNEN™{"\n"}Michael V.T. Hartmann{"\n"}All Rights Reserved
            </div>
          </div>
        </div>
        <div style={css.content}>
          {renderPhase()}
        </div>
      </div>
    </div>
  );
}
