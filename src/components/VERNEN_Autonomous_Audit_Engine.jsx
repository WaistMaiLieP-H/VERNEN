import { useState, useRef, useCallback } from "react";
import { exportAuditReport } from "./exportAuditReport.js";

const MODEL = "claude-sonnet-4-20250514";
const MCP_URL = "https://vernen-legal-mcp.onrender.com/mcp";

// ─── PIPELINE DEFINITION ─────────────────────────────────────────────────────
// Each pass receives outputs from all prior passes
const PIPELINE = [
  {
    id: "soc",
    label: "S.o.C. IDENTIFICATION",
    icon: "⊕",
    description: "Identify governing standard, jurisdiction, document type",
    color: "#4a90d9",
    system: `You are the VERNEN Legal Classification Engine. Your ONLY job is to identify and structure the Legal Standard of Creation (S.o.C.) for the submitted document.

Output as structured JSON only — no prose. Format:
{
  "docType": "motion|order|declaration|complaint|dvro|custody_eval|police_report|transcript|agency_letter|medical|insurance|contract|other",
  "docTypeLabel": "Human-readable label",
  "socSource": "Declared|Inferred|Ambiguous",
  "jurisdiction": "specific jurisdiction identified",
  "governingStatutes": ["list of statutes that govern this document type"],
  "governingBody": "court/agency/body that created this document",
  "parties": {"creator": "who created it", "subject": "who it acts upon"},
  "dateIssued": "date if found, else null",
  "caseNo": "case number if found, else null",
  "flags": ["list of any immediate classification concerns"],
  "socStatement": "one complete sentence declaring the governing S.o.C."
}`,
    buildPrompt: (doc, _prior) => `DOCUMENT:\n${doc}`,
    useMCP: false,
    parseJSON: true,
  },
  {
    id: "statute",
    label: "STATUTORY RETRIEVAL",
    icon: "📖",
    description: "Live lookup of governing statutes via MCP",
    color: "#c9a84c",
    system: `You are a California/federal legal research engine with access to live statutory databases. Retrieve the exact text and key provisions of the statutes identified as governing this document. For each statute: provide the section title, key subsections relevant to compliance requirements, and the specific elements required for a valid document of this type. Be precise — these provisions will be used as the compliance benchmark for auditing.`,
    buildPrompt: (_doc, prior) => {
      const soc = prior.soc?.parsed;
      return `Retrieve and summarize the compliance requirements from these governing statutes:
${(soc?.governingStatutes || []).join("\n")}

Document type: ${soc?.docTypeLabel || "Unknown"}
Jurisdiction: ${soc?.jurisdiction || "California"}
Focus on: required elements, mandatory provisions, procedural requirements, signature/verification requirements, service requirements.`;
    },
    useMCP: true,
    parseJSON: false,
  },
  {
    id: "procedural",
    label: "PROCEDURAL COMPLIANCE",
    icon: "✓",
    description: "Check required elements, formatting, signatures, service",
    color: "#8a6aba",
    system: `You are a California court clerk and procedural compliance auditor with 20 years experience. You check documents for procedural defects only — not substantive merit.

Check for:
1. Required caption elements (CRC 2.111 or FRCP 10)
2. Mandatory verification/declaration under penalty of perjury (CCP § 2015.5)
3. Signature requirements — who must sign and in what capacity
4. Service requirements — proof of service, proper method, timing
5. Mandatory attachments — what must accompany this document type
6. Format compliance — margins, font, line numbering if required
7. Filing deadlines — is there evidence this was timely filed
8. Mandatory notices — statutory notice requirements met

Output as JSON array of findings:
[{
  "id": "P-001",
  "severity": "Critical|Significant|Advisory",
  "location": "specific section or element",
  "defect": "description of the procedural defect",
  "violated": "specific statute/rule violated",
  "effect": "legal consequence of this defect"
}]`,
    buildPrompt: (doc, prior) => {
      const soc = prior.soc?.parsed;
      const statutes = prior.statute?.text || "";
      return `DOCUMENT TYPE: ${soc?.docTypeLabel}
GOVERNING S.o.C.: ${soc?.socStatement}
STATUTORY REQUIREMENTS:\n${statutes.slice(0, 800)}

DOCUMENT TO AUDIT:\n${doc}`;
    },
    useMCP: false,
    parseJSON: true,
  },
  {
    id: "substance",
    label: "SUBSTANTIVE AUDIT",
    icon: "⚖",
    description: "S.o.C. conflict, internal inconsistencies, omissions",
    color: "#c9884a",
    system: `You are a California litigation attorney conducting a substantive document audit. You examine documents for:

1. S.o.C. CONFLICT: Claims, orders, or provisions that violate the governing statute
2. INTERNAL INCONSISTENCY: Facts, dates, parties, or legal conclusions that contradict each other within the document
3. FACTUAL MISREPRESENTATION: Statements that appear false, misleading, or materially incomplete based on internal evidence
4. LEGAL ERROR: Incorrect application of law — wrong standard, wrong burden, wrong elements
5. JURISDICTIONAL DEFECT: Court lacks authority; venue improper; UCCJEA violation if custody matter
6. OMISSIONS: Required disclosures, findings, or legal elements that are absent

Output as JSON array:
[{
  "id": "S-001",
  "severity": "Critical|Significant|Advisory",
  "type": "SoC_Conflict|Internal_Inconsistency|Misrepresentation|Legal_Error|Jurisdictional_Defect|Omission",
  "location": "specific section, paragraph, or sentence",
  "finding": "precise description of the substantive defect",
  "evidence": "exact quote or reference from document",
  "violated": "statute, rule, or standard violated",
  "effect": "legal consequence or prejudicial effect"
}]`,
    buildPrompt: (doc, prior) => {
      const soc = prior.soc?.parsed;
      const proc = prior.procedural?.parsed || [];
      const criticalProc = proc.filter(f => f.severity === "Critical").map(f => f.defect).join("; ");
      return `DOCUMENT TYPE: ${soc?.docTypeLabel}
S.o.C.: ${soc?.socStatement}
JURISDICTION: ${soc?.jurisdiction}
KNOWN PROCEDURAL DEFECTS: ${criticalProc || "None critical yet"}

DOCUMENT:\n${doc}`;
    },
    useMCP: false,
    parseJSON: true,
  },
  {
    id: "bias",
    label: "BIAS & FRAUD DETECTION",
    icon: "🔬",
    description: "One-sided manipulation, false representations, authenticity",
    color: "#c94a4a",
    system: `You are a forensic legal analyst specializing in bias detection and document fraud. Your job is to identify intentional one-sided manipulation that contravenes the governing S.o.C. — not incidental errors, but patterns suggesting deliberate misconduct.

Examine for:
1. ASYMMETRIC FRAMING: Systematically presenting facts in ways that omit exculpatory information or distort context
2. FALSE ATTRIBUTION: Attributing statements, actions, or positions to parties that appear unsupported or contradicted
3. CHAIN OF CUSTODY GAPS: Missing signatures, unexplained alterations, date anomalies, formatting inconsistencies suggesting post-creation modification
4. PATTERN MANIPULATION: Using repetitive unsupported allegations as if repetition establishes truth
5. FORUM MANIPULATION: Evidence the document was filed to create improper jurisdiction or pressure
6. COORDINATED CONDUCT: Language patterns suggesting coordination between nominally independent actors
7. AUTHENTICATION CONCERNS: Anything suggesting the document may not be what it purports to be

Output as JSON array:
[{
  "id": "B-001",
  "severity": "Critical|Significant|Advisory",
  "type": "Asymmetric_Framing|False_Attribution|Authenticity|Pattern_Manipulation|Forum_Manipulation|Coordination|Other",
  "location": "specific location in document",
  "finding": "precise description",
  "evidence": "direct quote or specific reference",
  "pattern": "if part of larger pattern, describe",
  "fraud_indicator": true/false
}]`,
    buildPrompt: (doc, prior) => {
      const soc = prior.soc?.parsed;
      const subFindings = prior.substance?.parsed || [];
      const misreps = subFindings.filter(f => f.type === "Misrepresentation").map(f => f.finding).join("; ");
      return `DOCUMENT TYPE: ${soc?.docTypeLabel}
PARTIES: ${JSON.stringify(soc?.parties || {})}
KNOWN MISREPRESENTATIONS FROM PRIOR PASS: ${misreps || "None identified yet"}

DOCUMENT:\n${doc}`;
    },
    useMCP: false,
    parseJSON: true,
  },
  {
    id: "report",
    label: "FINAL REPORT",
    icon: "📄",
    description: "Synthesize all passes → compliance score + action plan",
    color: "#6aba6a",
    system: `You are the VERNEN™ Chief Audit Officer. Synthesize all prior audit passes into a definitive compliance report. 

STRUCTURE YOUR REPORT EXACTLY AS FOLLOWS:

════════════════════════════════════════════════════════
VERNEN™ AUTONOMOUS AUDIT REPORT
════════════════════════════════════════════════════════

SECTION A — LEGAL STANDARD OF CREATION
[S.o.C. source, governing statutes, jurisdiction, document classification]

SECTION B — EXECUTIVE SUMMARY
[2–3 sentences: overall compliance assessment, most critical finding, immediate risk]

SECTION C — COMPLIANCE SCORE: [X]/100
Basis: [one line justification]
Rating: [COMPLIANT ≥80 | DEFECTIVE 50-79 | MATERIALLY DEFECTIVE 30-49 | POTENTIALLY FRAUDULENT <30]

SECTION D — FINDINGS REGISTER
[List ALL findings from all passes in this format:]
[ID] [SEVERITY] | [TYPE] | [LOCATION]
Finding: [description]
Evidence: [quote or reference]
Violated: [statute/rule]
Effect: [legal consequence]

SECTION E — FRAUD INDICATORS
[If any fraud_indicator=true findings: summarize the fraud pattern and its significance]
[If none: state "No fraud indicators detected"]

SECTION F — RECOMMENDED ACTIONS
[Numbered, specific, ordered by urgency]

SECTION G — AUDIT METADATA
Total findings: [n] | Critical: [n] | Significant: [n] | Advisory: [n]
Audit passes completed: 6 | MCP statutory lookup: [active/inactive]
Generated: [timestamp]`,
    buildPrompt: (doc, prior) => {
      const soc = prior.soc?.parsed;
      const procFindings = prior.procedural?.parsed || [];
      const subFindings = prior.substance?.parsed || [];
      const biasFindings = prior.bias?.parsed || [];
      const allFindings = [...procFindings, ...subFindings, ...biasFindings];
      const critical = allFindings.filter(f => f.severity === "Critical").length;
      const significant = allFindings.filter(f => f.severity === "Significant").length;
      const advisory = allFindings.filter(f => f.severity === "Advisory").length;
      const fraudFlags = biasFindings.filter(f => f.fraud_indicator).length;
      return `SYNTHESIZE THE FOLLOWING AUDIT RESULTS:

S.o.C.: ${soc?.socStatement}
Document Type: ${soc?.docTypeLabel}
Jurisdiction: ${soc?.jurisdiction}
Governing Statutes: ${(soc?.governingStatutes||[]).join(", ")}

STATUTORY RESEARCH SUMMARY:
${prior.statute?.text?.slice(0, 600) || "Not retrieved"}

PROCEDURAL FINDINGS (${procFindings.length}):
${JSON.stringify(procFindings, null, 2).slice(0, 1200)}

SUBSTANTIVE FINDINGS (${subFindings.length}):
${JSON.stringify(subFindings, null, 2).slice(0, 1200)}

BIAS/FRAUD FINDINGS (${biasFindings.length}, fraud indicators: ${fraudFlags}):
${JSON.stringify(biasFindings, null, 2).slice(0, 1200)}

TOTALS: ${allFindings.length} findings | Critical: ${critical} | Significant: ${significant} | Advisory: ${advisory}`;
    },
    useMCP: false,
    parseJSON: false,
  },
];

