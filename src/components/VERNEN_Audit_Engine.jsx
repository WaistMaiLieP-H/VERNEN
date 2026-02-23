import { useState, useRef } from "react";

const API_MODEL = "claude-sonnet-4-20250514";
const MCP_URL = "https://vernen-legal-mcp.onrender.com/mcp";

const DOC_TYPES = [
  { id: "motion", label: "Motion / OSC", soc: "CRC 3.1110; CCP § 1005; local court rules" },
  { id: "order", label: "Court Order", soc: "CCP § 664; CRC 3.1312; Fam. Code § 290" },
  { id: "declaration", label: "Declaration / Affidavit", soc: "CCP § 2015.5; Fam. Code § 105" },
  { id: "complaint", label: "Complaint / Petition", soc: "CCP § 425.10; CRC 2.111; FRCP 8" },
  { id: "dvro", label: "DVRO / Restraining Order", soc: "Fam. Code §§ 6300–6389; CRC 5.490" },
  { id: "custody_eval", label: "Custody Evaluation", soc: "Fam. Code § 3110; CRC 5.220; Evid. Code § 730" },
  { id: "police_report", label: "Police Report", soc: "Gov. Code § 6253; Pen. Code § 13515; POST guidelines" },
  { id: "transcript", label: "Court Transcript", soc: "CRC 8.130; Gov. Code § 69950; reporter certification" },
  { id: "agency_letter", label: "Agency Correspondence", soc: "Gov. Code §§ 11340–11529; SAM § 0120" },
  { id: "medical", label: "Medical Record", soc: "Health & Safety Code § 123111; HIPAA 45 CFR § 164" },
  { id: "insurance", label: "Insurance Document", soc: "Ins. Code § 790.03; CCR Title 10; Cal. Fair Claims Regs" },
  { id: "contract", label: "Contract / Agreement", soc: "Civ. Code §§ 1550–1701; UCC Article 2" },
];

const JURISDICTIONS = [
  "California State Court", "Federal — N.D. Cal.", "Federal — E.D. Cal.",
  "Federal — C.D. Cal.", "Federal — S.D. Cal.", "Alameda County", "Solano County",
  "Marin County", "Contra Costa County", "San Francisco County", "Sacramento County",
];

const SEVERITY = { Critical: "#c94a4a", Significant: "#c9884a", Advisory: "#c9c24a" };

async function streamClaude({ system, user, mcpEnabled, onToken, onDone, onError }) {
  try {
    const body = {
      model: API_MODEL,
      max_tokens: 1000,
      stream: true,
      system,
      messages: [{ role: "user", content: user }],
    };
    if (mcpEnabled) body.mcp_servers = [{ type: "url", url: MCP_URL, name: "vernen-legal-mcp" }];
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) { onError("API error " + res.status); return; }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", full = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n"); buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") continue;
        try {
          const evt = JSON.parse(raw);
          if (evt.type === "content_block_delta" && evt.delta?.text) {
            full += evt.delta.text; onToken(full);
          }
        } catch {}
      }
    }
    onDone(full);
  } catch (e) { onError(e.message); }
}

const AUDIT_SYSTEM = `You are the VERNEN™ Legal Audit Engine applying the Legal Standard of Creation (S.o.C.) methodology.

AUDIT PROTOCOL — EXECUTE IN ORDER:

SECTION A — LEGAL STANDARD OF CREATION (S.o.C.)
1. Identify governing jurisdiction, statute, and professional code
2. Classify as: Declared S.o.C. (explicit in document) or Inferred S.o.C. (derived from content/parties)
3. Flag if S.o.C. is absent or ambiguous — that itself is a defect

SECTION B — COMPLIANCE AUDIT (apply to every finding):
B1. S.o.C. CONFLICT CHECK: Identify provisions that violate the governing statute/regulation. Cite the specific document language + the violated code section.
B2. PROCEDURAL DEFECTS: Missing required elements (signatures, verification, service declarations, captions, etc.)
B3. INTERNAL INCONSISTENCIES: Contradictions within the document (dates, parties, facts, legal conclusions that conflict with stated facts)
B4. UNILATERAL BIAS / ASYMMETRY: One-sided characterizations, omitted exculpatory facts, false or misleading representations
B5. OMISSION OF STANDARD PROTECTIONS: Required notices, disclosures, rights advisements absent
B6. AUTHENTICITY / INTEGRITY FLAGS: Formatting anomalies, signature irregularities, metadata conflicts, chain of custody gaps

SECTION C — FINDINGS TABLE
Format each finding as:
[SEVERITY] | LOCATION | TYPE | FINDING | VIOLATED STANDARD

Severity levels: CRITICAL (invalidates document or constitutes fraud) | SIGNIFICANT (material defect affecting rights) | ADVISORY (procedural gap, correctable)

SECTION D — COMPLIANCE SCORE
X/100 with one-line basis. Below 70 = materially defective. Below 50 = potentially fraudulent or void.

SECTION E — RECOMMENDED ACTIONS
Numbered list. Specific. Actionable.

RULES:
- Every finding must cite specific document text AND violated standard
- No unsupported conclusions
- Prioritize findings by severity
- If using MCP tool results, integrate statutory text into findings`;

