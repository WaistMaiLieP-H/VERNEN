import { useState, useEffect, useCallback, useRef } from "react";

const API_MODEL = "claude-sonnet-4-20250514";

// ─── STATIC DATA ──────────────────────────────────────────────────────────────
const CAUSES_OF_ACTION = [
  { id: "custody_violation", label: "Custody Order Violation", cat: "Family Law", auth: "Fam. Code § 3027, § 290", jcForms: ["FL-300","FL-341"] },
  { id: "uccjea", label: "UCCJEA Jurisdictional Violation", cat: "Family Law", auth: "Fam. Code §§ 3400–3465", jcForms: ["FL-105","FL-200"] },
  { id: "dvro_abuse", label: "DVRO Abuse / False Allegations", cat: "Family Law", auth: "Fam. Code § 6380; CCP § 128.7", jcForms: ["DV-100","DV-105"] },
  { id: "contempt", label: "Contempt of Court Order", cat: "Family Law", auth: "Fam. Code § 290; CCP § 1209", jcForms: ["FL-410","FL-418"] },
  { id: "civil_rights_1983", label: "42 U.S.C. § 1983 — Civil Rights", cat: "Federal Civil Rights", auth: "42 U.S.C. § 1983", jcForms: ["Pro Se Complaint (USDC)"] },
  { id: "due_process", label: "Substantive Due Process — Parental Rights", cat: "Federal Civil Rights", auth: "14th Amend.; Troxel v. Granville (2000)", jcForms: ["Pro Se Complaint (USDC)"] },
  { id: "conspiracy_1985", label: "42 U.S.C. § 1985 — Conspiracy", cat: "Federal Civil Rights", auth: "42 U.S.C. § 1985(3)", jcForms: ["Pro Se Complaint (USDC)"] },
  { id: "rico", label: "RICO — Pattern of Racketeering", cat: "Federal Civil Rights", auth: "18 U.S.C. §§ 1961–1968", jcForms: ["RICO Case Statement (USDC)"] },
  { id: "fraud", label: "Fraud & Misrepresentation", cat: "General Civil", auth: "Civ. Code § 1709; CACI 1900", jcForms: ["CM-010","PLD-C-001"] },
  { id: "malicious_prosecution", label: "Malicious Prosecution", cat: "General Civil", auth: "Civ. Code § 47.5; CACI 1500", jcForms: ["CM-010"] },
  { id: "elder_abuse", label: "Elder/Dependent Adult Abuse", cat: "General Civil", auth: "WIC § 15610 et seq.", jcForms: ["CM-010"] },
  { id: "insurance_bad_faith", label: "Insurance Bad Faith", cat: "General Civil", auth: "Ins. Code § 790.03; Brandt v. Superior Court", jcForms: ["CM-010"] },
];

const MOTIONS = [
  { id: "tro", label: "TRO / Preliminary Injunction", auth: "CCP § 527 / FRCP 65" },
  { id: "osc", label: "OSC re: Contempt", auth: "Fam. Code § 290; CCP § 1209" },
  { id: "osc_custody", label: "OSC re: Custody Modification", auth: "Fam. Code § 3087" },
  { id: "motion_quash", label: "Motion to Quash / Transfer", auth: "CCP § 418.10; Fam. Code § 3427" },
  { id: "motion_sanctions", label: "Motion for Sanctions", auth: "CCP § 128.7; Fam. Code § 271" },
  { id: "motion_reconsideration", label: "Motion for Reconsideration", auth: "CCP § 1008" },
  { id: "motion_compel", label: "Motion to Compel Discovery", auth: "CCP §§ 2030.300, 2031.310" },
  { id: "msj", label: "Motion for Summary Judgment", auth: "CCP § 437c; FRCP 56" },
  { id: "motion_strike", label: "Motion to Strike", auth: "CCP § 435" },
  { id: "attorney_fees", label: "Motion for Attorney Fees", auth: "42 U.S.C. § 1988; CCP § 1021.5" },
  { id: "motion_default", label: "Motion for Default Judgment", auth: "CCP § 585" },
  { id: "motion_new_trial", label: "Motion for New Trial", auth: "CCP § 657" },
];

const DISCOVERY_TYPES = [
  { id: "interrogatories", label: "Special Interrogatories", limit: "35 max — CCP § 2030.030" },
  { id: "rfa", label: "Request for Admissions", limit: "CCP § 2033.010" },
  { id: "rpd", label: "Request for Production", limit: "CCP § 2031.010" },
  { id: "deposition", label: "Deposition Notice", limit: "CCP § 2025.010" },
  { id: "subpoena", label: "Subpoena — Business Records", limit: "CCP § 1985.3" },
  { id: "expert", label: "Expert Witness Disclosure", limit: "CCP § 2034.210" },
];

const APPEAL_GROUNDS = [
  "Abuse of Discretion — Findings Not Supported by Substantial Evidence",
  "Error of Law — Incorrect Legal Standard Applied",
  "Jurisdictional Defect — UCCJEA Violation",
  "Due Process Violation — Denial of Right to Be Heard",
  "Judicial Bias / Appearance of Impropriety",
  "Newly Discovered Evidence — CCP § 657(4)",
  "Ineffective Assistance / Conflict of Interest",
];

const PARTY_ROLES = ["Respondent","Co-Respondent","Attorney of Record","Third-Party Defendant","Witness","Agency / Entity","Co-Conspirator"];
const LANGUAGES = ["English","Spanish","French","Portuguese","Mandarin","Cantonese","Vietnamese","Tagalog","Korean","Arabic","Russian","Punjabi","Hindi"];
const PHASES = [
  { id: "setup", label: "Case Setup", icon: "⚖" },
  { id: "parties", label: "Parties", icon: "👤" },
  { id: "timeline", label: "Timeline", icon: "📅" },
  { id: "evidence", label: "Evidence Vault", icon: "🗂" },
  { id: "pleadings", label: "Pleadings", icon: "📋" },
  { id: "emergency", label: "Emergency", icon: "🚨" },
  { id: "uccjea_phase", label: "UCCJEA", icon: "🗺" },
  { id: "discovery", label: "Discovery", icon: "🔍" },
  { id: "motions", label: "Motions", icon: "📜" },
  { id: "contempt_phase", label: "Contempt", icon: "⚡" },
  { id: "sanctions", label: "Sanctions", icon: "⚠" },
  { id: "audit", label: "Audit Mode", icon: "🔬" },
  { id: "trial", label: "Trial", icon: "🏛" },
  { id: "verdict", label: "Verdict", icon: "💰" },
  { id: "appeal", label: "Appeal", icon: "📡" },
];

const JC_FORMS_REF = {
  "FL-300": "Request for Order (Custody/Visitation/Support)",
  "FL-341": "Children's Holiday Schedule Attachment",
  "FL-410": "Order to Show Cause and Affidavit for Contempt",
  "FL-418": "Order After Hearing on Motion re Contempt",
  "FL-105": "Declaration Under UCCJEA",
  "FL-200": "Petition — Marriage/Domestic Partnership",
  "DV-100": "Request for Domestic Violence Restraining Order",
  "DV-105": "Request for Child Custody and Visitation Orders",
  "CM-010": "Civil Case Cover Sheet",
  "PLD-C-001": "Complaint — Contract",
};

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = "vernen_v7_case";
async function saveCase(data) {
  try { await window.storage.set(STORAGE_KEY, JSON.stringify(data)); } catch {}
}
async function loadCase() {
  try { const r = await window.storage.get(STORAGE_KEY); return r ? JSON.parse(r.value) : null; } catch { return null; }
}