// ─── API ──────────────────────────────────────────────────────────────────────
async function callPass({ system, user, useMCP, onToken }) {
  const body = {
    model: MODEL,
    max_tokens: 1000,
    stream: true,
    system,
    messages: [{ role: "user", content: user }],
  };
  if (useMCP) body.mcp_servers = [{ type: "url", url: MCP_URL, name: "vernen-legal-mcp" }];

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("API error " + res.status);

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
          full += evt.delta.text;
          onToken(full);
        }
      } catch {}
    }
  }
  return full;
}

function tryParseJSON(text) {
  try {
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const match = clean.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (match) return JSON.parse(match[1]);
  } catch {}
  return null;
}

function extractScore(text) {
  const m = text.match(/COMPLIANCE SCORE[:\s]+(\d{1,3})\/100/i) || text.match(/(\d{1,3})\/100/);
  return m ? parseInt(m[1]) : null;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AutonomousAuditEngine() {
  const [docText, setDocText] = useState("");
  const [context, setContext] = useState("");
  const [running, setRunning] = useState(false);
  const [passStates, setPassStates] = useState({}); // {passId: {status, text, parsed, error}}
  const [currentPass, setCurrentPass] = useState(null);
  const [finalReport, setFinalReport] = useState("");
  const [score, setScore] = useState(null);
  const [auditHistory, setAuditHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const abortRef = useRef(false);

  const updatePass = useCallback((id, update) => {
    setPassStates(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...update } }));
  }, []);

  const runPipeline = async () => {
    if (!docText.trim()) return;
    abortRef.current = false;
    setRunning(true);
    setCurrentPass(null);
    setFinalReport("");
    setScore(null);
    setPassStates({});

    const priorResults = {};
    const fullDoc = context ? `CONTEXT: ${context}\n\nDOCUMENT:\n${docText}` : docText;

    for (const pass of PIPELINE) {
      if (abortRef.current) break;

      setCurrentPass(pass.id);
      updatePass(pass.id, { status: "running", text: "" });

      try {
        const userPrompt = pass.buildPrompt(fullDoc, priorResults);
        let fullText = "";

        await callPass({
          system: pass.system,
          user: userPrompt,
          useMCP: pass.useMCP,
          onToken: (t) => {
            fullText = t;
            updatePass(pass.id, { status: "running", text: t });
          },
        });

        const parsed = pass.parseJSON ? tryParseJSON(fullText) : null;
        updatePass(pass.id, { status: "done", text: fullText, parsed });
        priorResults[pass.id] = { text: fullText, parsed };

        if (pass.id === "report") {
          setFinalReport(fullText);
          const sc = extractScore(fullText);
          setScore(sc);
          setAuditHistory(h => [{
            ts: new Date().toISOString(),
            docPreview: docText.slice(0, 80),
            score: sc,
            report: fullText,
            findings: Object.values(priorResults)
              .flatMap(r => (Array.isArray(r.parsed) ? r.parsed : []))
              .length,
          }, ...h.slice(0, 9)]);
        }
      } catch (e) {
        updatePass(pass.id, { status: "error", text: "", error: e.message });
        break;
      }
    }

    setCurrentPass(null);
    setRunning(false);
  };

  const abort = () => { abortRef.current = true; };

  const exportReport = () => {
    if (!finalReport) return;
    const blob = new Blob([finalReport], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `VERNEN_Audit_${Date.now()}.txt`;
    a.click();
  };

  const exportDocx = async () => {
    const socData = passStates.soc?.parsed || {};
    const allF = Object.entries(passStates)
      .filter(([id]) => id !== "report" && id !== "soc" && id !== "statute")
      .flatMap(([, s]) => Array.isArray(s.parsed) ? s.parsed : []);
    const crit = allF.filter(f => f.severity === "Critical").length;
    const sig = allF.filter(f => f.severity === "Significant").length;
    const adv = allF.filter(f => f.severity === "Advisory").length;
    const sc = passStates.report?.parsed?.overallScore ?? null;
    await exportAuditReport({
      soc: socData,
      findings: allF,
      score: sc,
      reportText: finalReport || "",
      stats: { critical: crit, significant: sig, advisory: adv, total: allF.length },
      documentPreview: docText.slice(0, 200),
    });
  };

  // Compute aggregate stats
  const allFindings = Object.entries(passStates)
    .filter(([id]) => id !== "report" && id !== "soc" && id !== "statute")
    .flatMap(([, s]) => Array.isArray(s.parsed) ? s.parsed : []);
  const critCount = allFindings.filter(f => f.severity === "Critical").length;
  const sigCount = allFindings.filter(f => f.severity === "Significant").length;
  const advCount = allFindings.filter(f => f.severity === "Advisory").length;
  const fraudCount = allFindings.filter(f => f.fraud_indicator).length;

  const pipelineDone = passStates.report?.status === "done";
  const socData = passStates.soc?.parsed;

  return (
    <div className="app">
      <style>{CSS}</style>

      {/* HEADER */}
      <div className="header">
        <div className="hl">
          <div className="logo">VERNEN™</div>
          <div className="logo-sub">AUTONOMOUS AUDIT ENGINE</div>
        </div>
        <div className="hr">
          {pipelineDone && score !== null && (
            <div className={`score-chip ${score >= 80 ? "pass" : score >= 50 ? "warn" : "fail"}`}>
              {score}/100
            </div>
          )}
          {allFindings.length > 0 && (
            <div className="flag-chips">
              {critCount > 0 && <span className="fc critical">{critCount} CRITICAL</span>}
              {sigCount > 0 && <span className="fc significant">{sigCount} SIG</span>}
              {fraudCount > 0 && <span className="fc fraud">⚠ {fraudCount} FRAUD</span>}
            </div>
          )}
          <button className="hist-btn" onClick={() => setShowHistory(h => !h)}>
            🗂 {auditHistory.length}
          </button>
        </div>
      </div>

      <div className="body">
        {/* LEFT — Input */}
        <div className="input-col">
          <div className="input-header">DOCUMENT SUBMISSION</div>
          <textarea
            className="doc-ta"
            value={docText}
            onChange={e => setDocText(e.target.value)}
            placeholder="Paste any legal document — motion, order, declaration, DVRO, custody evaluation, police report, insurance document, transcript, agency correspondence…

The engine will autonomously:
① Identify the governing Legal Standard of Creation
② Retrieve applicable statutes via live MCP lookup
③ Run procedural compliance check
④ Run substantive conflict & inconsistency audit
⑤ Run bias & fraud detection
⑥ Synthesize final report with compliance score

No manual steps between passes."
            disabled={running}
          />
          <textarea
            className="ctx-ta"
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Optional context: case no., known violations, parties, relevant dates…"
            disabled={running}
          />
          <div className="input-actions">
            {!running ? (
              <button
                className="run-btn"
                onClick={runPipeline}
                disabled={!docText.trim()}
              >
                ▶ RUN AUTONOMOUS AUDIT
              </button>
            ) : (
              <button className="abort-btn" onClick={abort}>
                ■ ABORT
              </button>
            )}
            {pipelineDone && (
              <button className="export-btn" onClick={exportReport}>⬇ TXT</button>
            )}
            {pipelineDone && (
              <button className="export-btn" onClick={exportDocx} style={{borderColor:"#4a90d940",color:"#4a90d980"}}>⬇ DOCX</button>
            )}
            {(docText || pipelineDone) && !running && (
              <button className="clear-btn" onClick={() => {
                setDocText(""); setContext(""); setPassStates({});
                setFinalReport(""); setScore(null); setCurrentPass(null);
              }}>✕ CLEAR</button>
            )}
          </div>
          <div className="char-count">{docText.length.toLocaleString()} chars</div>

          {/* SOC display after pass 1 */}
          {socData && (
            <div className="soc-card">
              <div className="soc-card-title">LEGAL STANDARD OF CREATION</div>
              <div className="soc-row"><span>Type</span><span>{socData.docTypeLabel}</span></div>
              <div className="soc-row"><span>Jurisdiction</span><span>{socData.jurisdiction}</span></div>
              <div className="soc-row"><span>S.o.C. Source</span><span className={`soc-src ${socData.socSource?.toLowerCase()}`}>{socData.socSource}</span></div>
              {socData.caseNo && <div className="soc-row"><span>Case No.</span><span>{socData.caseNo}</span></div>}
              <div className="soc-stmt">{socData.socStatement}</div>
              {(socData.governingStatutes||[]).length > 0 && (
                <div className="soc-statutes">
                  {socData.governingStatutes.map((s, i) => <span key={i} className="stat-pill">{s}</span>)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* CENTER — Pipeline */}
        <div className="pipeline-col">
          <div className="pipeline-header">AUDIT PIPELINE</div>
          <div className="pipeline">
            {PIPELINE.map((pass, idx) => {
              const state = passStates[pass.id];
              const status = state?.status || "idle";
              const isActive = currentPass === pass.id;
              const findings = Array.isArray(state?.parsed) ? state.parsed : [];
              const critN = findings.filter(f => f.severity === "Critical").length;
              const sigN = findings.filter(f => f.severity === "Significant").length;

              return (
                <div key={pass.id}>
                  <div className={`pass-card ${status} ${isActive ? "active" : ""}`}
                    style={{ "--c": pass.color }}>
                    <div className="pass-left">
                      <div className={`pass-status-dot ${status}`} />
                      <div className="pass-icon" style={{ color: pass.color }}>{pass.icon}</div>
                    </div>
                    <div className="pass-body">
                      <div className="pass-label" style={{ color: status !== "idle" ? pass.color : "#666" }}>
                        {pass.label}
                        {pass.useMCP && <span className="mcp-tag">MCP</span>}
                      </div>
                      <div className="pass-desc">{pass.description}</div>
                      {isActive && state?.text && (
                        <div className="pass-streaming">
                          {state.text.slice(-200)}
                          <span className="cursor">▋</span>
                        </div>
                      )}
                      {status === "done" && !isActive && (
                        <div className="pass-summary">
                          {pass.id === "soc" && socData && (
                            <span className="ps-item">{socData.docTypeLabel} · {socData.socSource}</span>
                          )}
                          {pass.id === "statute" && (
                            <span className="ps-item">Statutes retrieved</span>
                          )}
                          {findings.length > 0 && (
                            <span className="ps-item">
                              {findings.length} findings
                              {critN > 0 && <span className="mini-crit"> · {critN} critical</span>}
                              {sigN > 0 && <span className="mini-sig"> · {sigN} sig</span>}
                            </span>
                          )}
                          {pass.id === "report" && score !== null && (
                            <span className={`ps-score ${score >= 80 ? "pass" : score >= 50 ? "warn" : "fail"}`}>
                              Score: {score}/100
                            </span>
                          )}
                        </div>
                      )}
                      {status === "error" && (
                        <div className="pass-error">Error: {state.error}</div>
                      )}
                    </div>
                    <div className="pass-right">
                      {status === "idle" && <span className="status-badge idle">WAITING</span>}
                      {status === "running" && <span className="status-badge running">RUNNING</span>}
                      {status === "done" && <span className="status-badge done">✓ DONE</span>}
                      {status === "error" && <span className="status-badge error">ERROR</span>}
                    </div>
                  </div>
                  {idx < PIPELINE.length - 1 && (
                    <div className={`pass-connector ${passStates[PIPELINE[idx + 1]?.id]?.status !== "idle" ? "active" : ""}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Aggregate stats */}
          {allFindings.length > 0 && (
            <div className="stats-bar">
              <div className="stat-item"><span className="si-n" style={{ color: "#c94a4a" }}>{critCount}</span><span className="si-l">CRITICAL</span></div>
              <div className="stat-item"><span className="si-n" style={{ color: "#c9884a" }}>{sigCount}</span><span className="si-l">SIGNIFICANT</span></div>
              <div className="stat-item"><span className="si-n" style={{ color: "#c9c24a" }}>{advCount}</span><span className="si-l">ADVISORY</span></div>
              <div className="stat-item"><span className="si-n" style={{ color: "#c94a4a" }}>{fraudCount}</span><span className="si-l">FRAUD FLAGS</span></div>
              <div className="stat-item"><span className="si-n" style={{ color: "#888" }}>{allFindings.length}</span><span className="si-l">TOTAL</span></div>
            </div>
          )}

          {/* Per-pass findings detail */}
          {["procedural","substance","bias"].map(passId => {
            const state = passStates[passId];
            if (!state || !Array.isArray(state.parsed) || state.parsed.length === 0) return null;
            const pass = PIPELINE.find(p => p.id === passId);
            return (
              <div key={passId} className="findings-detail">
                <div className="fd-title" style={{ color: pass.color }}>{pass.label} FINDINGS</div>
                {state.parsed.map((f, i) => (
                  <div key={i} className={`finding-row ${f.severity?.toLowerCase()}`}>
                    <div className="fr-top">
                      <span className={`sev-tag ${f.severity?.toLowerCase()}`}>{f.severity}</span>
                      <span className="fr-id">{f.id}</span>
                      <span className="fr-type">{(f.type || "").replace(/_/g, " ")}</span>
                      {f.fraud_indicator && <span className="fraud-flag">⚠ FRAUD</span>}
                    </div>
                    <div className="fr-loc">↳ {f.location}</div>
                    <div className="fr-finding">{f.finding || f.defect}</div>
                    {f.evidence && <div className="fr-evidence">"{f.evidence}"</div>}
                    <div className="fr-violated">{f.violated}</div>
                    {f.effect && <div className="fr-effect">Effect: {f.effect}</div>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* RIGHT — Final Report */}
        <div className="report-col">
          <div className="report-header">
            <span>FINAL REPORT</span>
            {pipelineDone && <span className={`score-inline ${score >= 80 ? "pass" : score >= 50 ? "warn" : "fail"}`}>{score}/100</span>}
          </div>
          {!finalReport && !running && (
            <div className="report-empty">
              <div className="re-icon">📄</div>
              <div className="re-text">Final synthesized report will appear here after all 6 passes complete.</div>
            </div>
          )}
          {(finalReport || (running && passStates.report?.text)) && (
            <div className="report-body">
              {(finalReport || passStates.report?.text || "").split("\n").map((line, i) => {
                const isSectionHead = /^(SECTION [A-G]|═+)/.test(line);
                const isCrit = line.includes("CRITICAL");
                const isSig = line.includes("SIGNIFICANT");
                const isAdv = line.includes("ADVISORY");
                const isScore = line.includes("COMPLIANCE SCORE");
                const isFraud = line.includes("FRAUD") || line.includes("fraud_indicator");
                return (
                  <div key={i} className={`rl ${isSectionHead?"section-head":isCrit?"crit":isSig?"sig":isAdv?"adv":isScore?"score-line":isFraud?"fraud-line":""}`}>
                    {line || <br />}
                  </div>
                );
              })}
              {running && passStates.report?.status === "running" && <span className="cursor">▋</span>}
            </div>
          )}
        </div>
      </div>

      {/* HISTORY PANEL */}
      {showHistory && (
        <div className="history-overlay" onClick={() => setShowHistory(false)}>
          <div className="history-panel" onClick={e => e.stopPropagation()}>
            <div className="hp-header">
              <span>AUDIT HISTORY</span>
              <button onClick={() => setShowHistory(false)}>✕</button>
            </div>
            {auditHistory.length === 0 && <div className="hp-empty">No audits this session.</div>}
            {auditHistory.map((h, i) => (
              <div key={i} className="hp-item" onClick={() => { setFinalReport(h.report); setShowHistory(false); }}>
                <div className="hpi-top">
                  <span className={`score-chip sm ${h.score >= 80 ? "pass" : h.score >= 50 ? "warn" : "fail"}`}>{h.score}/100</span>
                  <span className="hpi-ts">{new Date(h.ts).toLocaleTimeString()}</span>
                </div>
                <div className="hpi-preview">{h.docPreview}…</div>
                <div className="hpi-findings">{h.findings} findings</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
.app{height:100vh;background:#0a0a0c;color:#c0b8a8;font-family:'IBM Plex Sans',sans-serif;font-size:12px;display:flex;flex-direction:column;overflow:hidden;}
.header{display:flex;justify-content:space-between;align-items:center;padding:11px 18px;background:#080809;border-bottom:1px solid #c9a84c18;flex-shrink:0;}
.logo{font-family:'Playfair Display',serif;font-size:18px;color:#c9a84c;letter-spacing:3px;}
.logo-sub{font-family:'IBM Plex Mono',monospace;font-size:7px;color:#555;letter-spacing:4px;margin-top:1px;}
.hr{display:flex;align-items:center;gap:8px;}
.score-chip{font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:600;padding:4px 10px;border-radius:2px;border:1px solid;}
.score-chip.pass{color:#6aba6a;background:#0a130a;border-color:#4a8a4a;}
.score-chip.warn{color:#c9a84c;background:#171406;border-color:#8a7030;}
.score-chip.fail{color:#ca6a6a;background:#180808;border-color:#8a4040;}
.score-chip.sm{font-size:11px;padding:3px 8px;}
.flag-chips{display:flex;gap:4px;}
.fc{font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:1px;padding:3px 8px;border-radius:2px;}
.fc.critical{color:#c94a4a;background:#150505;border:1px solid #5a2020;}
.fc.significant{color:#c9884a;background:#150a03;border:1px solid #5a4020;}
.fc.fraud{color:#ff6060;background:#1a0000;border:1px solid #8a0000;animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
.hist-btn{background:none;border:1px solid #2a2a2e;color:#777;padding:4px 10px;border-radius:2px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:9px;transition:all .2s;}
.hist-btn:hover{border-color:#c9a84c;color:#c9a84c;}
.body{display:grid;grid-template-columns:300px 340px 1fr;flex:1;overflow:hidden;}
/* Input col */
.input-col{display:flex;flex-direction:column;padding:14px;border-right:1px solid #1a1a1e;overflow-y:auto;background:#0c0c0e;gap:8px;}
.input-header{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#c9a84c;letter-spacing:3px;margin-bottom:4px;}
.doc-ta{flex:1;min-height:200px;background:#111114;border:1px solid #1e1e22;color:#c8c0b0;padding:10px;border-radius:2px;font-family:'IBM Plex Mono',monospace;font-size:10px;outline:none;resize:none;line-height:1.65;}
.doc-ta:focus{border-color:#c9a84c30;}
.doc-ta:disabled{opacity:.6;}
.ctx-ta{height:54px;background:#111114;border:1px solid #1e1e22;color:#c8c0b0;padding:7px 10px;border-radius:2px;font-family:'IBM Plex Mono',monospace;font-size:9px;outline:none;resize:none;}
.ctx-ta:focus{border-color:#c9a84c30;}
.input-actions{display:flex;gap:6px;flex-wrap:wrap;}
.run-btn{background:#171406;border:1px solid #c9a84c;color:#c9a84c;padding:9px 16px;border-radius:2px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:2px;transition:all .2s;flex:1;}
.run-btn:hover:not(:disabled){background:#201a08;}
.run-btn:disabled{opacity:.4;cursor:not-allowed;}
.abort-btn{background:#180808;border:1px solid #c94a4a;color:#c94a4a;padding:9px 16px;border-radius:2px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:2px;flex:1;}
.export-btn,.clear-btn{padding:7px 12px;border-radius:2px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:1px;}
.export-btn{background:none;border:1px solid #c9a84c40;color:#c9a84c80;}
.export-btn:hover{border-color:#c9a84c;color:#c9a84c;}
.clear-btn{background:none;border:1px solid #2a2a2e;color:#555;}
.clear-btn:hover{border-color:#c94a4a40;color:#c94a4a;}
.char-count{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#333;}
.soc-card{background:#111108;border:1px solid #c9a84c25;border-left:2px solid #c9a84c;border-radius:2px;padding:10px;}
.soc-card-title{font-family:'IBM Plex Mono',monospace;font-size:7px;color:#c9a84c;letter-spacing:3px;margin-bottom:8px;}
.soc-row{display:flex;justify-content:space-between;font-family:'IBM Plex Mono',monospace;font-size:9px;padding:3px 0;border-bottom:1px solid #1a1a1e;}
.soc-row span:first-child{color:#555;}
.soc-row span:last-child{color:#c8c0b0;}
.soc-src.declared{color:#6aba6a;}
.soc-src.inferred{color:#c9a84c;}
.soc-src.ambiguous{color:#c94a4a;}
.soc-stmt{font-size:10px;color:#a09060;margin:8px 0;line-height:1.5;font-style:italic;}
.soc-statutes{display:flex;flex-wrap:wrap;gap:3px;margin-top:6px;}
.stat-pill{font-family:'IBM Plex Mono',monospace;font-size:7px;color:#c9a84c80;background:#171406;border:1px solid #c9a84c20;padding:2px 6px;border-radius:2px;}
/* Pipeline col */
.pipeline-col{padding:14px;border-right:1px solid #1a1a1e;overflow-y:auto;display:flex;flex-direction:column;gap:0;}
.pipeline-header{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#c9a84c;letter-spacing:3px;margin-bottom:12px;}
.pipeline{display:flex;flex-direction:column;}
.pass-card{display:flex;align-items:flex-start;gap:10px;padding:10px;border-radius:2px;border:1px solid #1a1a1e;background:#0e0e11;transition:all .3s;}
.pass-card.running{border-color:var(--c);background:#0f0f12;}
.pass-card.done{border-color:#2a2a2e;background:#0d0d10;}
.pass-card.active{box-shadow:0 0 12px var(--c)20;}
.pass-card.error{border-color:#5a2020;}
.pass-connector{width:2px;height:10px;background:#1a1a1e;margin:0 auto;}
.pass-connector.active{background:#c9a84c40;}
.pass-left{display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0;}
.pass-status-dot{width:6px;height:6px;border-radius:50%;background:#333;transition:all .3s;}
.pass-status-dot.running{background:var(--c,#c9a84c);animation:glow .8s ease-in-out infinite alternate;}
.pass-status-dot.done{background:#4a8a4a;}
.pass-status-dot.error{background:#c94a4a;}
@keyframes glow{from{box-shadow:0 0 2px currentColor}to{box-shadow:0 0 8px currentColor}}
.pass-icon{font-size:16px;line-height:1;}
.pass-body{flex:1;min-width:0;}
.pass-label{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:1px;color:#666;margin-bottom:2px;display:flex;align-items:center;gap:6px;transition:color .3s;}
.mcp-tag{font-size:7px;padding:1px 5px;background:#0a1a0a;border:1px solid #2a5a2a;color:#6aba6a;border-radius:2px;}
.pass-desc{font-size:9px;color:#444;line-height:1.4;}
.pass-streaming{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#888;margin-top:5px;line-height:1.5;max-height:60px;overflow:hidden;background:#080808;padding:4px 6px;border-radius:2px;}
.pass-summary{margin-top:4px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.ps-item{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#6a8a6a;}
.mini-crit{color:#c94a4a;}
.mini-sig{color:#c9884a;}
.ps-score{font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;}
.ps-score.pass{color:#6aba6a;}
.ps-score.warn{color:#c9a84c;}
.ps-score.fail{color:#c94a4a;}
.pass-error{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#c94a4a;margin-top:4px;}
.pass-right{flex-shrink:0;}
.status-badge{font-family:'IBM Plex Mono',monospace;font-size:7px;letter-spacing:1px;padding:2px 6px;border-radius:2px;}
.status-badge.idle{color:#333;background:#111;}
.status-badge.running{color:var(--c,#c9a84c);background:#13130e;border:1px solid var(--c,#c9a84c)40;animation:pulse 1.5s infinite;}
.status-badge.done{color:#4a8a4a;background:#0a130a;}
.status-badge.error{color:#c94a4a;background:#150505;}
.stats-bar{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin-top:12px;padding:10px;background:#0d0d10;border:1px solid #1a1a1e;border-radius:2px;}
.stat-item{display:flex;flex-direction:column;align-items:center;gap:2px;}
.si-n{font-family:'IBM Plex Mono',monospace;font-size:16px;font-weight:600;}
.si-l{font-family:'IBM Plex Mono',monospace;font-size:7px;color:#555;letter-spacing:1px;}
.findings-detail{margin-top:10px;border:1px solid #1a1a1e;border-radius:2px;overflow:hidden;}
.fd-title{font-family:'IBM Plex Mono',monospace;font-size:7px;letter-spacing:3px;padding:6px 10px;background:#0d0d10;border-bottom:1px solid #1a1a1e;}
.finding-row{padding:8px 10px;border-bottom:1px solid #141418;}
.finding-row.critical{border-left:2px solid #c94a4a;}
.finding-row.significant{border-left:2px solid #c9884a;}
.finding-row.advisory{border-left:2px solid #c9c24a;}
.fr-top{display:flex;align-items:center;gap:6px;margin-bottom:4px;flex-wrap:wrap;}
.sev-tag{font-family:'IBM Plex Mono',monospace;font-size:7px;letter-spacing:1px;padding:1px 6px;border-radius:2px;}
.sev-tag.critical{color:#c94a4a;background:#150505;border:1px solid #5a2020;}
.sev-tag.significant{color:#c9884a;background:#150a03;border:1px solid #5a4020;}
.sev-tag.advisory{color:#c9c24a;background:#151503;border:1px solid #5a5020;}
.fr-id{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#555;}
.fr-type{font-family:'IBM Plex Mono',monospace;font-size:7px;color:#777;letter-spacing:1px;}
.fraud-flag{font-family:'IBM Plex Mono',monospace;font-size:7px;color:#ff6060;background:#1a0000;border:1px solid #8a0000;padding:1px 5px;border-radius:2px;}
.fr-loc{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#c9a84c60;margin-bottom:3px;}
.fr-finding{font-size:10px;color:#b0a890;line-height:1.5;margin-bottom:3px;}
.fr-evidence{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#888;background:#090909;padding:3px 6px;border-left:2px solid #333;margin-bottom:3px;line-height:1.4;}
.fr-violated{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#c9a84c80;}
.fr-effect{font-size:9px;color:#666;margin-top:2px;font-style:italic;}
/* Report col */
.report-col{display:flex;flex-direction:column;overflow:hidden;}
.report-header{display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:#0a0a0c;border-bottom:1px solid #1a1a1e;font-family:'IBM Plex Mono',monospace;font-size:8px;color:#c9a84c;letter-spacing:3px;flex-shrink:0;}
.score-inline{font-size:13px;font-weight:600;}
.score-inline.pass{color:#6aba6a;}
.score-inline.warn{color:#c9a84c;}
.score-inline.fail{color:#c94a4a;}
.report-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;}
.re-icon{font-size:32px;opacity:.2;}
.re-text{font-size:11px;color:#444;text-align:center;max-width:240px;line-height:1.6;font-family:'IBM Plex Mono',monospace;}
.report-body{flex:1;overflow-y:auto;padding:16px;font-family:'IBM Plex Mono',monospace;font-size:10px;line-height:1.75;color:#a09880;}
.rl{padding:1px 0;}
.rl.section-head{color:#c9a84c;font-weight:500;margin-top:12px;letter-spacing:1px;}
.rl.crit{color:#c94a4a;}
.rl.sig{color:#c9884a;}
.rl.adv{color:#c9c24a;}
.rl.score-line{color:#fff;font-size:12px;font-weight:600;}
.rl.fraud-line{color:#ff6060;}
.cursor{animation:blink .8s step-end infinite;color:#c9a84c;font-size:12px;}
@keyframes blink{50%{opacity:0;}}
/* History */
.history-overlay{position:fixed;inset:0;background:#000000aa;z-index:100;display:flex;align-items:flex-start;justify-content:flex-end;}
.history-panel{width:320px;height:100vh;background:#0e0e11;border-left:1px solid #1a1a1e;padding:16px;overflow-y:auto;}
.hp-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;font-family:'IBM Plex Mono',monospace;font-size:9px;color:#c9a84c;letter-spacing:2px;}
.hp-header button{background:none;border:none;color:#555;cursor:pointer;font-size:16px;}
.hp-empty{font-size:11px;color:#444;font-style:italic;}
.hp-item{background:#131316;border:1px solid #1e1e22;border-radius:2px;padding:10px;margin-bottom:8px;cursor:pointer;transition:border .15s;}
.hp-item:hover{border-color:#c9a84c40;}
.hpi-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
.hpi-ts{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#555;}
.hpi-preview{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#777;line-height:1.4;margin-bottom:4px;}
.hpi-findings{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#c9a84c60;}
@media(max-width:900px){.body{grid-template-columns:1fr}.pipeline-col,.report-col{display:none}}
`;
