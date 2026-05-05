import { useState, useEffect, useCallback, useRef } from "react";

const API_MODEL = "claude-sonnet-4-20250514";

// ─── LEGAL DATA ───────────────────────────────────────────────────────────────
const CAUSES_OF_ACTION = [
  { id: "custody_violation", label: "Custody Order Violation", category: "Family Law", auth: "Fam. Code § 3027, § 290" },
  { id: "uccjea_jurisdiction", label: "UCCJEA Jurisdictional Violation", category: "Family Law", auth: "Fam. Code §§ 3400–3465" },
  { id: "dvro_abuse", label: "DVRO Abuse / False Allegations", category: "Family Law", auth: "Fam. Code § 6380; CCP § 128.7" },
  { id: "contempt", label: "Contempt of Court Order", category: "Family Law", auth: "Fam. Code § 290; CCP § 1209" },
  { id: "civil_rights_1983", label: "42 U.S.C. § 1983 — Civil Rights", category: "Federal Civil Rights", auth: "42 U.S.C. § 1983" },
  { id: "due_process", label: "Substantive Due Process — Parental Rights", category: "Federal Civil Rights", auth: "14th Amend.; Troxel v. Granville" },
  { id: "conspiracy_1985", label: "42 U.S.C. § 1985 — Conspiracy", category: "Federal Civil Rights", auth: "42 U.S.C. § 1985(3)" },
  { id: "rico", label: "RICO — Pattern of Racketeering", category: "Federal Civil Rights", auth: "18 U.S.C. §§ 1961–1968" },
  { id: "fraud", label: "Fraud & Misrepresentation", category: "General Civil", auth: "Civ. Code § 1709; CACI 1900" },
  { id: "malicious_prosecution", label: "Malicious Prosecution", category: "General Civil", auth: "Civ. Code § 47.5; CACI 1500" },
  { id: "elder_abuse", label: "Elder/Dependent Adult Abuse", category: "General Civil", auth: "WIC § 15610 et seq." },
  { id: "insurance_bad_faith", label: "Insurance Bad Faith", category: "General Civil", auth: "Ins. Code § 790.03; Brandt v. Superior Court" },
];

const MOTIONS = [
  { id: "tro", label: "TRO / Preliminary Injunction", auth: "CCP § 527 / FRCP 65" },
  { id: "osc", label: "OSC re: Contempt", auth: "Fam. Code § 290; CCP § 1209" },
  { id: "osc_custody", label: "OSC re: Custody Modification", auth: "Fam. Code § 3087" },
  { id: "motion_quash", label: "Motion to Quash / Transfer Jurisdiction", auth: "CCP § 418.10; Fam. Code § 3427" },
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
  { id: "interrogatories", label: "Form / Special Interrogatories", limit: "35 special (CCP § 2030.030)" },
  { id: "rfa", label: "Request for Admissions", limit: "CCP § 2033.010" },
  { id: "rpd", label: "Request for Production of Documents", limit: "CCP § 2031.010" },
  { id: "deposition", label: "Deposition Notice", limit: "CCP § 2025.010" },
  { id: "subpoena", label: "Subpoena — Business Records", limit: "CCP § 1985.3" },
  { id: "expert", label: "Expert Witness Disclosure", limit: "CCP § 2034.210" },
];

const APPEAL_GROUNDS = [
  "Abuse of Discretion — Factual Findings Not Supported by Substantial Evidence",
  "Error of Law — Incorrect Legal Standard Applied",
  "Jurisdictional Defect — UCCJEA Violation",
  "Due Process Violation — Denial of Right to Be Heard",
  "Judicial Bias / Appearance of Impropriety",
  "Newly Discovered Evidence — CCP § 657(4)",
  "Ineffective Assistance / Conflict of Interest",
];

const PHASES = [
  { id: "setup", label: "Case Setup", icon: "⚖" },
  { id: "pleadings", label: "Pleadings", icon: "📋" },
  { id: "emergency", label: "Emergency Relief", icon: "🚨" },
  { id: "uccjea", label: "UCCJEA Analysis", icon: "🗺" },
  { id: "discovery", label: "Discovery", icon: "🔍" },
  { id: "motions", label: "Motions", icon: "📜" },
  { id: "contempt", label: "Contempt / OSC", icon: "⚡" },
  { id: "trial", label: "Trial", icon: "🏛" },
  { id: "verdict", label: "Verdict & Damages", icon: "💰" },
  { id: "appeal", label: "Appeal", icon: "📡" },
];

const LANGUAGES = ["English","Spanish","French","Portuguese","Mandarin","Cantonese","Vietnamese","Tagalog","Korean","Arabic","Russian","Punjabi","Hindi"];

// ─── STORAGE ─────────────────────────────────────────────────────────────────
async function saveCase(data) {
  try { await window.storage.set("vernen_sim_case", JSON.stringify(data)); } catch {}
}
async function loadCase() {
  try {
    const r = await window.storage.get("vernen_sim_case");
    return r ? JSON.parse(r.value) : null;
  } catch { return null; }
}