// ─── STREAMING API ────────────────────────────────────────────────────────────
async function streamClaude({ system, user, onToken, onDone, onError }) {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: API_MODEL,
        max_tokens: 1000,
        stream: true,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) { onError("API error: " + res.status); return; }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let full = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") continue;
        try {
          const evt = JSON.parse(raw);
          if (evt.type === "content_block_delta" && evt.delta?.text) {
            full += evt.delta.text;
            onToken(full);
          }
        } catch {}
      }
    }
    onDone(full);
  } catch (e) { onError(e.message); }
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
const emptyCase = () => ({
  title: "",
  court: "",
  caseNo: "",
  petitioner: "Michael Vernen Thomas Hartmann",
  venue: "state",
  claims: [],
  facts: "",
  counties: [],
  childName: "Cole",
  custodyOrder: "100% sole custody — Petitioner",
  parties: [],
  timeline: [],
  exhibits: [],
  sharedContext: {},
});

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function VERNENv7() {
  const [phase, setPhase] = useState("setup");
  const [lang, setLang] = useState("English");
  const [caseData, setCaseData] = useState(emptyCase());
  const [aiOut, setAiOut] = useState({});
  const [loading, setLoading] = useState({});
  const [completedKeys, setCompletedKeys] = useState(new Set());
  const [logExpanded, setLogExpanded] = useState(null);
  const [actLog, setActLog] = useState([]);
  const [motionSel, setMotionSel] = useState(null);
  const [discSel, setDiscSel] = useState([]);
  const [appealSel, setAppealSel] = useState([]);
  const [damages, setDamages] = useState({ compensatory: "", punitive: "", rico: false, fees: false });
  const [sanctions271, setSanctions271] = useState({ months: "", income: "", conduct: "" });
  const [sanctions1287, setSanctions1287] = useState({ filings: "", type: "" });
  const [auditDoc, setAuditDoc] = useState("");
  const [auditType, setAuditType] = useState("motion");
  const [printMode, setPrintMode] = useState(false);
  const [statuteLookup, setStatuteLookup] = useState({ query: "", result: "" });
  const [newParty, setNewParty] = useState({ name: "", role: "", notes: "" });
  const [newExhibit, setNewExhibit] = useState({ label: "", description: "", date: "", relevance: "" });
  const [newEvent, setNewEvent] = useState({ date: "", event: "", source: "", significance: "" });
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadCase().then(d => {
      if (d) {
        setCaseData(d.caseData || emptyCase());
        setActLog(d.actLog || []);
        setCompletedKeys(new Set(d.completedKeys || []));
      }
    });
  }, []);

  const saveAll = useCallback((cd, log, ck) => {
    saveCase({ caseData: cd, actLog: log, completedKeys: [...ck] });
  }, []);

  const updateCase = useCallback((field, val) => {
    setCaseData(prev => {
      const updated = { ...prev, [field]: val };
      saveAll(updated, actLog, completedKeys);
      return updated;
    });
  }, [actLog, completedKeys, saveAll]);

  // Build shared context string for cross-phase injection
  const buildContext = useCallback(() => {
    const ctx = caseData.sharedContext || {};
    const parts = [];
    if (ctx.theory) parts.push("CASE THEORY:\n" + ctx.theory.slice(0, 400));
    if (ctx.complaint) parts.push("COMPLAINT SUMMARY:\n" + ctx.complaint.slice(0, 400));
    if (ctx.tro_ca) parts.push("TRO ARGUMENT:\n" + ctx.tro_ca.slice(0, 300));
    if (caseData.timeline?.length) {
      parts.push("KEY TIMELINE:\n" + caseData.timeline.slice(-6).map(e => `${e.date}: ${e.event}`).join("\n"));
    }
    if (caseData.exhibits?.length) {
      parts.push("EXHIBITS:\n" + caseData.exhibits.map(e => `${e.label}: ${e.description}`).join("\n"));
    }
    return parts.length ? "\n\n[PRIOR PHASE CONTEXT]\n" + parts.join("\n\n") : "";
  }, [caseData]);

  const run = useCallback(async (key, system, user) => {
    setLoading(l => ({ ...l, [key]: true }));
    setAiOut(o => ({ ...o, [key]: "" }));
    const contextInjection = buildContext();
    const fullUser = user + contextInjection;
    await streamClaude({
      system: system + `\n\nVenue: ${caseData.venue === "federal" ? "Federal (FRCP/USDC)" : "California State Court (CCP/CRC)"}. Language: ${lang}.`,
      user: fullUser,
      onToken: (text) => setAiOut(o => ({ ...o, [key]: text })),
      onDone: (text) => {
        setCompletedKeys(prev => {
          const next = new Set([...prev, key]);
          const newLog = [{ ts: new Date().toISOString(), phase, key, text }, ...actLog];
          setActLog(newLog);
          updateCase("sharedContext", { ...caseData.sharedContext, [key]: text });
          setLoading(l => ({ ...l, [key]: false }));
          saveAll(caseData, newLog, next);
          return next;
        });
      },
      onError: (err) => {
        setAiOut(o => ({ ...o, [key]: "Error: " + err }));
        setLoading(l => ({ ...l, [key]: false }));
      },
    });
  }, [buildContext, caseData, lang, phase, actLog, updateCase, saveAll]);

  const resetCase = () => {
    const fresh = emptyCase();
    setCaseData(fresh);
    setActLog([]);
    setCompletedKeys(new Set());
    setAiOut({});
    saveAll(fresh, [], new Set());
  };

  const exportTxt = (key) => {
    const text = aiOut[key] || "No content";
    const blob = new Blob([`VERNEN™ Civil Suit Simulator v7\n${caseData.title || "Untitled Case"}\nCase No: ${caseData.caseNo}\nGenerated: ${new Date().toLocaleString()}\n\n${"─".repeat(60)}\n\n${text}`], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `VERNEN_${key}_${Date.now()}.txt`; a.click();
  };

  const exportAll = () => {
    const allText = Object.entries(aiOut).filter(([,v]) => v).map(([k,v]) => `${"═".repeat(60)}\nSECTION: ${k.toUpperCase()}\n${"═".repeat(60)}\n\n${v}`).join("\n\n");
    const blob = new Blob([`VERNEN™ COMPLETE CASE FILE\n${caseData.title || "Untitled"}\nCase: ${caseData.caseNo} | Court: ${caseData.court}\nExported: ${new Date().toLocaleString()}\n\n${allText}`], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `VERNEN_COMPLETE_${Date.now()}.txt`; a.click();
  };

  const selectedClaims = CAUSES_OF_ACTION.filter(c => caseData.claims.includes(c.id));
  const toggleClaim = (id) => updateCase("claims", caseData.claims.includes(id) ? caseData.claims.filter(x => x !== id) : [...caseData.claims, id]);

  const factsBlock = `PETITIONER: ${caseData.petitioner}\nCOURT: ${caseData.court} (${caseData.venue === "federal" ? "Federal" : "State"})\nCASE NO: ${caseData.caseNo}\nCHILD: ${caseData.childName}\nEXISTING ORDER: ${caseData.custodyOrder}\nRESPONDENTS: ${caseData.parties?.map(p => `${p.name} (${p.role})`).join(", ") || "Not specified"}\nCLAIMS: ${selectedClaims.map(c => c.label).join(", ")}\nFACTS: ${caseData.facts}`;

  // ─── PHASE RENDERS ─────────────────────────────────────────────────────────

  const renderSetup = () => (
    <div className="pc">
      <div className="ph-header">
        <h2 className="pt">CASE SETUP</h2>
        <div className="ph-actions">
          <Toggle label="FEDERAL" active={caseData.venue === "federal"} onClick={() => updateCase("venue", caseData.venue === "federal" ? "state" : "federal")} />
          <Btn variant="danger" onClick={resetCase}>↺ RESET CASE</Btn>
          <Btn variant="gold" onClick={exportAll}>⬇ EXPORT ALL</Btn>
        </div>
      </div>
      <div className="grid2">
        <Field label="Case Title" value={caseData.title} onChange={v => updateCase("title", v)} placeholder="In re Hartmann — Custody Enforcement" />
        <Field label="Case Number" value={caseData.caseNo} onChange={v => updateCase("caseNo", v)} placeholder="XX-FL-XXXXXX" />
        <Field label="Court" value={caseData.court} onChange={v => updateCase("court", v)} placeholder={caseData.venue === "federal" ? "N.D. Cal. — Oakland Division" : "Alameda County Superior Court, Family Div."} />
        <Field label="Petitioner" value={caseData.petitioner} onChange={v => updateCase("petitioner", v)} />
        <Field label="Child Name" value={caseData.childName} onChange={v => updateCase("childName", v)} />
        <Field label="Existing Custody Order" value={caseData.custodyOrder} onChange={v => updateCase("custodyOrder", v)} />
      </div>
      <div className="field-full">
        <label className="fl">CASE FACTS SUMMARY</label>
        <textarea className="ta" rows={6} value={caseData.facts} onChange={e => updateCase("facts", e.target.value)} placeholder="Dates, events, violations, orders — be specific. This context feeds all AI generations." />
      </div>
      <h3 className="sec-sub">CAUSES OF ACTION</h3>
      {["Family Law","Federal Civil Rights","General Civil"].map(cat => (
        <div key={cat} className="claim-grp">
          <div className="claim-cat">{cat}</div>
          <div className="claim-grid">
            {CAUSES_OF_ACTION.filter(c => c.cat === cat).map(c => (
              <button key={c.id} className={`claim-btn ${caseData.claims.includes(c.id) ? "on" : ""}`} onClick={() => toggleClaim(c.id)}>
                <span className="cl">{c.label}</span>
                <span className="ca">{c.auth}</span>
                {caseData.claims.includes(c.id) && <span className="cj">Forms: {c.jcForms.join(", ")}</span>}
              </button>
            ))}
          </div>
        </div>
      ))}
      {selectedClaims.length > 0 && (
        <div className="jc-panel">
          <div className="jc-title">JUDICIAL COUNCIL FORMS — REQUIRED</div>
          <div className="jc-grid">
            {[...new Set(selectedClaims.flatMap(c => c.jcForms))].map(f => (
              <div key={f} className="jc-form">
                <span className="jc-code">{f}</span>
                <span className="jc-desc">{JC_FORMS_REF[f] || "See courts.ca.gov"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <AIBlock label="ANALYZE CASE THEORY" k="theory" run={() => run("theory",
        "You are a California/federal litigation strategist. Analyze case strength, jurisdictional arguments, strategic weaknesses, and recommended claim priority. Be precise. Cite statutes and case law.",
        factsBlock)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
    </div>
  );

  const renderParties = () => (
    <div className="pc">
      <h2 className="pt">PARTY PROFILES</h2>
      <div className="party-form">
        <div className="grid2">
          <Field label="Full Name" value={newParty.name} onChange={v => setNewParty(p => ({...p,name:v}))} placeholder="Christina M. Doe" />
          <div className="field">
            <label className="fl">ROLE</label>
            <select className="sel" value={newParty.role} onChange={e => setNewParty(p => ({...p,role:e.target.value}))}>
              <option value="">— Select Role —</option>
              {PARTY_ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="field-full">
          <label className="fl">NOTES / CONDUCT DOCUMENTED</label>
          <textarea className="ta" rows={3} value={newParty.notes} onChange={e => setNewParty(p => ({...p,notes:e.target.value}))} placeholder="Known addresses, documented violations, relationships, relevant history..." />
        </div>
        <Btn variant="gold" onClick={() => {
          if (!newParty.name || !newParty.role) return;
          updateCase("parties", [...(caseData.parties||[]), {...newParty, id: Date.now()}]);
          setNewParty({ name: "", role: "", notes: "" });
        }}>+ ADD PARTY</Btn>
      </div>
      <div className="party-list">
        {(caseData.parties||[]).map((p, i) => (
          <div key={p.id} className="party-card">
            <div className="party-top">
              <div>
                <div className="party-name">{p.name}</div>
                <div className="party-role">{p.role}</div>
              </div>
              <button className="del-btn" onClick={() => updateCase("parties", caseData.parties.filter(x => x.id !== p.id))}>✕</button>
            </div>
            {p.notes && <div className="party-notes">{p.notes}</div>}
          </div>
        ))}
      </div>
      <AIBlock label="GENERATE PARTY CONDUCT ANALYSIS" k="party_analysis" run={() => run("party_analysis",
        "You are a California litigation investigator. Analyze each party's documented conduct, identify patterns of coordinated behavior, and flag potential RICO or conspiracy elements.",
        `PARTIES:\n${(caseData.parties||[]).map(p => `${p.name} (${p.role}): ${p.notes}`).join("\n")}\n\nCASE FACTS: ${caseData.facts}`)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
    </div>
  );

  const renderTimeline = () => (
    <div className="pc">
      <h2 className="pt">CHRONOLOGICAL TIMELINE</h2>
      <div className="timeline-form">
        <div className="grid2">
          <Field label="Date" value={newEvent.date} onChange={v => setNewEvent(e => ({...e,date:v}))} placeholder="2025-07-13" />
          <Field label="Source / Document" value={newEvent.source} onChange={v => setNewEvent(e => ({...e,source:v}))} placeholder="Police report, court order, text message..." />
        </div>
        <div className="field-full">
          <label className="fl">EVENT DESCRIPTION</label>
          <textarea className="ta" rows={2} value={newEvent.event} onChange={e => setNewEvent(ev => ({...ev,event:e.target.value}))} placeholder="Cole taken from Benicia at approximately 2 AM by Christina without notice." />
        </div>
        <Field label="Legal Significance" value={newEvent.significance} onChange={v => setNewEvent(e => ({...e,significance:v}))} placeholder="Violation of Fam. Code § 3134 — abduction by non-custodial parent" />
        <div style={{marginTop:10}}>
          <Btn variant="gold" onClick={() => {
            if (!newEvent.date || !newEvent.event) return;
            const sorted = [...(caseData.timeline||[]), {...newEvent, id: Date.now()}].sort((a,b) => a.date.localeCompare(b.date));
            updateCase("timeline", sorted);
            setNewEvent({ date: "", event: "", source: "", significance: "" });
          }}>+ ADD EVENT</Btn>
        </div>
      </div>
      <div className="timeline-list">
        {(caseData.timeline||[]).map((e, i) => (
          <div key={e.id} className="tl-entry">
            <div className="tl-date">{e.date}</div>
            <div className="tl-body">
              <div className="tl-event">{e.event}</div>
              {e.source && <div className="tl-source">SOURCE: {e.source}</div>}
              {e.significance && <div className="tl-sig">{e.significance}</div>}
            </div>
            <button className="del-btn" onClick={() => updateCase("timeline", caseData.timeline.filter(x => x.id !== e.id))}>✕</button>
          </div>
        ))}
      </div>
      <AIBlock label="GENERATE DECLARATION OF FACTS (TIMELINE)" k="tl_declaration" run={() => run("tl_declaration",
        "You are a California family law attorney. Draft a declaration of facts in numbered paragraphs, chronologically organized, suitable for attachment to any motion. Each paragraph should cite the date, event, and legal significance.",
        `TIMELINE:\n${(caseData.timeline||[]).map(e => `${e.date}: ${e.event} [${e.source}] — ${e.significance}`).join("\n")}\n\nPETITIONER: ${caseData.petitioner}`)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
    </div>
  );

  const renderEvidence = () => (
    <div className="pc">
      <h2 className="pt">EVIDENCE VAULT</h2>
      <div className="ev-form">
        <div className="grid2">
          <Field label="Exhibit Label" value={newExhibit.label} onChange={v => setNewExhibit(e => ({...e,label:v}))} placeholder="Exhibit A" />
          <Field label="Date" value={newExhibit.date} onChange={v => setNewExhibit(e => ({...e,date:v}))} placeholder="2025-06-25" />
        </div>
        <Field label="Document Description" value={newExhibit.description} onChange={v => setNewExhibit(e => ({...e,description:v}))} placeholder="Judge Sato ruling — Alameda County, transferring jurisdiction" />
        <div className="field-full" style={{marginTop:8}}>
          <label className="fl">RELEVANCE TO CLAIMS</label>
          <textarea className="ta" rows={2} value={newExhibit.relevance} onChange={e => setNewExhibit(ev => ({...ev,relevance:e.target.value}))} placeholder="Establishes Alameda County as home court. Negates Marin assumption of jurisdiction. Supports UCCJEA § 3421 home state analysis." />
        </div>
        <Btn variant="gold" onClick={() => {
          if (!newExhibit.label || !newExhibit.description) return;
          updateCase("exhibits", [...(caseData.exhibits||[]), {...newExhibit, id: Date.now()}]);
          setNewExhibit({ label: "", description: "", date: "", relevance: "" });
        }}>+ ADD EXHIBIT</Btn>
      </div>
      <div className="ev-list">
        {(caseData.exhibits||[]).map((ex) => (
          <div key={ex.id} className="ev-card">
            <div className="ev-top">
              <div className="ev-label">{ex.label}</div>
              <div className="ev-date">{ex.date}</div>
              <button className="del-btn" onClick={() => updateCase("exhibits", caseData.exhibits.filter(x => x.id !== ex.id))}>✕</button>
            </div>
            <div className="ev-desc">{ex.description}</div>
            {ex.relevance && <div className="ev-rel">{ex.relevance}</div>}
          </div>
        ))}
      </div>
      <AIBlock label="GENERATE EVIDENCE AUTHENTICATION PLAN" k="ev_auth" run={() => run("ev_auth",
        "You are a California evidence law expert. For each exhibit listed, identify: authentication requirements (Evid. Code §§ 1400–1421), objections opposing counsel will raise, and counter-arguments. Also identify evidentiary gaps.",
        `EXHIBITS:\n${(caseData.exhibits||[]).map(e => `${e.label} (${e.date}): ${e.description} — Relevance: ${e.relevance}`).join("\n")}\n\nCLAIMS: ${selectedClaims.map(c=>c.label).join(", ")}`)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
    </div>
  );

  const renderPleadings = () => (
    <div className="pc">
      <h2 className="pt">PLEADINGS</h2>
      <AIBlock label="DRAFT COMPLAINT CAPTION" k="caption" run={() => run("caption",
        "Draft a properly formatted California/federal court complaint caption. Include all required caption elements per CRC 2.111 or FRCP 10.",
        factsBlock)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
      <AIBlock label="DRAFT VERIFIED COMPLAINT" k="complaint" run={() => run("complaint",
        "You are a California civil litigation attorney. Draft a verified complaint in numbered paragraphs per CCP § 425.10. Include: parties, jurisdiction, venue, general allegations, each cause of action with elements, prayer for relief. Cite all statutes.",
        factsBlock)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
      <AIBlock label="SIMULATE DEMURRER" k="demurrer" run={() => run("demurrer",
        "You are opposing counsel. Simulate a demurrer under CCP § 430.10, challenging the complaint on the strongest available grounds. Identify which claims are most vulnerable.",
        `COMPLAINT BASIS:\n${factsBlock}`)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
      <AIBlock label="DRAFT ANTI-DEMURRER OPPOSITION" k="anti_demurrer" run={() => run("anti_demurrer",
        "You are petitioner's counsel. Draft the opposition to the demurrer, arguing why each cause of action is sufficiently pleaded. Cite California pleading liberality standards and relevant case law.",
        `DEMURRER CONTEXT:\n${aiOut.demurrer || "[Run Demurrer simulation first]"}\n\nCOMPLAINT BASIS:\n${factsBlock}`)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
    </div>
  );

  const renderEmergency = () => (
    <div className="pc">
      <h2 className="pt">EMERGENCY RELIEF</h2>
      <InfoBox>
        <strong>TRO Standards —</strong> State: CCP § 527 — irreparable harm + probability of success + balance of equities. Federal: FRCP 65 / Winter v. NRDC (2008) — four-part test.
      </InfoBox>
      <AIBlock label="DRAFT TRO APPLICATION — STATE" k="tro_ca" run={() => run("tro_ca",
        "You are a California family law attorney. Draft a complete TRO application: Notice, Memorandum (4-part test), Declaration in Support, and Proposed Order. Include Fam. Code § 3134 child abduction provisions if applicable.",
        factsBlock)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
      <AIBlock label="DRAFT PRELIMINARY INJUNCTION — FEDERAL" k="tro_fed" run={() => run("tro_fed",
        "You are a federal civil rights attorney. Draft a motion for preliminary injunction under FRCP 65 applying the Winter four-part test: (1) likelihood of success on 42 U.S.C. § 1983/1985 claims, (2) irreparable harm to parental rights, (3) balance of equities, (4) public interest. Cite Troxel v. Granville, 530 U.S. 57.",
        factsBlock)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
      <AIBlock label="SIMULATE JUDGE RULING — TRO" k="tro_ruling" run={() => run("tro_ruling",
        "You are a neutral California superior court judge. Issue a realistic tentative ruling on the TRO. Apply the balancing test. Be specific about what evidence grants or denies each element.",
        `TRO APPLICATION CONTEXT:\n${aiOut.tro_ca || "[No TRO draft yet]"}\n\n${factsBlock}`)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
    </div>
  );

  const renderUCCJEA = () => (
    <div className="pc">
      <h2 className="pt">UCCJEA JURISDICTIONAL ANALYSIS</h2>
      <InfoBox>
        <strong>Fam. Code §§ 3421–3428</strong> — Home state = where child lived 6 months before filing (§ 3421). Unjustifiable conduct = court SHALL decline jurisdiction (§ 3428). Simultaneous proceedings = must communicate (§ 3426).
      </InfoBox>
      <div className="county-sel">
        <label className="fl">COUNTIES INVOLVED</label>
        <div className="county-grid">
          {["Alameda","Solano","Marin","Contra Costa","San Francisco","Sacramento","San Mateo"].map(c => (
            <button key={c} className={`county-btn ${(caseData.counties||[]).includes(c) ? "on" : ""}`}
              onClick={() => updateCase("counties", (caseData.counties||[]).includes(c) ? caseData.counties.filter(x=>x!==c) : [...(caseData.counties||[]),c])}>{c}</button>
          ))}
        </div>
      </div>
      <AIBlock label="UCCJEA FULL JURISDICTION ANALYSIS" k="uccjea_analysis" run={() => run("uccjea_analysis",
        "You are a California UCCJEA expert. Provide a complete jurisdictional analysis: (1) Home state determination § 3421, (2) Significant connection jurisdiction § 3421(b), (3) Unjustifiable conduct analysis § 3428, (4) Simultaneous proceedings § 3426, (5) Which court should retain/decline jurisdiction and why. Cite specific code sections.",
        `COUNTIES: ${(caseData.counties||[]).join(", ")}\nPETITIONER HOME: Benicia, Solano County\nRESPONDENT DVRO FILED: Marin County (7/17/2025)\nORIGINAL JURISDICTION: Alameda County Superior Court\nCHILD TAKEN: ${caseData.childName} from Benicia 7/13/2025\n${factsBlock}`)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
      <AIBlock label="DRAFT FL-105 UCCJEA DECLARATION" k="fl105" run={() => run("fl105",
        "Draft a completed FL-105 Declaration Under UCCJEA in the format required by the Judicial Council. Include all residential history, pending proceedings, and jurisdictional facts.",
        factsBlock)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
      <AIBlock label="DRAFT MOTION TO DECLINE JURISDICTION § 3428" k="motion_3428" run={() => run("motion_3428",
        "Draft a motion for the court to decline jurisdiction under Fam. Code § 3428 (unjustifiable conduct — respondent created jurisdiction by wrongful removal/retention). Include all required elements and proposed order.",
        factsBlock)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
    </div>
  );

  const renderDiscovery = () => (
    <div className="pc">
      <h2 className="pt">DISCOVERY</h2>
      <div className="disc-grid">
        {DISCOVERY_TYPES.map(d => (
          <button key={d.id} className={`disc-btn ${discSel.includes(d.id) ? "on" : ""}`}
            onClick={() => setDiscSel(p => p.includes(d.id) ? p.filter(x=>x!==d.id) : [...p,d.id])}>
            <span className="dl">{d.label}</span>
            <span className="dlim">{d.limit}</span>
          </button>
        ))}
      </div>
      <AIBlock label="GENERATE DISCOVERY PLAN" k="disc_plan" run={() => run("disc_plan",
        "You are a California civil litigation attorney. Create a targeted discovery plan identifying what must be obtained, from whom, by which method, and why it is critical to proving each claim.",
        `SELECTED TOOLS: ${discSel.join(", ")}\n${factsBlock}`)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
      <AIBlock label="DRAFT SPECIAL INTERROGATORIES" k="interrogatories" run={() => run("interrogatories",
        "Draft targeted special interrogatories numbered 1–25. Stay within CCP § 2030.030 35-question limit. Focus on: facts supporting/contradicting claims, identity of witnesses, location of documents, basis for any denials.",
        `PROPOUNDING: ${caseData.petitioner}\nRESPONDING: ${(caseData.parties||[]).map(p=>p.name).join(", ") || caseData.court}\n${factsBlock}`)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
      <AIBlock label="DRAFT REQUESTS FOR ADMISSION" k="rfa" run={() => run("rfa",
        "Draft requests for admission targeting the key disputed facts. Each admission should, if granted, eliminate an element of proof required on a claim or defense.",
        factsBlock)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
      <AIBlock label="DRAFT SUBPOENA — BUSINESS RECORDS" k="subpoena" run={() => run("subpoena",
        "Draft a Deposition Subpoena for Production of Business Records (SUBP-002). Identify custodians of record, specify the records with particularity, and include the statutory basis for production.",
        `EXHIBITS TO OBTAIN: ${(caseData.exhibits||[]).map(e=>e.description).join("; ")}\n${factsBlock}`)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
    </div>
  );

  const renderMotions = () => (
    <div className="pc">
      <h2 className="pt">MOTION PRACTICE</h2>
      <div className="motion-grid">
        {MOTIONS.map(m => (
          <button key={m.id} className={`motion-btn ${motionSel === m.id ? "on" : ""} ${completedKeys.has("motion_"+m.id) ? "completed" : ""}`}
            onClick={() => setMotionSel(motionSel === m.id ? null : m.id)}>
            <span className="ml">{m.label}</span>
            <span className="ma">{m.auth}</span>
            {completedKeys.has("motion_"+m.id) && <span className="m-done">✓ DRAFTED</span>}
          </button>
        ))}
      </div>
      {motionSel && (() => {
        const m = MOTIONS.find(x => x.id === motionSel);
        return (
          <AIBlock label={`DRAFT: ${m.label.toUpperCase()}`} k={`motion_${m.id}`}
            run={() => run(`motion_${m.id}`,
              `You are a California/federal civil litigation attorney. Draft a complete, properly formatted motion: Notice of Motion, Memorandum of Points and Authorities (with headers and subheadings), Declaration in Support, and Proposed Order. Venue: ${caseData.venue}. Cite all applicable statutes and case law.`,
              `MOTION TYPE: ${m.label} (${m.auth})\n${factsBlock}`)}
            out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
        );
      })()}
      <AIBlock label="SIMULATE OPPOSITION" k="opposition" run={() => run("opposition",
        "You are opposing counsel. Draft the strongest possible opposition to the selected motion. Identify procedural defects first, then substantive weaknesses. Propose alternative relief.",
        `MOTION: ${MOTIONS.find(m=>m.id===motionSel)?.label || "Selected motion"}\n${factsBlock}\nMOTION DRAFT: ${aiOut[`motion_${motionSel}`]?.slice(0,400) || "[No draft yet]"}`)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
      <AIBlock label="SIMULATE JUDGE RULING — MOTION" k="motion_ruling" run={() => run("motion_ruling",
        "You are a California superior court judge. Issue a detailed tentative ruling on the motion. Apply the correct legal standard. Be specific about which facts support/undercut each element.",
        `MOTION: ${MOTIONS.find(m=>m.id===motionSel)?.label || "Motion"}\n${factsBlock}`)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
    </div>
  );

  const renderContempt = () => (
    <div className="pc">
      <h2 className="pt">CONTEMPT / OSC PROCEEDINGS</h2>
      <InfoBox>
        <strong>Fam. Code § 290; CCP § 1209</strong> — Elements: (1) valid order, (2) knowledge, (3) ability to comply, (4) willful violation. Penalty: up to 5 days/count + $1,000/count. Each violation = separate count.
      </InfoBox>
      <AIBlock label="DRAFT OSC RE: CONTEMPT — ALL COUNTS" k="contempt_osc" run={() => run("contempt_osc",
        "Draft a complete OSC re Contempt under Fam. Code § 290 and CCP § 1209. List each violation as a separate numbered count with: (1) the specific order violated with date, (2) respondent's knowledge of the order, (3) the specific violating act with date, (4) ability to comply. Include supporting declaration.",
        `VIOLATIONS:\n${(caseData.timeline||[]).filter(e=>e.significance).map(e=>`${e.date}: ${e.event} — ${e.significance}`).join("\n")}\n${factsBlock}`)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
      <AIBlock label="SIMULATE CONTEMPT HEARING" k="contempt_hearing" run={() => run("contempt_hearing",
        "You are a California family court judge presiding over a contempt hearing. Simulate the full hearing: opening statements, examination of witnesses, rulings on objections, contempt finding or denial with findings of fact.",
        factsBlock)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
      <AIBlock label="DRAFT FL-410 OSC AFFIDAVIT" k="fl410" run={() => run("fl410",
        "Draft a completed FL-410 Order to Show Cause and Affidavit for Contempt in the format required by the Judicial Council. Include all required elements in the affidavit section.",
        factsBlock)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
    </div>
  );

  const renderSanctions = () => {
    const months271 = parseFloat(sanctions271.months) || 0;
    const income271 = parseFloat(sanctions271.income) || 0;
    const est271 = Math.min(months271 * income271 * 0.3, 50000);
    return (
      <div className="pc">
        <h2 className="pt">SANCTIONS CALCULATOR</h2>
        <div className="sanc-section">
          <div className="sanc-title">FAM. CODE § 271 — LITIGATION CONDUCT SANCTIONS</div>
          <InfoBox>Awards attorney fees as sanction for conduct that frustrates settlement. Court considers: (1) unreasonable positions, (2) failure to meet/confer, (3) discovery obstruction. No bad faith requirement.</InfoBox>
          <div className="grid2">
            <Field label="Months of Litigation Caused by Conduct" value={sanctions271.months} onChange={v => setSanctions271(s=>({...s,months:v}))} placeholder="16" />
            <Field label="Estimated Monthly Legal Costs ($)" value={sanctions271.income} onChange={v => setSanctions271(s=>({...s,income:v}))} placeholder="3000" />
          </div>
          <div className="field-full">
            <label className="fl">SPECIFIC CONDUCT TO SANCTION</label>
            <textarea className="ta" rows={3} value={sanctions271.conduct} onChange={e => setSanctions271(s=>({...s,conduct:e.target.value}))} placeholder="Forum shopping between Alameda/Marin/Solano; false representations re: jurisdiction; refusal to comply with custody order for 16+ months..." />
          </div>
          <div className="sanc-calc">
            <div className="sc-row"><span>Est. § 271 Sanctions</span><span>${est271.toLocaleString()}</span></div>
          </div>
        </div>
        <div className="sanc-section">
          <div className="sanc-title">CCP § 128.7 — FRIVOLOUS FILING SANCTIONS</div>
          <InfoBox>Applies to filings that are: (1) not warranted by existing law, (2) frivolous, (3) filed for improper purpose. 21-day safe harbor required before filing motion.</InfoBox>
          <div className="grid2">
            <Field label="Number of Frivolous Filings" value={sanctions1287.filings} onChange={v => setSanctions1287(s=>({...s,filings:v}))} placeholder="3" />
            <Field label="Type of Filing" value={sanctions1287.type} onChange={v => setSanctions1287(s=>({...s,type:v}))} placeholder="DVRO, jurisdiction motions, custody modifications" />
          </div>
          <div className="sanc-calc">
            <div className="sc-row"><span>Est. § 128.7 Sanctions</span><span>${((parseFloat(sanctions1287.filings)||0) * 1500).toLocaleString()} – ${((parseFloat(sanctions1287.filings)||0) * 5000).toLocaleString()}</span></div>
          </div>
        </div>
        <AIBlock label="DRAFT SANCTIONS MOTION (§ 271 + § 128.7)" k="sanctions_motion" run={() => run("sanctions_motion",
          "Draft a combined motion for sanctions under Fam. Code § 271 and CCP § 128.7. Include: factual basis for each provision, documentation of specific conduct, calculation of fees, and a separate 21-day safe harbor notice letter for § 128.7.",
          `§ 271 CONDUCT: ${sanctions271.conduct}\nMONTHS: ${sanctions271.months} | COST: $${sanctions271.income}/mo\n§ 128.7 FILINGS: ${sanctions1287.filings} (${sanctions1287.type})\n${factsBlock}`)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
      </div>
    );
  };

  const renderAudit = () => (
    <div className="pc">
      <h2 className="pt">AUDIT MODE — DOCUMENT COMPLIANCE</h2>
      <InfoBox>Submit any document for compliance audit against its governing Legal Standard of Creation (S.o.C.). Identifies procedural defects, internal inconsistencies, and compliance failures.</InfoBox>
      <div className="field">
        <label className="fl">DOCUMENT TYPE</label>
        <select className="sel" value={auditType} onChange={e => setAuditType(e.target.value)}>
          {["motion","order","declaration","complaint","DVRO","custody evaluation","police report","court transcript","agency correspondence","medical record","insurance document"].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="field-full" style={{marginTop:10}}>
        <label className="fl">PASTE DOCUMENT TEXT FOR AUDIT</label>
        <textarea className="ta" rows={12} value={auditDoc} onChange={e => setAuditDoc(e.target.value)} placeholder="Paste the full text of the document to be audited..." />
      </div>
      <AIBlock label="RUN COMPLIANCE AUDIT" k="audit_result" run={() => run("audit_result",
        `You are a legal document auditor applying the VERNEN audit methodology. For the submitted ${auditType}:
1. IDENTIFY the governing Legal Standard of Creation (statute, regulation, or professional code)
2. AUDIT for: procedural defects, missing required elements, internal inconsistencies, compliance failures
3. FLAG each finding with: (a) the specific defect, (b) the violated standard with citation, (c) severity (Critical/Significant/Advisory)
4. ASSESS authenticity and integrity concerns
5. PROVIDE a compliance score and summary
Format: structured findings, not prose paragraphs. Every finding must be traceable to specific text + violated standard.`,
        `DOCUMENT TYPE: ${auditType}\nCASE CONTEXT: ${caseData.title} | ${caseData.court}\nDOCUMENT TEXT:\n${auditDoc}`)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
    </div>
  );

  const renderTrial = () => (
    <div className="pc">
      <h2 className="pt">TRIAL SIMULATION</h2>
      <AIBlock label="OPENING STATEMENT" k="opening" run={() => run("opening",
        "Draft a compelling opening statement for a California bench trial. Lead with strongest facts. Establish credibility. Preview key evidence. Connect facts to legal elements. 5–8 minutes speaking time.",
        factsBlock)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
      <AIBlock label="DIRECT EXAMINATION — PETITIONER" k="direct" run={() => run("direct",
        "Draft a full direct examination outline for the petitioner using open-ended questions. Organized chronologically. Tie each section to elements of the claims being proven.",
        `EXHIBITS: ${(caseData.exhibits||[]).map(e=>`${e.label}: ${e.description}`).join("; ")}\n${factsBlock}`)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
      <AIBlock label="SIMULATE CROSS-EXAMINATION" k="cross" run={() => run("cross",
        "You are opposing counsel in a California bench trial. Draft a cross-examination targeting: credibility, prior inconsistent statements, gaps in evidence, and weaknesses in the case theory.",
        `DIRECT EXAMINATION CONTEXT:\n${aiOut.direct?.slice(0,400) || "[No direct exam yet]"}\n${factsBlock}`)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
      <AIBlock label="RE-DIRECT EXAMINATION" k="redirect" run={() => run("redirect",
        "Draft a redirect examination addressing the damage done in cross-examination. Restore credibility and clarify mischaracterizations. Keep it tight — limited to issues raised on cross.",
        `CROSS EXAM: ${aiOut.cross?.slice(0,400) || "[No cross yet]"}\n${factsBlock}`)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
      <AIBlock label="CLOSING ARGUMENT" k="closing" run={() => run("closing",
        "Draft a closing argument: synthesize the evidence admitted, apply law to facts for each claim, address weaknesses head-on, and make a specific request for relief. For bench trial — address the judge directly with legal authority.",
        `EXHIBITS IN EVIDENCE: ${(caseData.exhibits||[]).map(e=>e.label).join(", ")}\n${factsBlock}`)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
    </div>
  );

  const renderVerdict = () => {
    const comp = parseFloat(damages.compensatory) || 0;
    const pun = parseFloat(damages.punitive) || 0;
    const rico3x = damages.rico ? comp * 3 : 0;
    const fees = damages.fees ? 50000 : 0;
    const total = comp + pun + rico3x + fees;
    return (
      <div className="pc">
        <h2 className="pt">VERDICT & DAMAGES</h2>
        <div className="grid2">
          <Field label="Compensatory Damages ($)" value={damages.compensatory} onChange={v => setDamages(d=>({...d,compensatory:v}))} placeholder="250000" />
          <Field label="Punitive Damages ($)" value={damages.punitive} onChange={v => setDamages(d=>({...d,punitive:v}))} placeholder="750000" />
        </div>
        <div className="check-row">
          <label className="chk"><input type="checkbox" checked={damages.rico} onChange={e=>setDamages(d=>({...d,rico:e.target.checked}))} /> RICO Treble Damages (18 U.S.C. § 1964(c)) — ×3 compensatory = ${rico3x.toLocaleString()}</label>
          <label className="chk"><input type="checkbox" checked={damages.fees} onChange={e=>setDamages(d=>({...d,fees:e.target.checked}))} /> Attorney Fees — 42 U.S.C. § 1988 / CCP § 1021.5 (est. $50,000)</label>
        </div>
        <div className="dmg-total">
          {[["Compensatory", comp],["RICO Treble", rico3x],["Punitive", pun],["Est. Fees", fees]].filter(([,v])=>v>0).map(([l,v]) => (
            <div key={l} className="dt-row"><span>{l}</span><span>${v.toLocaleString()}</span></div>
          ))}
          <div className="dt-grand"><span>TOTAL EXPOSURE</span><span>${total.toLocaleString()}</span></div>
        </div>
        <AIBlock label="SIMULATE VERDICT — ALL CLAIMS" k="verdict" run={() => run("verdict",
          "You are a California/federal court judge issuing findings of fact and conclusions of law after bench trial. For each claim: state the elements, find the facts, apply the law, and render a verdict. Calculate damages.",
          `CLAIMS: ${selectedClaims.map(c=>c.label).join(", ")}\nDEMAND: Compensatory $${comp.toLocaleString()} | Punitive $${pun.toLocaleString()} | RICO: ${damages.rico} | Fees: ${damages.fees}\n${factsBlock}`)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
      </div>
    );
  };

  const renderAppeal = () => (
    <div className="pc">
      <h2 className="pt">APPELLATE PROCEEDINGS</h2>
      <InfoBox>
        <strong>Cal. Rules of Court 8.104</strong> — Notice of appeal: 60 days from entry of judgment. <strong>FRAP 4</strong> — 30 days federal. Standards of review: de novo (law), abuse of discretion (procedure), substantial evidence (facts).
      </InfoBox>
      <div className="appeal-list">
        <label className="fl">GROUNDS FOR APPEAL</label>
        {APPEAL_GROUNDS.map((g,i) => (
          <label key={i} className="appeal-item">
            <input type="checkbox" checked={appealSel.includes(i)} onChange={() => setAppealSel(p => p.includes(i) ? p.filter(x=>x!==i) : [...p,i])} />
            <span>{g}</span>
          </label>
        ))}
      </div>
      <AIBlock label="DRAFT NOTICE OF APPEAL" k="notice_appeal" run={() => run("notice_appeal",
        "Draft a Notice of Appeal with Designation of Record. Include all required elements per CRC 8.100. Specify what portions of the record are being designated.",
        `GROUNDS: ${appealSel.map(i=>APPEAL_GROUNDS[i]).join("; ")}\n${factsBlock}`)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
      <AIBlock label="DRAFT OPENING BRIEF" k="app_brief" run={() => run("app_brief",
        "Draft an appellate opening brief with: Cover Page, Table of Contents, Table of Authorities, Introduction, Jurisdictional Statement, Statement of Facts, Issues Presented, Argument (each issue with standard of review), and Conclusion with specific relief requested.",
        `GROUNDS: ${appealSel.map(i=>APPEAL_GROUNDS[i]).join("; ")}\n${factsBlock}`)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
      <AIBlock label="SIMULATE ORAL ARGUMENT" k="app_argument" run={() => run("app_argument",
        "You are a panel of three California Court of Appeal justices. Simulate oral argument with pointed questions probing the weakest aspects of both sides. Issue a tentative disposition.",
        `GROUNDS: ${appealSel.map(i=>APPEAL_GROUNDS[i]).join("; ")}\n${factsBlock}`)} out={aiOut} loading={loading} done={completedKeys} onExport={exportTxt} />
    </div>
  );

  const renderStatuteLookup = () => (
    <div className="statute-panel">
      <div className="statute-title">STATUTE LOOKUP</div>
      <div className="statute-input">
        <input className="stat-in" value={statuteLookup.query} onChange={e => setStatuteLookup(s=>({...s,query:e.target.value}))}
          placeholder="e.g. Fam Code 3421, CCP 527, 42 USC 1983" />
        <button className={`stat-btn ${loading.statute ? "running" : ""}`} disabled={loading.statute}
          onClick={async () => {
            if (!statuteLookup.query) return;
            setLoading(l=>({...l,statute:true}));
            setStatuteLookup(s=>({...s,result:""}));
            await streamClaude({
              system: "You are a legal research assistant. Provide the complete statutory text and a brief interpretation. Cite exact code section, effective date, and key subsections.",
              user: `Provide the full text of: ${statuteLookup.query}. Then briefly explain its application in California civil/family litigation.`,
              onToken: (t) => setStatuteLookup(s=>({...s,result:t})),
              onDone: () => setLoading(l=>({...l,statute:false})),
              onError: (e) => { setStatuteLookup(s=>({...s,result:"Error: "+e})); setLoading(l=>({...l,statute:false})); }
            });
          }}>
          {loading.statute ? "◌" : "▶"}
        </button>
      </div>
      {statuteLookup.result && <div className="stat-result">{statuteLookup.result}</div>}
    </div>
  );

  const phaseMap = { setup: renderSetup, parties: renderParties, timeline: renderTimeline, evidence: renderEvidence, pleadings: renderPleadings, emergency: renderEmergency, uccjea_phase: renderUCCJEA, discovery: renderDiscovery, motions: renderMotions, contempt_phase: renderContempt, sanctions: renderSanctions, audit: renderAudit, trial: renderTrial, verdict: renderVerdict, appeal: renderAppeal };

  if (printMode) return <PrintView caseData={caseData} aiOut={aiOut} onClose={() => setPrintMode(false)} />;

  return (
    <div className="app">
      <style>{CSS}</style>
      <div className="header">
        <div className="hl">
          <div className="logo">VERNEN™</div>
          <div className="logo-sub">CIVIL SUIT SIMULATOR v7</div>
        </div>
        <div className="hr">
          <select className="lang-sel" value={lang} onChange={e => setLang(e.target.value)}>
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
          <div className="venue-badge" style={{color: caseData.venue==="federal" ? "#4a90d9" : "#c9a84c"}}>
            {caseData.venue === "federal" ? "FEDERAL" : "STATE"}
          </div>
          <button className="icon-btn" onClick={() => setPrintMode(true)} title="Print / Export View">⎙</button>
          <div className="case-no">{caseData.caseNo || "NO CASE #"}</div>
        </div>
      </div>
      <div className="nav">
        {PHASES.map(p => (
          <button key={p.id} className={`nav-btn ${phase===p.id?"on":""}`} onClick={() => setPhase(p.id)}>
            <span className="ni">{p.icon}</span>
            <span className="nl">{p.label}</span>
          </button>
        ))}
      </div>
      <div className="main">
        <div className="content">
          {phaseMap[phase]?.()}
        </div>
        <div className="sidebar">
          {renderStatuteLookup()}
          <div className="sb-sec">
            <div className="sb-title">ACTIVE CLAIMS ({selectedClaims.length})</div>
            {selectedClaims.length === 0 ? <div className="sb-empty">None selected</div> : selectedClaims.map(c => (
              <div key={c.id} className="sb-claim">
                <div className="sbc-l">{c.label}</div>
                <div className="sbc-a">{c.auth}</div>
              </div>
            ))}
          </div>
          <div className="sb-sec">
            <div className="sb-title">ACTIVITY LOG ({actLog.length})</div>
            {actLog.length === 0 ? <div className="sb-empty">No activity</div> : actLog.slice(0,10).map((l,i) => (
              <div key={i} className="log-e">
                <div className="log-ph" onClick={() => setLogExpanded(logExpanded===i ? null : i)}>
                  {l.phase} › {l.key} {logExpanded===i ? "▲" : "▼"}
                </div>
                {logExpanded === i && <div className="log-txt">{l.text}</div>}
                {logExpanded !== i && <div className="log-prev">{l.text?.slice(0,70)}…</div>}
              </div>
            ))}
          </div>
          <div className="sb-sec">
            <div className="sb-title">TIMELINE ({(caseData.timeline||[]).length})</div>
            {(caseData.timeline||[]).slice(-5).map(e => (
              <div key={e.id} className="tl-mini">
                <div className="tlm-d">{e.date}</div>
                <div className="tlm-e">{e.event}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PRINT VIEW ───────────────────────────────────────────────────────────────
function PrintView({ caseData, aiOut, onClose }) {
  const sections = Object.entries(aiOut).filter(([,v])=>v);
  return (
    <div style={{background:"#fff",color:"#111",fontFamily:"Georgia,serif",padding:"40px",minHeight:"100vh"}}>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div className="no-print" style={{marginBottom:20,display:"flex",gap:12}}>
        <button onClick={onClose} style={{padding:"8px 16px",background:"#1a1707",color:"#c9a84c",border:"1px solid #c9a84c",cursor:"pointer"}}>← BACK</button>
        <button onClick={() => window.print()} style={{padding:"8px 16px",background:"#c9a84c",color:"#111",border:"none",cursor:"pointer",fontWeight:"bold"}}>⎙ PRINT / SAVE PDF</button>
      </div>
      <div style={{textAlign:"center",borderBottom:"2px solid #111",paddingBottom:20,marginBottom:30}}>
        <div style={{fontSize:10,letterSpacing:4,color:"#666",marginBottom:8}}>VERNEN™ CIVIL SUIT SIMULATOR v7</div>
        <div style={{fontSize:22,fontWeight:"bold"}}>{caseData.title || "Untitled Case"}</div>
        <div style={{fontSize:14,color:"#444",marginTop:6}}>{caseData.court} | Case No: {caseData.caseNo}</div>
        <div style={{fontSize:12,color:"#666",marginTop:4}}>{caseData.petitioner} | Generated: {new Date().toLocaleString()}</div>
      </div>
      {sections.map(([key, text]) => (
        <div key={key} style={{marginBottom:40,pageBreakInside:"avoid"}}>
          <div style={{fontSize:10,letterSpacing:3,fontWeight:"bold",color:"#666",marginBottom:10,paddingBottom:6,borderBottom:"1px solid #ddd"}}>{key.toUpperCase().replace(/_/g," ")}</div>
          <div style={{whiteSpace:"pre-wrap",lineHeight:1.8,fontSize:13}}>{text}</div>
        </div>
      ))}
    </div>
  );
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder }) {
  return (
    <div className="field">
      {label && <label className="fl">{label}</label>}
      <input className="inp" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder||""} />
    </div>
  );
}

function InfoBox({ children }) {
  return <div className="info-box">{children}</div>;
}

function Btn({ children, onClick, variant = "default" }) {
  return <button className={`btn btn-${variant}`} onClick={onClick}>{children}</button>;
}

function Toggle({ label, active, onClick }) {
  return (
    <button className={`toggle ${active?"on":""}`} onClick={onClick}>{label}</button>
  );
}

function AIBlock({ label, k, run, out, loading, done, onExport }) {
  const isLoading = loading[k];
  const isDone = done.has(k);
  const output = out[k];
  return (
    <div className="ai-block">
      <div className="ai-top">
        <button className={`run-btn ${isLoading?"spinning":""} ${isDone?"drafted":""}`} onClick={run} disabled={isLoading}>
          <span>{isLoading ? "◌" : isDone ? "✓" : "▶"}</span>
          {label}
        </button>
        {isDone && <button className="export-btn" onClick={() => onExport(k)}>⬇ TXT</button>}
      </div>
      {output && (
        <div className="ai-out">
          <div className="ai-out-hdr">AI OUTPUT {isDone ? "✓" : "STREAMING…"}</div>
          <div className="ai-out-body">{output}</div>
        </div>
      )}
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
.app{min-height:100vh;background:#0d0d0f;color:#c8c0b0;font-family:'IBM Plex Sans',sans-serif;font-size:13px;}
.header{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-bottom:1px solid #c9a84c25;background:#0a0a0c;}
.logo{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:#c9a84c;letter-spacing:3px;}
.logo-sub{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#555;letter-spacing:4px;margin-top:2px;}
.hr{display:flex;align-items:center;gap:10px;}
.lang-sel,.sel{background:#1a1a1e;border:1px solid #c9a84c35;color:#c9a84c;padding:4px 8px;border-radius:2px;font-family:'IBM Plex Mono',monospace;font-size:10px;cursor:pointer;}
.venue-badge{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:2px;border:1px solid currentColor;padding:3px 8px;border-radius:2px;opacity:0.8;}
.icon-btn{background:none;border:1px solid #333;color:#888;padding:4px 8px;cursor:pointer;font-size:14px;border-radius:2px;}
.icon-btn:hover{border-color:#c9a84c;color:#c9a84c;}
.case-no{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#555;border:1px solid #222;padding:3px 8px;border-radius:2px;}
.nav{display:flex;overflow-x:auto;background:#0c0c0e;border-bottom:1px solid #1a1a1e;scrollbar-width:none;}
.nav-btn{display:flex;flex-direction:column;align-items:center;padding:8px 12px;background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;gap:2px;min-width:70px;transition:all .2s;}
.nav-btn:hover{background:#141416;}
.nav-btn.on{border-bottom-color:#c9a84c;background:#121108;}
.ni{font-size:14px;}
.nl{font-family:'IBM Plex Mono',monospace;font-size:7px;color:#777;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;}
.nav-btn.on .nl{color:#c9a84c;}
.main{display:grid;grid-template-columns:1fr 220px;min-height:calc(100vh - 88px);}
.content{padding:20px;overflow-y:auto;border-right:1px solid #1a1a1e;}
.pc{max-width:820px;}
.ph-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;flex-wrap:wrap;gap:10px;}
.ph-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
.pt{font-family:'Playfair Display',serif;font-size:18px;color:#c9a84c;letter-spacing:3px;padding-bottom:10px;border-bottom:1px solid #c9a84c25;}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;}
.field{display:flex;flex-direction:column;gap:4px;}
.field-full{margin-bottom:16px;}
.fl{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#c9a84c80;letter-spacing:2px;text-transform:uppercase;display:block;margin-bottom:3px;}
.inp{background:#131316;border:1px solid #252528;color:#c8c0b0;padding:7px 10px;border-radius:2px;font-family:'IBM Plex Sans',sans-serif;font-size:12px;outline:none;width:100%;transition:border .2s;}
.inp:focus{border-color:#c9a84c45;}
.ta{background:#131316;border:1px solid #252528;color:#c8c0b0;padding:8px 10px;border-radius:2px;font-family:'IBM Plex Sans',sans-serif;font-size:12px;outline:none;resize:vertical;width:100%;transition:border .2s;}
.ta:focus{border-color:#c9a84c45;}
.sec-sub{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#c9a84c;letter-spacing:3px;margin:20px 0 10px;}
.claim-grp{margin-bottom:18px;}
.claim-cat{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:7px;}
.claim-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:5px;}
.claim-btn{display:flex;flex-direction:column;align-items:flex-start;padding:9px 11px;background:#131316;border:1px solid #252528;border-radius:2px;cursor:pointer;text-align:left;transition:all .15s;gap:2px;}
.claim-btn:hover{border-color:#c9a84c35;}
.claim-btn.on{background:#171406;border-color:#c9a84c60;}
.cl{font-size:11px;color:#c8c0b0;line-height:1.3;}
.claim-btn.on .cl{color:#e8d080;}
.ca{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#555;}
.cj{font-family:'IBM Plex Mono',monospace;font-size:7px;color:#c9a84c60;margin-top:2px;}
.jc-panel{margin-top:20px;background:#0f0f0c;border:1px solid #c9a84c25;border-radius:2px;padding:14px;}
.jc-title{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#c9a84c;letter-spacing:3px;margin-bottom:10px;}
.jc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;}
.jc-form{background:#131310;border:1px solid #222;padding:8px 10px;border-radius:2px;}
.jc-code{font-family:'IBM Plex Mono',monospace;font-size:10px;color:#c9a84c;display:block;}
.jc-desc{font-size:10px;color:#888;margin-top:2px;display:block;}
.info-box{background:#111108;border:1px solid #c9a84c25;border-left:2px solid #c9a84c;padding:10px 14px;margin-bottom:16px;border-radius:2px;font-size:12px;line-height:1.65;color:#a09880;}
.info-box strong{color:#c9a84c;}
.ai-block{margin-top:18px;}
.ai-top{display:flex;align-items:center;gap:10px;}
.run-btn{display:flex;align-items:center;gap:8px;background:#171406;border:1px solid #c9a84c;color:#c9a84c;padding:9px 18px;border-radius:2px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:2px;transition:all .2s;white-space:nowrap;}
.run-btn:hover:not(:disabled){background:#1e1808;}
.run-btn:disabled{opacity:.5;cursor:not-allowed;}
.run-btn.spinning span{display:inline-block;animation:spin 1s linear infinite;}
.run-btn.drafted{border-color:#4a8a4a;background:#0a130a;}
.run-btn.drafted{color:#6aba6a;}
.export-btn{background:none;border:1px solid #333;color:#666;padding:5px 10px;border-radius:2px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:8px;transition:all .2s;}
.export-btn:hover{border-color:#c9a84c;color:#c9a84c;}
@keyframes spin{to{transform:rotate(360deg);}}
.ai-out{margin-top:10px;background:#0d0d10;border:1px solid #1e1e22;border-left:2px solid #c9a84c;border-radius:2px;}
.ai-out-hdr{font-family:'IBM Plex Mono',monospace;font-size:7px;color:#c9a84c;letter-spacing:3px;padding:5px 12px;background:#111108;border-bottom:1px solid #1a1a1e;}
.ai-out-body{padding:12px;white-space:pre-wrap;line-height:1.75;font-size:12px;color:#a8a090;max-height:520px;overflow-y:auto;}
.btn{padding:6px 14px;border-radius:2px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:1px;border:1px solid;}
.btn-gold{background:#171406;border-color:#c9a84c;color:#c9a84c;}
.btn-gold:hover{background:#1e1808;}
.btn-danger{background:#1a0808;border-color:#8a4a4a;color:#ca7070;}
.btn-danger:hover{background:#221010;}
.toggle{padding:5px 12px;border-radius:2px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:2px;border:1px solid #333;background:none;color:#555;transition:all .2s;}
.toggle.on{border-color:#4a90d9;background:#080f1a;color:#4a90d9;}
/* Parties */
.party-form{background:#0f0f12;border:1px solid #1e1e22;padding:16px;border-radius:2px;margin-bottom:16px;}
.party-list{display:flex;flex-direction:column;gap:8px;margin-bottom:16px;}
.party-card{background:#131316;border:1px solid #252528;border-radius:2px;padding:12px;}
.party-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;}
.party-name{font-size:13px;color:#c8c0b0;font-weight:500;}
.party-role{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#c9a84c;margin-top:2px;}
.party-notes{font-size:11px;color:#888;line-height:1.5;}
.del-btn{background:none;border:none;color:#555;cursor:pointer;font-size:14px;padding:2px 6px;}
.del-btn:hover{color:#ca7070;}
/* Timeline */
.timeline-form{background:#0f0f12;border:1px solid #1e1e22;padding:16px;border-radius:2px;margin-bottom:16px;}
.timeline-list{display:flex;flex-direction:column;gap:6px;margin-bottom:16px;}
.tl-entry{display:grid;grid-template-columns:90px 1fr auto;gap:10px;align-items:start;background:#131316;border:1px solid #1e1e22;padding:10px;border-radius:2px;}
.tl-date{font-family:'IBM Plex Mono',monospace;font-size:10px;color:#c9a84c;padding-top:2px;}
.tl-event{font-size:12px;color:#c8c0b0;line-height:1.4;margin-bottom:3px;}
.tl-source{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#555;margin-bottom:2px;}
.tl-sig{font-size:10px;color:#8a7850;font-style:italic;}
/* Evidence */
.ev-form{background:#0f0f12;border:1px solid #1e1e22;padding:16px;border-radius:2px;margin-bottom:16px;}
.ev-list{display:flex;flex-direction:column;gap:6px;margin-bottom:16px;}
.ev-card{background:#131316;border:1px solid #1e1e22;padding:10px 12px;border-radius:2px;}
.ev-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;}
.ev-label{font-family:'IBM Plex Mono',monospace;font-size:11px;color:#c9a84c;font-weight:500;}
.ev-date{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#555;}
.ev-desc{font-size:12px;color:#c8c0b0;margin-bottom:4px;}
.ev-rel{font-size:10px;color:#8a7850;font-style:italic;}
/* County */
.county-sel{margin-bottom:16px;}
.county-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:5px;margin-top:6px;}
.county-btn{padding:7px 10px;background:#131316;border:1px solid #252528;border-radius:2px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:10px;color:#888;transition:all .15s;}
.county-btn:hover{border-color:#c9a84c35;}
.county-btn.on{background:#171406;border-color:#c9a84c;color:#c9a84c;}
/* Discovery */
.disc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:5px;margin-bottom:16px;}
.disc-btn{display:flex;flex-direction:column;align-items:flex-start;padding:9px 11px;background:#131316;border:1px solid #252528;border-radius:2px;cursor:pointer;transition:all .15s;gap:3px;}
.disc-btn:hover{border-color:#c9a84c35;}
.disc-btn.on{background:#171406;border-color:#c9a84c;}
.dl{font-size:11px;color:#c8c0b0;}
.disc-btn.on .dl{color:#e8d080;}
.dlim{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#555;}
/* Motions */
.motion-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:5px;margin-bottom:16px;}
.motion-btn{display:flex;flex-direction:column;align-items:flex-start;padding:9px 11px;background:#131316;border:1px solid #252528;border-radius:2px;cursor:pointer;transition:all .15s;gap:2px;}
.motion-btn:hover{border-color:#c9a84c35;}
.motion-btn.on{background:#171406;border-color:#c9a84c;}
.motion-btn.completed{border-color:#4a8a4a;}
.ml{font-size:11px;color:#c8c0b0;line-height:1.3;}
.motion-btn.on .ml{color:#e8d080;}
.ma{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#555;}
.m-done{font-family:'IBM Plex Mono',monospace;font-size:7px;color:#6aba6a;margin-top:2px;}
/* Sanctions */
.sanc-section{background:#0f0f12;border:1px solid #1e1e22;padding:16px;border-radius:2px;margin-bottom:16px;}
.sanc-title{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#c9a84c;letter-spacing:2px;margin-bottom:12px;}
.sanc-calc{margin-top:12px;background:#0a0a0c;border:1px solid #1a1a1e;padding:10px 14px;border-radius:2px;}
.sc-row{display:flex;justify-content:space-between;font-family:'IBM Plex Mono',monospace;font-size:12px;color:#c8c0b0;}
/* Damages */
.check-row{display:flex;flex-direction:column;gap:6px;margin-bottom:16px;}
.chk{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#a09880;cursor:pointer;padding:8px 10px;background:#131316;border:1px solid #252528;border-radius:2px;}
.chk input{margin-top:2px;accent-color:#c9a84c;}
.dmg-total{background:#0f0f0c;border:1px solid #c9a84c25;border-radius:2px;padding:14px;margin-bottom:16px;}
.dt-row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #1a1a1e;font-family:'IBM Plex Mono',monospace;font-size:12px;color:#a09880;}
.dt-grand{display:flex;justify-content:space-between;padding:10px 0 0;font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:600;color:#c9a84c;margin-top:6px;border-top:1px solid #c9a84c30;}
/* Appeal */
.appeal-list{margin-bottom:16px;}
.appeal-item{display:flex;align-items:flex-start;gap:10px;padding:9px 12px;background:#131316;border:1px solid #252528;border-radius:2px;margin-bottom:4px;cursor:pointer;font-size:12px;color:#a09880;transition:border .15s;}
.appeal-item:hover{border-color:#c9a84c35;}
.appeal-item input{margin-top:2px;accent-color:#c9a84c;}
/* Sidebar */
.sidebar{background:#0a0a0c;padding:12px;overflow-y:auto;}
.statute-panel{margin-bottom:16px;background:#0f0f12;border:1px solid #c9a84c25;border-radius:2px;padding:10px;}
.statute-title{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#c9a84c;letter-spacing:2px;margin-bottom:8px;}
.statute-input{display:flex;gap:6px;}
.stat-in{flex:1;background:#131316;border:1px solid #252528;color:#c8c0b0;padding:5px 8px;border-radius:2px;font-family:'IBM Plex Mono',monospace;font-size:10px;outline:none;}
.stat-in:focus{border-color:#c9a84c40;}
.stat-btn{background:#171406;border:1px solid #c9a84c50;color:#c9a84c;padding:5px 9px;border-radius:2px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:12px;}
.stat-result{margin-top:8px;font-size:10px;color:#a09880;white-space:pre-wrap;max-height:200px;overflow-y:auto;line-height:1.6;}
.sb-sec{margin-bottom:16px;}
.sb-title{font-family:'IBM Plex Mono',monospace;font-size:7px;color:#c9a84c;letter-spacing:3px;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #c9a84c15;}
.sb-empty{font-size:10px;color:#444;font-style:italic;}
.sb-claim{padding:6px 0;border-bottom:1px solid #1a1a1e;}
.sbc-l{font-size:10px;color:#c8c0b0;line-height:1.3;}
.sbc-a{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#555;margin-top:1px;}
.log-e{padding:5px 0;border-bottom:1px solid #161618;}
.log-ph{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#c9a84c60;cursor:pointer;text-transform:uppercase;}
.log-ph:hover{color:#c9a84c;}
.log-prev{font-size:9px;color:#444;margin-top:2px;line-height:1.4;}
.log-txt{font-size:9px;color:#888;margin-top:4px;white-space:pre-wrap;max-height:150px;overflow-y:auto;background:#0a0a0c;padding:6px;border-radius:2px;line-height:1.5;}
.tl-mini{padding:4px 0;border-bottom:1px solid #161618;}
.tlm-d{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#c9a84c60;}
.tlm-e{font-size:9px;color:#888;line-height:1.4;margin-top:1px;}
@media(max-width:768px){.main{grid-template-columns:1fr}.sidebar{display:none}.grid2{grid-template-columns:1fr}}
`;