export default function AuditEngine() {
  const [docType, setDocType] = useState("motion");
  const [jurisdiction, setJurisdiction] = useState("California State Court");
  const [docText, setDocText] = useState("");
  const [context, setContext] = useState("");
  const [mcpEnabled, setMcpEnabled] = useState(true);
  const [auditOut, setAuditOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [statQuery, setStatQuery] = useState("");
  const [statOut, setStatOut] = useState("");
  const [statLoading, setStatLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("audit"); // audit | lookup | history
  const [charCount, setCharCount] = useState(0);

  const selectedType = DOC_TYPES.find(d => d.id === docType);

  const runAudit = async () => {
    if (!docText.trim()) return;
    setLoading(true);
    setAuditOut("");
    const user = `DOCUMENT TYPE: ${selectedType.label}
JURISDICTION: ${jurisdiction}
GOVERNING S.o.C.: ${selectedType.soc}
ADDITIONAL CONTEXT: ${context || "None provided"}

DOCUMENT TEXT:
${docText}`;
    await streamClaude({
      system: AUDIT_SYSTEM,
      user,
      mcpEnabled,
      onToken: t => setAuditOut(t),
      onDone: t => {
        setLoading(false);
        setHistory(h => [{ ts: new Date().toISOString(), docType: selectedType.label, jurisdiction, score: extractScore(t), preview: t.slice(0, 100), full: t }, ...h]);
      },
      onError: e => { setAuditOut("Error: " + e); setLoading(false); },
    });
  };

  const runStatLookup = async () => {
    if (!statQuery.trim()) return;
    setStatLoading(true);
    setStatOut("");
    await streamClaude({
      system: "You are a California/federal legal research assistant. Retrieve the exact statutory text requested, identify key subsections, effective date, and provide a one-paragraph application note for litigation use. If using MCP tools to look up the statute, integrate the retrieved text directly.",
      user: `Retrieve and explain: ${statQuery}`,
      mcpEnabled,
      onToken: t => setStatOut(t),
      onDone: () => setStatLoading(false),
      onError: e => { setStatOut("Error: " + e); setStatLoading(false); },
    });
  };

  const exportAudit = () => {
    if (!auditOut) return;
    const blob = new Blob([
      `VERNEN™ AUDIT ENGINE — REPORT\n${"═".repeat(60)}\nDocument Type: ${selectedType.label}\nJurisdiction: ${jurisdiction}\nGenerated: ${new Date().toLocaleString()}\nMCP Statutory Lookup: ${mcpEnabled ? "ACTIVE" : "INACTIVE"}\n${"═".repeat(60)}\n\n${auditOut}`
    ], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `VERNEN_Audit_${docType}_${Date.now()}.txt`; a.click();
  };

  const extractScore = (text) => {
    const m = text.match(/(\d{1,3})\/100/);
    return m ? parseInt(m[1]) : null;
  };

  const score = extractScore(auditOut);

  return (
    <div className="app">
      <style>{CSS}</style>
      <div className="header">
        <div>
          <div className="logo">VERNEN™</div>
          <div className="logo-sub">AUDIT ENGINE — DOCUMENT COMPLIANCE ANALYSIS</div>
        </div>
        <div className="h-right">
          <div className={`mcp-badge ${mcpEnabled ? "on" : "off"}`} onClick={() => setMcpEnabled(m => !m)} title="Toggle live MCP statutory lookup">
            {mcpEnabled ? "⬤" : "○"} MCP LIVE
          </div>
        </div>
      </div>

      <div className="tabs">
        {[["audit","⚖ AUDIT DOCUMENT"],["lookup","📖 STATUTE LOOKUP"],["history","🗂 AUDIT HISTORY"]].map(([id, label]) => (
          <button key={id} className={`tab ${activeTab===id?"on":""}`} onClick={() => setActiveTab(id)}>{label}</button>
        ))}
      </div>

      <div className="body">
        {activeTab === "audit" && (
          <div className="audit-layout">
            <div className="left-panel">
              <div className="panel-section">
                <label className="fl">DOCUMENT TYPE</label>
                <div className="doctype-grid">
                  {DOC_TYPES.map(d => (
                    <button key={d.id} className={`dt-btn ${docType===d.id?"on":""}`} onClick={() => setDocType(d.id)}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="panel-section">
                <label className="fl">JURISDICTION</label>
                <select className="sel" value={jurisdiction} onChange={e => setJurisdiction(e.target.value)}>
                  {JURISDICTIONS.map(j => <option key={j}>{j}</option>)}
                </select>
              </div>
              <div className="soc-display">
                <span className="soc-label">GOVERNING S.o.C.:</span>
                <span className="soc-val">{selectedType?.soc}</span>
              </div>
              <div className="panel-section">
                <label className="fl">ADDITIONAL CONTEXT (OPTIONAL)</label>
                <textarea className="ta sm" rows={2} value={context} onChange={e => setContext(e.target.value)}
                  placeholder="Case number, parties, known violations, relevant dates..." />
              </div>
              <div className="panel-section">
                <div className="doc-header">
                  <label className="fl">DOCUMENT TEXT</label>
                  <span className="char-ct">{charCount} chars</span>
                </div>
                <textarea className="ta lg" rows={16} value={docText}
                  onChange={e => { setDocText(e.target.value); setCharCount(e.target.value.length); }}
                  placeholder="Paste the full text of the document to audit..." />
              </div>
              <div className="action-row">
                <button className={`run-btn ${loading?"running":""}`} onClick={runAudit} disabled={loading || !docText.trim()}>
                  <span className={loading?"spin":""}>{loading ? "◌" : "▶"}</span>
                  {loading ? "AUDITING…" : "RUN S.o.C. AUDIT"}
                </button>
                <button className="clear-btn" onClick={() => { setDocText(""); setAuditOut(""); setCharCount(0); }}>✕ CLEAR</button>
                {auditOut && <button className="export-btn" onClick={exportAudit}>⬇ EXPORT</button>}
              </div>
            </div>

            <div className="right-panel">
              {!auditOut && !loading && (
                <div className="empty-state">
                  <div className="es-icon">⚖</div>
                  <div className="es-title">VERNEN™ AUDIT ENGINE</div>
                  <div className="es-body">Paste any legal document, select type and jurisdiction, then run the S.o.C. audit. The engine will identify procedural defects, internal inconsistencies, fraudulent characterizations, and compliance failures — each traced to a specific violated standard.</div>
                  <div className="es-features">
                    <div className="es-feat">✓ Legal Standard of Creation analysis</div>
                    <div className="es-feat">✓ Bias &amp; fraud pattern detection</div>
                    <div className="es-feat">✓ Procedural compliance check</div>
                    <div className="es-feat">✓ Live statutory lookup via MCP</div>
                    <div className="es-feat">✓ Compliance score /100</div>
                    <div className="es-feat">✓ Export audit report</div>
                  </div>
                </div>
              )}
              {(auditOut || loading) && (
                <div className="results">
                  <div className="results-header">
                    <div className="rh-left">
                      <span className="rh-label">AUDIT REPORT — {selectedType?.label.toUpperCase()}</span>
                      <span className="rh-jur">{jurisdiction}</span>
                    </div>
                    {score !== null && (
                      <div className={`score-badge ${score>=70?"pass":score>=50?"warn":"fail"}`}>
                        {score}/100
                      </div>
                    )}
                  </div>
                  <div className="results-body">
                    {auditOut.split("\n").map((line, i) => {
                      const isCrit = line.includes("CRITICAL");
                      const isSig = line.includes("SIGNIFICANT");
                      const isAdv = line.includes("ADVISORY");
                      const isHead = line.startsWith("SECTION") || line.startsWith("##") || /^[A-Z\s]{4,}:/.test(line);
                      return (
                        <div key={i} className={`line ${isCrit?"critical":isSig?"significant":isAdv?"advisory":isHead?"heading":""}`}>
                          {line || <br/>}
                        </div>
                      );
                    })}
                    {loading && <span className="cursor">▋</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "lookup" && (
          <div className="lookup-layout">
            <div className="lookup-panel">
              <div className="lu-title">LIVE STATUTORY LOOKUP</div>
              <div className="lu-desc">Retrieve exact statutory text from California and federal codes. {mcpEnabled ? "MCP live lookup active — pulling from leginfo.legislature.ca.gov." : "MCP disabled — using training data. Enable MCP for live text."}</div>
              <div className="lu-input-row">
                <input className="lu-input" value={statQuery} onChange={e => setStatQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && runStatLookup()}
                  placeholder="e.g. Fam. Code § 3421   |   CCP § 527   |   42 U.S.C. § 1983   |   18 U.S.C. § 1962" />
                <button className={`lu-btn ${statLoading?"running":""}`} onClick={runStatLookup} disabled={statLoading||!statQuery.trim()}>
                  <span className={statLoading?"spin":""}>{statLoading?"◌":"▶"}</span>
                </button>
              </div>
              <div className="lu-quick">
                <div className="lu-quick-label">QUICK ACCESS</div>
                <div className="lu-quick-grid">
                  {[["Fam. Code § 3421","UCCJEA — Home State"],["Fam. Code § 3428","UCCJEA — Unjustifiable Conduct"],["Fam. Code § 290","Contempt"],["Fam. Code § 271","Sanctions"],["CCP § 527","TRO Standard"],["CCP § 128.7","Frivolous Filing Sanctions"],["42 U.S.C. § 1983","Civil Rights"],["18 U.S.C. § 1962","RICO"],["Fam. Code § 6300","DVRO Authority"],["Ins. Code § 790.03","Insurance Bad Faith"]].map(([code, label]) => (
                    <button key={code} className="quick-btn" onClick={() => { setStatQuery(code); }}>
                      <span className="qb-code">{code}</span>
                      <span className="qb-label">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {statOut && (
              <div className="lu-result">
                <div className="lu-result-hdr">
                  <span>{statQuery}</span>
                  <button className="export-btn" onClick={() => {
                    const blob = new Blob([`VERNEN™ STATUTE LOOKUP\n${statQuery}\n\n${statOut}`], {type:"text/plain"});
                    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `VERNEN_Statute_${Date.now()}.txt`; a.click();
                  }}>⬇ TXT</button>
                </div>
                <div className="lu-result-body">{statOut}{statLoading && <span className="cursor">▋</span>}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="history-layout">
            <div className="hist-title">AUDIT HISTORY ({history.length})</div>
            {history.length === 0 && <div className="empty-msg">No audits run in this session.</div>}
            {history.map((h, i) => (
              <div key={i} className="hist-card">
                <div className="hc-top">
                  <div>
                    <div className="hc-type">{h.docType}</div>
                    <div className="hc-jur">{h.jurisdiction} · {new Date(h.ts).toLocaleTimeString()}</div>
                  </div>
                  {h.score !== null && (
                    <div className={`score-badge sm ${h.score>=70?"pass":h.score>=50?"warn":"fail"}`}>{h.score}/100</div>
                  )}
                </div>
                <div className="hc-preview">{h.preview}…</div>
                <button className="hc-expand" onClick={() => setAuditOut(h.full) || setActiveTab("audit")}>
                  VIEW FULL REPORT →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
.app{min-height:100vh;background:#0b0b0d;color:#c0b8a8;font-family:'IBM Plex Sans',sans-serif;font-size:13px;display:flex;flex-direction:column;}
.header{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;background:#090909;border-bottom:1px solid #c9a84c20;}
.logo{font-family:'Playfair Display',serif;font-size:20px;color:#c9a84c;letter-spacing:3px;}
.logo-sub{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#555;letter-spacing:3px;margin-top:2px;}
.h-right{display:flex;align-items:center;gap:12px;}
.mcp-badge{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:2px;padding:5px 10px;border-radius:2px;cursor:pointer;transition:all .2s;user-select:none;}
.mcp-badge.on{color:#6aba6a;border:1px solid #4a8a4a;background:#0a130a;}
.mcp-badge.off{color:#666;border:1px solid #333;background:#111;}
.tabs{display:flex;background:#0a0a0c;border-bottom:1px solid #1a1a1e;}
.tab{padding:10px 20px;background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:2px;color:#666;transition:all .2s;}
.tab:hover{color:#999;background:#111;}
.tab.on{color:#c9a84c;border-bottom-color:#c9a84c;background:#111108;}
.body{flex:1;overflow:hidden;}
.audit-layout{display:grid;grid-template-columns:380px 1fr;height:calc(100vh - 88px);}
.left-panel{padding:16px;overflow-y:auto;border-right:1px solid #1a1a1e;background:#0c0c0e;}
.right-panel{padding:16px;overflow-y:auto;}
.panel-section{margin-bottom:14px;}
.fl{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#c9a84c70;letter-spacing:2px;text-transform:uppercase;display:block;margin-bottom:6px;}
.doctype-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:4px;}
.dt-btn{padding:7px 8px;background:#131316;border:1px solid #222;border-radius:2px;cursor:pointer;font-size:10px;color:#888;text-align:left;transition:all .15s;line-height:1.3;}
.dt-btn:hover{border-color:#c9a84c30;color:#aaa;}
.dt-btn.on{background:#171406;border-color:#c9a84c60;color:#c9a84c;}
.sel{width:100%;background:#131316;border:1px solid #222;color:#c8c0b0;padding:7px 10px;border-radius:2px;font-family:'IBM Plex Mono',monospace;font-size:10px;outline:none;}
.soc-display{background:#111108;border:1px solid #c9a84c20;border-left:2px solid #c9a84c;padding:8px 12px;border-radius:2px;margin-bottom:14px;}
.soc-label{font-family:'IBM Plex Mono',monospace;font-size:7px;color:#c9a84c;letter-spacing:2px;display:block;margin-bottom:3px;}
.soc-val{font-size:10px;color:#a09060;line-height:1.5;}
.ta{width:100%;background:#111114;border:1px solid #1e1e22;color:#c8c0b0;padding:9px 11px;border-radius:2px;font-family:'IBM Plex Mono',monospace;font-size:11px;outline:none;resize:vertical;line-height:1.6;}
.ta:focus{border-color:#c9a84c35;}
.ta.sm{height:60px;resize:none;}
.ta.lg{min-height:280px;}
.doc-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
.char-ct{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#444;}
.action-row{display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap;}
.run-btn{display:flex;align-items:center;gap:8px;background:#171406;border:1px solid #c9a84c;color:#c9a84c;padding:9px 18px;border-radius:2px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:2px;transition:all .2s;}
.run-btn:hover:not(:disabled){background:#201a08;}
.run-btn:disabled{opacity:.4;cursor:not-allowed;}
.run-btn.running{border-color:#c9a84c70;}
.clear-btn,.export-btn{padding:7px 14px;border-radius:2px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:1px;transition:all .2s;}
.clear-btn{background:none;border:1px solid #333;color:#666;}
.clear-btn:hover{border-color:#ca7070;color:#ca7070;}
.export-btn{background:none;border:1px solid #c9a84c50;color:#c9a84c70;}
.export-btn:hover{border-color:#c9a84c;color:#c9a84c;}
.spin{display:inline-block;animation:spin 1s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:40px;}
.es-icon{font-size:40px;margin-bottom:16px;opacity:.4;}
.es-title{font-family:'Playfair Display',serif;font-size:18px;color:#c9a84c;letter-spacing:3px;margin-bottom:12px;}
.es-body{font-size:12px;color:#666;line-height:1.7;max-width:400px;margin-bottom:24px;}
.es-features{display:grid;grid-template-columns:1fr 1fr;gap:6px;text-align:left;}
.es-feat{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#5a8a5a;padding:5px 10px;background:#0a130a;border:1px solid #2a4a2a;border-radius:2px;}
.results{height:100%;}
.results-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #1a1a1e;}
.rh-label{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#c9a84c;letter-spacing:2px;display:block;margin-bottom:3px;}
.rh-jur{font-size:10px;color:#555;}
.score-badge{font-family:'IBM Plex Mono',monospace;font-size:18px;font-weight:500;padding:8px 14px;border-radius:3px;border:1px solid;}
.score-badge.pass{color:#6aba6a;background:#0a130a;border-color:#4a8a4a;}
.score-badge.warn{color:#c9a84c;background:#171406;border-color:#8a7030;}
.score-badge.fail{color:#ca6a6a;background:#180808;border-color:#8a4040;}
.score-badge.sm{font-size:13px;padding:5px 10px;}
.results-body{white-space:pre-wrap;line-height:1.8;font-size:12px;color:#a0998a;font-family:'IBM Plex Mono',monospace;}
.line{padding:1px 0;}
.line.critical{color:#c94a4a;font-weight:500;}
.line.significant{color:#c9884a;}
.line.advisory{color:#c9c24a;}
.line.heading{color:#c9a84c;font-weight:500;margin-top:10px;}
.cursor{animation:blink .8s step-end infinite;color:#c9a84c;}
@keyframes blink{50%{opacity:0;}}
.lookup-layout{padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:20px;height:calc(100vh - 88px);overflow-y:auto;}
.lookup-panel{}
.lu-title{font-family:'Playfair Display',serif;font-size:16px;color:#c9a84c;letter-spacing:2px;margin-bottom:8px;}
.lu-desc{font-size:11px;color:#666;line-height:1.6;margin-bottom:16px;}
.lu-input-row{display:flex;gap:8px;margin-bottom:20px;}
.lu-input{flex:1;background:#111114;border:1px solid #1e1e22;color:#c8c0b0;padding:9px 12px;border-radius:2px;font-family:'IBM Plex Mono',monospace;font-size:11px;outline:none;}
.lu-input:focus{border-color:#c9a84c35;}
.lu-btn{background:#171406;border:1px solid #c9a84c;color:#c9a84c;padding:9px 14px;border-radius:2px;cursor:pointer;font-size:14px;transition:all .2s;}
.lu-btn:hover:not(:disabled){background:#201a08;}
.lu-btn:disabled{opacity:.4;cursor:not-allowed;}
.lu-btn.running span{display:inline-block;animation:spin 1s linear infinite;}
.lu-quick-label{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#555;letter-spacing:2px;margin-bottom:8px;}
.lu-quick-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:5px;}
.quick-btn{display:flex;flex-direction:column;align-items:flex-start;padding:8px 10px;background:#111114;border:1px solid #1e1e22;border-radius:2px;cursor:pointer;transition:all .15s;text-align:left;gap:2px;}
.quick-btn:hover{border-color:#c9a84c35;background:#13130e;}
.qb-code{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#c9a84c;}
.qb-label{font-size:9px;color:#666;}
.lu-result{background:#0d0d10;border:1px solid #1e1e22;border-left:2px solid #c9a84c;border-radius:2px;overflow:hidden;max-height:calc(100vh - 150px);display:flex;flex-direction:column;}
.lu-result-hdr{display:flex;justify-content:space-between;align-items:center;padding:8px 14px;background:#111108;border-bottom:1px solid #1a1a1e;}
.lu-result-hdr span{font-family:'IBM Plex Mono',monospace;font-size:10px;color:#c9a84c;}
.lu-result-body{padding:14px;white-space:pre-wrap;line-height:1.75;font-size:11px;color:#a09880;font-family:'IBM Plex Mono',monospace;overflow-y:auto;flex:1;}
.history-layout{padding:20px;max-width:800px;overflow-y:auto;height:calc(100vh - 88px);}
.hist-title{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#c9a84c;letter-spacing:3px;margin-bottom:16px;}
.empty-msg{font-size:12px;color:#444;font-style:italic;}
.hist-card{background:#0f0f12;border:1px solid #1e1e22;border-radius:2px;padding:14px;margin-bottom:10px;}
.hc-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;}
.hc-type{font-size:13px;color:#c8c0b0;font-weight:500;}
.hc-jur{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#555;margin-top:2px;}
.hc-preview{font-size:11px;color:#777;line-height:1.5;margin-bottom:10px;font-family:'IBM Plex Mono',monospace;}
.hc-expand{background:none;border:1px solid #c9a84c40;color:#c9a84c70;padding:5px 12px;border-radius:2px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:1px;transition:all .2s;}
.hc-expand:hover{border-color:#c9a84c;color:#c9a84c;}
@media(max-width:768px){.audit-layout{grid-template-columns:1fr}.right-panel{border-top:1px solid #1a1a1e}.lookup-layout{grid-template-columns:1fr}}
`;