// ─── API ──────────────────────────────────────────────────────────────────────
async function callClaude(systemPrompt, userMessage, onStream) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: API_MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  const data = await response.json();
  const text = data.content?.map(b => b.text || "").join("") || "No response received.";
  return text;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function VERNENSimulator() {
  const [phase, setPhase] = useState("setup");
  const [lang, setLang] = useState("English");
  const [caseData, setCaseData] = useState({
    title: "",
    court: "",
    caseNo: "",
    petitioner: "Michael Vernen Thomas Hartmann",
    respondent: "",
    claims: [],
    facts: "",
    counties: [],
    childName: "",
    custodyOrder: "",
  });
  const [aiOutput, setAiOutput] = useState({});
  const [loading, setLoading] = useState({});
  const [motionSelected, setMotionSelected] = useState(null);
  const [discoverySelected, setDiscoverySelected] = useState([]);
  const [appealGrounds, setAppealGrounds] = useState([]);
  const [damages, setDamages] = useState({ compensatory: "", punitive: "", rico: false, fees: false });
  const [log, setLog] = useState([]);

  useEffect(() => {
    loadCase().then(d => { if (d) { setCaseData(d.caseData || caseData); setLog(d.log || []); }});
  }, []);

  const save = useCallback((data, newLog) => {
    saveCase({ caseData: data, log: newLog || log });
  }, [log]);

  const addLog = (entry) => {
    const newLog = [{ ts: new Date().toISOString(), ...entry }, ...log];
    setLog(newLog);
    save(caseData, newLog);
  };

  const run = async (key, system, user) => {
    setLoading(l => ({ ...l, [key]: true }));
    setAiOutput(o => ({ ...o, [key]: "" }));
    try {
      const result = await callClaude(system, user);
      setAiOutput(o => ({ ...o, [key]: result }));
      addLog({ phase, key, preview: result.slice(0, 80) });
    } catch (e) {
      setAiOutput(o => ({ ...o, [key]: "Error: " + e.message }));
    }
    setLoading(l => ({ ...l, [key]: false }));
  };

  const updateCase = (field, val) => {
    const updated = { ...caseData, [field]: val };
    setCaseData(updated);
    save(updated);
  };

  const toggleClaim = (id) => {
    const claims = caseData.claims.includes(id)
      ? caseData.claims.filter(c => c !== id)
      : [...caseData.claims, id];
    updateCase("claims", claims);
  };

  const selectedClaims = CAUSES_OF_ACTION.filter(c => caseData.claims.includes(c.id));

  // ─── PHASE RENDERS ──────────────────────────────────────────────────────────
  const renderSetup = () => (
    <div className="phase-content">
      <h2 className="phase-title">CASE SETUP</h2>
      <div className="grid-2">
        <Field label="Case Title" value={caseData.title} onChange={v => updateCase("title", v)} placeholder="In re the Marriage of Hartmann" />
        <Field label="Case Number" value={caseData.caseNo} onChange={v => updateCase("caseNo", v)} placeholder="XX-FL-XXXXXX" />
        <Field label="Court" value={caseData.court} onChange={v => updateCase("court", v)} placeholder="Alameda County Superior Court" />
        <Field label="Respondent" value={caseData.respondent} onChange={v => updateCase("respondent", v)} placeholder="Respondent full name" />
        <Field label="Child Name" value={caseData.childName} onChange={v => updateCase("childName", v)} placeholder="Cole" />
        <Field label="Existing Custody Order" value={caseData.custodyOrder} onChange={v => updateCase("custodyOrder", v)} placeholder="100% sole custody — Petitioner" />
      </div>
      <div className="field-full">
        <label className="field-label">Case Facts Summary</label>
        <textarea className="textarea" rows={5} value={caseData.facts}
          onChange={e => updateCase("facts", e.target.value)}
          placeholder="Summarize key facts: dates, orders violated, parties involved, jurisdictions..." />
      </div>
      <h3 className="section-sub">SELECT CAUSES OF ACTION</h3>
      {["Family Law","Federal Civil Rights","General Civil"].map(cat => (
        <div key={cat} className="claim-group">
          <div className="claim-cat">{cat}</div>
          <div className="claim-grid">
            {CAUSES_OF_ACTION.filter(c => c.category === cat).map(c => (
              <button key={c.id}
                className={`claim-btn ${caseData.claims.includes(c.id) ? "active" : ""}`}
                onClick={() => toggleClaim(c.id)}>
                <span className="claim-label">{c.label}</span>
                <span className="claim-auth">{c.auth}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <AIAction label="ANALYZE CASE THEORY" keyName="theory"
        onRun={() => run("theory",
          `You are a California litigation strategist. Respond in ${lang}. Be precise, cite specific statutes and case law.`,
          `Analyze the following case for legal theory strength, jurisdictional arguments, and strategic weaknesses:
PETITIONER: ${caseData.petitioner}
RESPONDENT: ${caseData.respondent}
COURT: ${caseData.court}
EXISTING ORDER: ${caseData.custodyOrder}
CLAIMS: ${selectedClaims.map(c => c.label).join(", ")}
FACTS: ${caseData.facts}`)}
        output={aiOutput.theory} loading={loading.theory} />
    </div>
  );

  const renderPleadings = () => (
    <div className="phase-content">
      <h2 className="phase-title">PLEADINGS</h2>
      <p className="phase-desc">Generate complaint drafts, responses, and caption pages.</p>
      <AIAction label="DRAFT COMPLAINT CAPTION" keyName="caption"
        onRun={() => run("caption",
          `You are a California court filing assistant. Respond in ${lang}. Generate properly formatted California superior court caption.`,
          `Generate a complaint caption for:
COURT: ${caseData.court}
CASE NO: ${caseData.caseNo}
PETITIONER: ${caseData.petitioner} (Pro Se)
RESPONDENT: ${caseData.respondent}
CAUSES OF ACTION: ${selectedClaims.map(c => c.label).join("; ")}`)}
        output={aiOutput.caption} loading={loading.caption} />
      <AIAction label="DRAFT VERIFIED COMPLAINT" keyName="complaint"
        onRun={() => run("complaint",
          `You are a California civil litigation attorney. Respond in ${lang}. Draft a verified complaint using numbered paragraphs, proper pleading format, and California Judicial Council requirements. Cite all applicable statutes.`,
          `Draft a verified complaint for:
PETITIONER: ${caseData.petitioner} (Pro Se)
RESPONDENT: ${caseData.respondent}
COURT: ${caseData.court}
FACTS: ${caseData.facts}
CLAIMS: ${selectedClaims.map(c => `${c.label} (${c.auth})`).join("\n")}`)}
        output={aiOutput.complaint} loading={loading.complaint} />
      <AIAction label="SIMULATE DEMURRER RESPONSE" keyName="demurrer"
        onRun={() => run("demurrer",
          `You are opposing counsel in a California civil case. Respond in ${lang}. Simulate a demurrer challenging the complaint on the strongest available grounds under CCP § 430.10.`,
          `Simulate a demurrer to this complaint:
CLAIMS: ${selectedClaims.map(c => c.label).join(", ")}
FACTS: ${caseData.facts}`)}
        output={aiOutput.demurrer} loading={loading.demurrer} />
    </div>
  );

  const renderEmergency = () => (
    <div className="phase-content">
      <h2 className="phase-title">EMERGENCY RELIEF</h2>
      <div className="info-box">
        <strong>TRO Standards:</strong> California: CCP § 527 — Irreparable harm + probability of success. Federal: FRCP 65 — Likelihood of success, irreparable injury, balance of equities, public interest.
      </div>
      <AIAction label="DRAFT TRO APPLICATION (CALIFORNIA)" keyName="tro_ca"
        onRun={() => run("tro_ca",
          `You are a California family law attorney. Respond in ${lang}. Draft a TRO application under CCP § 527 and Family Code provisions. Include all required elements for immediate temporary custody relief.`,
          `Draft a TRO application:
PETITIONER: ${caseData.petitioner}
RESPONDENT: ${caseData.respondent}
CHILD: ${caseData.childName}
EXISTING ORDER: ${caseData.custodyOrder}
FACTS: ${caseData.facts}`)}
        output={aiOutput.tro_ca} loading={loading.tro_ca} />
      <AIAction label="DRAFT PRELIMINARY INJUNCTION (FEDERAL)" keyName="tro_fed"
        onRun={() => run("tro_fed",
          `You are a federal civil rights attorney. Respond in ${lang}. Draft a motion for preliminary injunction under FRCP 65 for parental rights violations under 42 U.S.C. § 1983.`,
          `Draft a federal preliminary injunction motion:
PETITIONER: ${caseData.petitioner}
RESPONDENT: ${caseData.respondent}
CHILD: ${caseData.childName}
CLAIMS: ${selectedClaims.filter(c => c.category === "Federal Civil Rights").map(c => c.label).join(", ")}
FACTS: ${caseData.facts}`)}
        output={aiOutput.tro_fed} loading={loading.tro_fed} />
      <AIAction label="SIMULATE JUDGE RULING ON TRO" keyName="tro_ruling"
        onRun={() => run("tro_ruling",
          `You are a neutral California superior court judge. Respond in ${lang}. Issue a tentative ruling on the TRO application, applying the four-part balancing test. Be realistic about standards.`,
          `Issue a tentative ruling on this TRO:
PETITIONER: ${caseData.petitioner} — seeking return of child ${caseData.childName}
EXISTING ORDER: ${caseData.custodyOrder}
FACTS: ${caseData.facts}
CLAIMS: ${selectedClaims.map(c => c.label).join(", ")}`)}
        output={aiOutput.tro_ruling} loading={loading.tro_ruling} />
    </div>
  );

  const renderUCCJEA = () => (
    <div className="phase-content">
      <h2 className="phase-title">UCCJEA JURISDICTIONAL ANALYSIS</h2>
      <div className="info-box">
        <strong>Fam. Code §§ 3400–3465</strong> — Uniform Child Custody Jurisdiction and Enforcement Act governs which state/county has jurisdiction. Home state jurisdiction is primary; significant connection jurisdiction is secondary.
      </div>
      <div className="county-selector">
        <label className="field-label">Counties Involved</label>
        <div className="county-grid">
          {["Alameda","Solano","Marin","Contra Costa","San Francisco","Sacramento"].map(c => (
            <button key={c}
              className={`county-btn ${caseData.counties.includes(c) ? "active" : ""}`}
              onClick={() => {
                const updated = caseData.counties.includes(c)
                  ? caseData.counties.filter(x => x !== c)
                  : [...caseData.counties, c];
                updateCase("counties", updated);
              }}>{c}</button>
          ))}
        </div>
      </div>
      <AIAction label="UCCJEA JURISDICTION ANALYSIS" keyName="uccjea"
        onRun={() => run("uccjea",
          `You are a California UCCJEA expert. Respond in ${lang}. Analyze which court has proper jurisdiction under the UCCJEA. Cite Fam. Code §§ 3421, 3422, 3426, 3427. Address forum shopping if present.`,
          `Analyze UCCJEA jurisdiction:
COUNTIES INVOLVED: ${caseData.counties.join(", ")}
PETITIONER: ${caseData.petitioner} — home: Benicia (Solano County)
RESPONDENT: ${caseData.respondent} — filed DVRO in Marin County 7/17/2025
CHILD: ${caseData.childName} — taken from Benicia 7/13/2025
EXISTING ORDER: Alameda County — ${caseData.custodyOrder}
FACTS: ${caseData.facts}`)}
        output={aiOutput.uccjea} loading={loading.uccjea} />
      <AIAction label="DRAFT MOTION TO TRANSFER JURISDICTION" keyName="transfer"
        onRun={() => run("transfer",
          `You are a California family law attorney. Respond in ${lang}. Draft a motion to transfer/decline jurisdiction under Fam. Code § 3427 (inconvenient forum) and § 3428 (unjustifiable conduct).`,
          `Draft motion to transfer jurisdiction:
PETITIONER: ${caseData.petitioner}
HOME COURT: Alameda County Superior Court (original jurisdiction)
IMPROPER COURTS: ${caseData.counties.filter(c => c !== "Alameda").join(", ")}
CHILD: ${caseData.childName}
FACTS: ${caseData.facts}`)}
        output={aiOutput.transfer} loading={loading.transfer} />
    </div>
  );

  const renderDiscovery = () => (
    <div className="phase-content">
      <h2 className="phase-title">DISCOVERY</h2>
      <div className="discovery-grid">
        {DISCOVERY_TYPES.map(d => (
          <button key={d.id}
            className={`discovery-btn ${discoverySelected.includes(d.id) ? "active" : ""}`}
            onClick={() => setDiscoverySelected(prev =>
              prev.includes(d.id) ? prev.filter(x => x !== d.id) : [...prev, d.id]
            )}>
            <span className="disc-label">{d.label}</span>
            <span className="disc-limit">{d.limit}</span>
          </button>
        ))}
      </div>
      <AIAction label="GENERATE DISCOVERY PLAN" keyName="discovery_plan"
        onRun={() => run("discovery_plan",
          `You are a California civil litigation attorney. Respond in ${lang}. Create a strategic discovery plan with specific requests targeting the key evidence needed for the claims.`,
          `Generate discovery plan for:
SELECTED TOOLS: ${discoverySelected.join(", ")}
CLAIMS: ${selectedClaims.map(c => c.label).join(", ")}
RESPONDENT: ${caseData.respondent}
KEY ISSUES: ${caseData.facts}`)}
        output={aiOutput.discovery_plan} loading={loading.discovery_plan} />
      <AIAction label="DRAFT INTERROGATORIES" keyName="interrogatories"
        onRun={() => run("interrogatories",
          `You are a California civil litigation attorney. Respond in ${lang}. Draft targeted special interrogatories. Number each question. Stay within 35-question limit. Focus on facts needed to prove the claims.`,
          `Draft special interrogatories for:
PROPOUNDING PARTY: ${caseData.petitioner}
RESPONDING PARTY: ${caseData.respondent}
CLAIMS: ${selectedClaims.map(c => c.label).join(", ")}
KEY FACTS IN DISPUTE: ${caseData.facts}`)}
        output={aiOutput.interrogatories} loading={loading.interrogatories} />
    </div>
  );

  const renderMotions = () => (
    <div className="phase-content">
      <h2 className="phase-title">MOTION PRACTICE</h2>
      <div className="motion-grid">
        {MOTIONS.map(m => (
          <button key={m.id}
            className={`motion-btn ${motionSelected === m.id ? "active" : ""}`}
            onClick={() => setMotionSelected(motionSelected === m.id ? null : m.id)}>
            <span className="motion-label">{m.label}</span>
            <span className="motion-auth">{m.auth}</span>
          </button>
        ))}
      </div>
      {motionSelected && (
        <AIAction
          label={`DRAFT: ${MOTIONS.find(m => m.id === motionSelected)?.label.toUpperCase()}`}
          keyName={`motion_${motionSelected}`}
          onRun={() => {
            const m = MOTIONS.find(x => x.id === motionSelected);
            run(`motion_${motionSelected}`,
              `You are a California civil litigation attorney. Respond in ${lang}. Draft a complete, properly formatted motion. Include: Notice of Motion, Memorandum of Points and Authorities, and proposed Order. Cite all applicable statutes and case law.`,
              `Draft a ${m.label} (${m.auth}):
MOVING PARTY: ${caseData.petitioner} (Pro Se)
OPPOSING PARTY: ${caseData.respondent}
COURT: ${caseData.court}
CASE NO: ${caseData.caseNo}
FACTS: ${caseData.facts}
CLAIMS: ${selectedClaims.map(c => c.label).join(", ")}`);
          }}
          output={aiOutput[`motion_${motionSelected}`]}
          loading={loading[`motion_${motionSelected}`]} />
      )}
      <AIAction label="SIMULATE OPPOSITION ARGUMENT" keyName="opposition"
        onRun={() => run("opposition",
          `You are opposing counsel in a California civil case. Respond in ${lang}. Draft the strongest possible opposition to the selected motion. Identify procedural defects and substantive weaknesses.`,
          `Draft opposition to ${MOTIONS.find(m => m.id === motionSelected)?.label || "motion"}:
RESPONDENT: ${caseData.respondent}
FACTS: ${caseData.facts}`)}
        output={aiOutput.opposition} loading={loading.opposition} />
    </div>
  );

  const renderContempt = () => (
    <div className="phase-content">
      <h2 className="phase-title">CONTEMPT / OSC PROCEEDINGS</h2>
      <div className="info-box">
        <strong>Fam. Code § 290; CCP § 1209</strong> — Contempt requires: (1) valid order, (2) knowledge of order, (3) willful violation. Penalty: up to 5 days jail and/or $1,000 fine per count.
      </div>
      <AIAction label="DRAFT OSC RE: CONTEMPT" keyName="contempt_osc"
        onRun={() => run("contempt_osc",
          `You are a California family law attorney. Respond in ${lang}. Draft a complete OSC re Contempt under Fam. Code § 290 and CCP § 1209. List each act of contempt as a separate count. Include declaration in support.`,
          `Draft OSC re Contempt:
PETITIONER: ${caseData.petitioner}
RESPONDENT: ${caseData.respondent}
CHILD: ${caseData.childName}
VIOLATED ORDER: ${caseData.custodyOrder}
COURT: ${caseData.court}
SPECIFIC VIOLATIONS: ${caseData.facts}`)}
        output={aiOutput.contempt_osc} loading={loading.contempt_osc} />
      <AIAction label="SIMULATE CONTEMPT HEARING" keyName="contempt_hearing"
        onRun={() => run("contempt_hearing",
          `You are a California family court judge presiding over a contempt hearing. Respond in ${lang}. Simulate the hearing with questions, rulings on objections, and a final contempt finding or denial. Be realistic.`,
          `Simulate contempt hearing:
MOVING PARTY: ${caseData.petitioner}
RESPONDENT: ${caseData.respondent}
ALLEGED VIOLATIONS: ${caseData.facts}
EXISTING ORDER: ${caseData.custodyOrder}`)}
        output={aiOutput.contempt_hearing} loading={loading.contempt_hearing} />
      <AIAction label="CALCULATE CONTEMPT PENALTIES" keyName="contempt_penalty"
        onRun={() => run("contempt_penalty",
          `You are a California family law attorney. Respond in ${lang}. Calculate maximum contempt penalties, attorney fees under Fam. Code § 271, and any compensatory damages available.`,
          `Calculate penalties:
FACTS/VIOLATIONS: ${caseData.facts}
EXISTING ORDER: ${caseData.custodyOrder}`)}
        output={aiOutput.contempt_penalty} loading={loading.contempt_penalty} />
    </div>
  );

  const renderTrial = () => (
    <div className="phase-content">
      <h2 className="phase-title">TRIAL SIMULATION</h2>
      <AIAction label="OPENING STATEMENT" keyName="opening"
        onRun={() => run("opening",
          `You are a California trial attorney. Respond in ${lang}. Draft a compelling opening statement for a bench trial. Lead with the strongest facts, establish credibility, preview the evidence.`,
          `Draft opening statement:
CLIENT: ${caseData.petitioner} (Pro Se)
COURT: ${caseData.court}
CLAIMS: ${selectedClaims.map(c => c.label).join(", ")}
FACTS: ${caseData.facts}`)}
        output={aiOutput.opening} loading={loading.opening} />
      <AIAction label="DIRECT EXAMINATION — PETITIONER" keyName="direct"
        onRun={() => run("direct",
          `You are a California trial attorney. Respond in ${lang}. Draft a direct examination outline for the petitioner. Use open-ended questions. Organize chronologically. Anticipate key facts needed for each claim.`,
          `Draft direct examination:
WITNESS: ${caseData.petitioner}
CLAIMS TO PROVE: ${selectedClaims.map(c => c.label).join(", ")}
KEY FACTS: ${caseData.facts}`)}
        output={aiOutput.direct} loading={loading.direct} />
      <AIAction label="SIMULATE CROSS-EXAMINATION" keyName="cross"
        onRun={() => run("cross",
          `You are opposing counsel in a California bench trial. Respond in ${lang}. Draft a cross-examination targeting credibility, inconsistencies, and weaknesses in the petitioner's case.`,
          `Draft cross-examination:
WITNESS: ${caseData.petitioner}
FACTS CLAIMED: ${caseData.facts}`)}
        output={aiOutput.cross} loading={loading.cross} />
      <AIAction label="CLOSING ARGUMENT" keyName="closing"
        onRun={() => run("closing",
          `You are a California trial attorney. Respond in ${lang}. Draft a closing argument synthesizing the evidence, applying the law to facts, and requesting specific relief.`,
          `Draft closing argument:
PETITIONER: ${caseData.petitioner}
CLAIMS: ${selectedClaims.map(c => c.label).join(", ")}
RELIEF SOUGHT: Full enforcement of custody order, return of ${caseData.childName}, sanctions
FACTS PROVEN: ${caseData.facts}`)}
        output={aiOutput.closing} loading={loading.closing} />
    </div>
  );

  const renderVerdict = () => {
    const comp = parseFloat(damages.compensatory) || 0;
    const pun = parseFloat(damages.punitive) || 0;
    const rico_total = damages.rico ? comp * 3 : 0;
    const total = comp + pun + rico_total + (damages.fees ? 50000 : 0);
    return (
      <div className="phase-content">
        <h2 className="phase-title">VERDICT & DAMAGES</h2>
        <div className="damages-grid">
          <div className="damage-field">
            <label className="field-label">Compensatory Damages ($)</label>
            <input className="input" type="number" value={damages.compensatory}
              onChange={e => setDamages(d => ({ ...d, compensatory: e.target.value }))} />
          </div>
          <div className="damage-field">
            <label className="field-label">Punitive Damages ($)</label>
            <input className="input" type="number" value={damages.punitive}
              onChange={e => setDamages(d => ({ ...d, punitive: e.target.value }))} />
          </div>
          <label className="checkbox-field">
            <input type="checkbox" checked={damages.rico}
              onChange={e => setDamages(d => ({ ...d, rico: e.target.checked }))} />
            <span>RICO Treble Damages (18 U.S.C. § 1964(c)) — ×3 compensatory</span>
          </label>
          <label className="checkbox-field">
            <input type="checkbox" checked={damages.fees}
              onChange={e => setDamages(d => ({ ...d, fees: e.target.checked }))} />
            <span>Attorney Fees (42 U.S.C. § 1988 / CCP § 1021.5)</span>
          </label>
        </div>
        <div className="damage-total">
          <div className="total-row"><span>Compensatory</span><span>${comp.toLocaleString()}</span></div>
          {damages.rico && <div className="total-row rico"><span>RICO Treble</span><span>+${rico_total.toLocaleString()}</span></div>}
          <div className="total-row"><span>Punitive</span><span>+${pun.toLocaleString()}</span></div>
          {damages.fees && <div className="total-row"><span>Est. Attorney Fees</span><span>+$50,000</span></div>}
          <div className="total-row grand"><span>TOTAL EXPOSURE</span><span>${total.toLocaleString()}</span></div>
        </div>
        <AIAction label="SIMULATE VERDICT" keyName="verdict"
          onRun={() => run("verdict",
            `You are a California superior court judge issuing a verdict after bench trial. Respond in ${lang}. Issue a detailed verdict finding on each claim with factual and legal basis. Calculate damages.`,
            `Issue verdict:
PETITIONER: ${caseData.petitioner}
RESPONDENT: ${caseData.respondent}
CLAIMS: ${selectedClaims.map(c => c.label).join(", ")}
FACTS: ${caseData.facts}
COMPENSATORY: $${comp.toLocaleString()}
PUNITIVE: $${pun.toLocaleString()}
RICO APPLICABLE: ${damages.rico}
FEE SHIFTING: ${damages.fees}`)}
          output={aiOutput.verdict} loading={loading.verdict} />
      </div>
    );
  };

  const renderAppeal = () => (
    <div className="phase-content">
      <h2 className="phase-title">APPELLATE PROCEEDINGS</h2>
      <div className="info-box">
        <strong>Cal. Rules of Court, rule 8.104</strong> — Notice of appeal must be filed within 60 days of entry of judgment. Federal: FRAP 4 — 30 days (60 days if USA is party).
      </div>
      <div className="appeal-grounds">
        <label className="field-label">SELECT GROUNDS FOR APPEAL</label>
        {APPEAL_GROUNDS.map((g, i) => (
          <label key={i} className="appeal-ground">
            <input type="checkbox"
              checked={appealGrounds.includes(i)}
              onChange={() => setAppealGrounds(prev =>
                prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
              )} />
            <span>{g}</span>
          </label>
        ))}
      </div>
      <AIAction label="DRAFT NOTICE OF APPEAL" keyName="notice_appeal"
        onRun={() => run("notice_appeal",
          `You are a California appellate attorney. Respond in ${lang}. Draft a notice of appeal with designation of record.`,
          `Draft notice of appeal:
APPELLANT: ${caseData.petitioner}
RESPONDENT: ${caseData.respondent}
COURT: ${caseData.court}
CASE NO: ${caseData.caseNo}
GROUNDS: ${appealGrounds.map(i => APPEAL_GROUNDS[i]).join("; ")}`)}
        output={aiOutput.notice_appeal} loading={loading.notice_appeal} />
      <AIAction label="DRAFT APPELLATE BRIEF" keyName="app_brief"
        onRun={() => run("app_brief",
          `You are a California appellate attorney. Respond in ${lang}. Draft an appellate brief with: Table of Contents, Table of Authorities, Introduction, Statement of Facts, Issues Presented, Argument (with standard of review for each issue), and Conclusion.`,
          `Draft appellate brief:
APPELLANT: ${caseData.petitioner}
RESPONDENT: ${caseData.respondent}
GROUNDS: ${appealGrounds.map(i => APPEAL_GROUNDS[i]).join("; ")}
FACTS: ${caseData.facts}
CLAIMS: ${selectedClaims.map(c => c.label).join(", ")}`)}
        output={aiOutput.app_brief} loading={loading.app_brief} />
      <AIAction label="SIMULATE APPELLATE ARGUMENT" keyName="app_argument"
        onRun={() => run("app_argument",
          `You are a panel of three California Court of Appeal justices. Respond in ${lang}. Simulate the oral argument with pointed questions to both sides. Issue a tentative disposition.`,
          `Simulate appellate oral argument:
APPELLANT: ${caseData.petitioner}
GROUNDS: ${appealGrounds.map(i => APPEAL_GROUNDS[i]).join("; ")}
FACTS: ${caseData.facts}`)}
        output={aiOutput.app_argument} loading={loading.app_argument} />
    </div>
  );

  const phaseRender = {
    setup: renderSetup,
    pleadings: renderPleadings,
    emergency: renderEmergency,
    uccjea: renderUCCJEA,
    discovery: renderDiscovery,
    motions: renderMotions,
    contempt: renderContempt,
    trial: renderTrial,
    verdict: renderVerdict,
    appeal: renderAppeal,
  };

  return (
    <div className="app">
      <style>{CSS}</style>
      <div className="header">
        <div className="header-left">
          <div className="logo">VERNEN™</div>
          <div className="logo-sub">CIVIL SUIT SIMULATOR v6</div>
        </div>
        <div className="header-right">
          <select className="lang-select" value={lang} onChange={e => setLang(e.target.value)}>
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
          <div className="case-badge">{caseData.caseNo || "NO CASE #"}</div>
        </div>
      </div>
      <div className="nav">
        {PHASES.map(p => (
          <button key={p.id}
            className={`nav-btn ${phase === p.id ? "active" : ""}`}
            onClick={() => setPhase(p.id)}>
            <span className="nav-icon">{p.icon}</span>
            <span className="nav-label">{p.label}</span>
          </button>
        ))}
      </div>
      <div className="main">
        <div className="content">
          {phaseRender[phase]?.()}
        </div>
        <div className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-title">ACTIVE CLAIMS</div>
            {selectedClaims.length === 0
              ? <div className="sidebar-empty">No claims selected</div>
              : selectedClaims.map(c => (
                <div key={c.id} className="sidebar-claim">
                  <div className="sc-label">{c.label}</div>
                  <div className="sc-auth">{c.auth}</div>
                </div>
              ))}
          </div>
          <div className="sidebar-section">
            <div className="sidebar-title">ACTIVITY LOG</div>
            {log.length === 0
              ? <div className="sidebar-empty">No activity yet</div>
              : log.slice(0, 8).map((l, i) => (
                <div key={i} className="log-entry">
                  <div className="log-phase">{l.phase} › {l.key}</div>
                  <div className="log-preview">{l.preview}…</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <input className="input" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function AIAction({ label, keyName, onRun, output, loading }) {
  return (
    <div className="ai-action">
      <button className={`run-btn ${loading ? "running" : ""}`} onClick={onRun} disabled={loading}>
        {loading ? <span className="spinner">◌</span> : "▶"}
        {label}
      </button>
      {output && (
        <div className="ai-output">
          <div className="ai-output-header">AI ANALYSIS</div>
          <div className="ai-output-body">{output}</div>
        </div>
      )}
    </div>
  );
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .app {
    min-height: 100vh;
    background: #0d0d0f;
    color: #c8c0b0;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 13px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid #c9a84c30;
    background: #0a0a0c;
  }

  .logo {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    font-weight: 700;
    color: #c9a84c;
    letter-spacing: 3px;
  }

  .logo-sub {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    color: #666;
    letter-spacing: 4px;
    margin-top: 2px;
  }

  .header-right { display: flex; align-items: center; gap: 12px; }

  .lang-select {
    background: #1a1a1e;
    border: 1px solid #c9a84c40;
    color: #c9a84c;
    padding: 5px 10px;
    border-radius: 3px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    cursor: pointer;
  }

  .case-badge {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: #666;
    border: 1px solid #333;
    padding: 4px 10px;
    border-radius: 3px;
  }

  .nav {
    display: flex;
    overflow-x: auto;
    border-bottom: 1px solid #1e1e22;
    background: #0c0c0e;
    scrollbar-width: none;
  }

  .nav-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 16px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
    gap: 3px;
    min-width: 80px;
  }

  .nav-btn:hover { background: #161618; }
  .nav-btn.active { border-bottom-color: #c9a84c; background: #13130f; }

  .nav-icon { font-size: 16px; }

  .nav-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8px;
    color: #888;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .nav-btn.active .nav-label { color: #c9a84c; }

  .main {
    display: grid;
    grid-template-columns: 1fr 240px;
    min-height: calc(100vh - 100px);
  }

  .content {
    padding: 24px;
    overflow-y: auto;
    border-right: 1px solid #1e1e22;
  }

  .phase-content { max-width: 800px; }

  .phase-title {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    color: #c9a84c;
    letter-spacing: 3px;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #c9a84c30;
  }

  .phase-desc {
    color: #666;
    margin-bottom: 20px;
    font-size: 12px;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 16px;
  }

  .field { display: flex; flex-direction: column; gap: 5px; }
  .field-full { margin-bottom: 20px; }

  .field-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    color: #c9a84c90;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 4px;
    display: block;
  }

  .input, .textarea {
    background: #131316;
    border: 1px solid #2a2a2e;
    color: #c8c0b0;
    padding: 8px 12px;
    border-radius: 3px;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 12px;
    outline: none;
    transition: border 0.2s;
    width: 100%;
  }

  .input:focus, .textarea:focus { border-color: #c9a84c50; }
  .textarea { resize: vertical; }

  .section-sub {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: #c9a84c;
    letter-spacing: 3px;
    margin: 24px 0 12px;
  }

  .claim-group { margin-bottom: 20px; }

  .claim-cat {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    color: #555;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 8px;
    padding-left: 2px;
  }

  .claim-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 6px;
  }

  .claim-btn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 10px 12px;
    background: #131316;
    border: 1px solid #2a2a2e;
    border-radius: 3px;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
    gap: 3px;
  }

  .claim-btn:hover { border-color: #c9a84c40; }
  .claim-btn.active { background: #1a1707; border-color: #c9a84c; }

  .claim-label {
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 11px;
    color: #c8c0b0;
    line-height: 1.3;
  }

  .claim-btn.active .claim-label { color: #e8d080; }

  .claim-auth {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    color: #555;
  }

  .claim-btn.active .claim-auth { color: #c9a84c80; }

  .ai-action { margin-top: 20px; }

  .run-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #1a1707;
    border: 1px solid #c9a84c;
    color: #c9a84c;
    padding: 10px 20px;
    border-radius: 3px;
    cursor: pointer;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    letter-spacing: 2px;
    transition: all 0.2s;
  }

  .run-btn:hover:not(:disabled) { background: #221d08; }
  .run-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .run-btn.running { border-color: #c9a84c80; }

  .spinner {
    display: inline-block;
    animation: spin 1s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .ai-output {
    margin-top: 12px;
    background: #0f0f12;
    border: 1px solid #1e1e22;
    border-left: 2px solid #c9a84c;
    border-radius: 3px;
    overflow: hidden;
  }

  .ai-output-header {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8px;
    color: #c9a84c;
    letter-spacing: 3px;
    padding: 6px 12px;
    background: #13130f;
    border-bottom: 1px solid #1e1e22;
  }

  .ai-output-body {
    padding: 14px;
    white-space: pre-wrap;
    line-height: 1.7;
    font-size: 12px;
    color: #b0a890;
    max-height: 500px;
    overflow-y: auto;
  }

  .info-box {
    background: #13130f;
    border: 1px solid #c9a84c30;
    border-left: 3px solid #c9a84c;
    padding: 12px 16px;
    margin-bottom: 20px;
    border-radius: 3px;
    font-size: 12px;
    line-height: 1.6;
    color: #a09880;
  }

  .info-box strong { color: #c9a84c; }

  .county-grid, .discovery-grid, .motion-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 6px;
    margin-bottom: 20px;
  }

  .county-btn, .discovery-btn, .motion-btn {
    padding: 8px 12px;
    background: #131316;
    border: 1px solid #2a2a2e;
    border-radius: 3px;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .county-btn:hover, .discovery-btn:hover, .motion-btn:hover { border-color: #c9a84c40; }
  .county-btn.active, .discovery-btn.active, .motion-btn.active {
    background: #1a1707;
    border-color: #c9a84c;
    color: #e8d080;
  }

  .county-btn {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: #c8c0b0;
  }

  .disc-label, .motion-label {
    font-size: 11px;
    color: #c8c0b0;
    line-height: 1.3;
  }

  .disc-limit, .motion-auth {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    color: #555;
  }

  .damages-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 20px;
  }

  .damage-field { display: flex; flex-direction: column; gap: 5px; }

  .checkbox-field {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
    font-size: 12px;
    color: #a09880;
    padding: 10px;
    background: #131316;
    border: 1px solid #2a2a2e;
    border-radius: 3px;
    grid-column: 1 / -1;
  }

  .checkbox-field input { margin-top: 2px; accent-color: #c9a84c; }

  .damage-total {
    background: #0f0f12;
    border: 1px solid #c9a84c30;
    border-radius: 3px;
    padding: 16px;
    margin-bottom: 20px;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px solid #1e1e22;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
  }

  .total-row.rico { color: #e8a84c; }
  .total-row.grand {
    font-size: 14px;
    font-weight: 600;
    color: #c9a84c;
    border-bottom: none;
    margin-top: 6px;
    padding-top: 10px;
    border-top: 1px solid #c9a84c30;
  }

  .appeal-grounds { margin-bottom: 20px; }

  .appeal-ground {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 14px;
    background: #131316;
    border: 1px solid #2a2a2e;
    border-radius: 3px;
    margin-bottom: 6px;
    cursor: pointer;
    font-size: 12px;
    color: #a09880;
    transition: all 0.2s;
  }

  .appeal-ground:hover { border-color: #c9a84c40; }
  .appeal-ground input { margin-top: 2px; accent-color: #c9a84c; }

  .county-selector { margin-bottom: 20px; }

  /* Sidebar */
  .sidebar { background: #0a0a0c; padding: 16px; overflow-y: auto; }

  .sidebar-section { margin-bottom: 24px; }

  .sidebar-title {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8px;
    color: #c9a84c;
    letter-spacing: 3px;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid #c9a84c20;
  }

  .sidebar-empty {
    font-size: 11px;
    color: #444;
    font-style: italic;
  }

  .sidebar-claim {
    padding: 8px 0;
    border-bottom: 1px solid #1e1e22;
  }

  .sc-label { font-size: 11px; color: #c8c0b0; line-height: 1.3; }
  .sc-auth {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    color: #555;
    margin-top: 2px;
  }

  .log-entry {
    padding: 6px 0;
    border-bottom: 1px solid #1a1a1e;
  }

  .log-phase {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    color: #c9a84c70;
    text-transform: uppercase;
  }

  .log-preview {
    font-size: 10px;
    color: #555;
    margin-top: 2px;
    line-height: 1.4;
  }

  @media (max-width: 768px) {
    .main { grid-template-columns: 1fr; }
    .sidebar { display: none; }
    .grid-2 { grid-template-columns: 1fr; }
    .damages-grid { grid-template-columns: 1fr; }
  }
`;
