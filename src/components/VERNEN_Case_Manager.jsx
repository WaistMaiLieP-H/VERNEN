import { useState, useEffect } from "react";

const STORAGE_PREFIX = "vernen_case_";
const INDEX_KEY = "vernen_case_index";

async function getCaseIndex() {
  try { const r = await window.storage.get(INDEX_KEY); return r ? JSON.parse(r.value) : []; } catch { return []; }
}
async function saveCaseIndex(index) {
  try { await window.storage.set(INDEX_KEY, JSON.stringify(index)); } catch {}
}
async function loadCaseById(id) {
  try { const r = await window.storage.get(STORAGE_PREFIX + id); return r ? JSON.parse(r.value) : null; } catch { return null; }
}
async function saveCaseById(id, data) {
  try { await window.storage.set(STORAGE_PREFIX + id, JSON.stringify(data)); } catch {}
}
async function deleteCaseById(id) {
  try { await window.storage.delete(STORAGE_PREFIX + id); } catch {}
}

const STATUS_COLORS = {
  "Active": "#6aba6a", "Pending": "#c9a84c", "Urgent": "#c94a4a",
  "Appellate": "#4a90d9", "Settled": "#888", "Closed": "#555"
};

const COURTS = [
  "Alameda County Superior Court — Family Div.",
  "Solano County Superior Court",
  "Marin County Superior Court",
  "Sacramento County Superior Court",
  "N.D. Cal. — Oakland (Federal)",
  "N.D. Cal. — San Francisco (Federal)",
  "E.D. Cal. — Sacramento (Federal)",
  "9th Circuit Court of Appeals",
  "California Court of Appeal — 1st District",
  "Other",
];

const PHASES_LIST = [
  "Case Setup","Pleadings Filed","Emergency Relief","Discovery","Motions","Trial","Verdict","Appeal"
];

function newCase() {
  return {
    id: Date.now().toString(),
    title: "",
    caseNo: "",
    court: COURTS[0],
    petitioner: "Michael Vernen Thomas Hartmann",
    respondents: [],
    status: "Active",
    phase: "Case Setup",
    venue: "state",
    claims: [],
    facts: "",
    childName: "",
    custodyOrder: "",
    counties: [],
    parties: [],
    timeline: [],
    exhibits: [],
    nextHearing: "",
    deadline: "",
    notes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sharedContext: {},
  };
}

export default function CaseManager() {
  const [cases, setCases] = useState([]);
  const [selected, setSelected] = useState(null); // full case object
  const [view, setView] = useState("list"); // list | detail | new | edit
  const [filter, setFilter] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [editDraft, setEditDraft] = useState(null);
  const [newRespondent, setNewRespondent] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getCaseIndex().then(async (index) => {
      const loaded = await Promise.all(index.map(id => loadCaseById(id)));
      setCases(loaded.filter(Boolean));
      setLoading(false);
    });
  }, []);

  const saveCase = async (c) => {
    const updated = { ...c, updatedAt: new Date().toISOString() };
    await saveCaseById(updated.id, updated);
    setCases(prev => {
      const exists = prev.find(x => x.id === updated.id);
      return exists ? prev.map(x => x.id === updated.id ? updated : x) : [...prev, updated];
    });
    const index = cases.map(x => x.id);
    if (!index.includes(updated.id)) index.push(updated.id);
    await saveCaseIndex([...new Set([...index, updated.id])]);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    return updated;
  };

  const deleteCase = async (id) => {
    await deleteCaseById(id);
    const updated = cases.filter(c => c.id !== id);
    setCases(updated);
    await saveCaseIndex(updated.map(c => c.id));
    setDeleteConfirm(null);
    if (selected?.id === id) { setSelected(null); setView("list"); }
  };

  const openCase = async (c) => {
    setSelected(c); setEditDraft({ ...c }); setView("detail");
  };

  const startNew = () => {
    const c = newCase();
    setEditDraft(c); setSelected(null); setView("new");
  };

  const filtered = cases.filter(c => {
    const matchStatus = filter === "All" || c.status === filter;
    const matchSearch = !searchQ || c.title.toLowerCase().includes(searchQ.toLowerCase()) ||
      c.caseNo.toLowerCase().includes(searchQ.toLowerCase()) ||
      (c.respondents||[]).some(r => r.toLowerCase().includes(searchQ.toLowerCase()));
    return matchStatus && matchSearch;
  }).sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const statusCounts = {};
  cases.forEach(c => { statusCounts[c.status] = (statusCounts[c.status] || 0) + 1; });
  const urgentCount = (statusCounts["Urgent"] || 0);
  const upcomingDeadlines = cases.filter(c => c.deadline && new Date(c.deadline) > new Date() && new Date(c.deadline) < new Date(Date.now() + 7*24*60*60*1000));

  return (
    <div className="app">
      <style>{CSS}</style>
      <div className="header">
        <div className="hl">
          <div className="logo">VERNEN™</div>
          <div className="logo-sub">CASE MANAGER</div>
        </div>
        <div className="hr">
          {saved && <span className="saved-badge">✓ SAVED</span>}
          {urgentCount > 0 && <span className="urgent-badge">⚠ {urgentCount} URGENT</span>}
          <span className="case-count">{cases.length} CASES</span>
          <button className="new-btn" onClick={startNew}>+ NEW CASE</button>
        </div>
      </div>

      {view === "list" && (
        <div className="list-view">
          {/* Dashboard strip */}
          <div className="dashboard">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className={`dash-stat ${filter===status?"active":""}`}
                style={{ "--c": color }}
                onClick={() => setFilter(filter===status?"All":status)}>
                <div className="ds-count">{statusCounts[status]||0}</div>
                <div className="ds-label">{status}</div>
              </div>
            ))}
            {upcomingDeadlines.length > 0 && (
              <div className="dash-stat deadline">
                <div className="ds-count">{upcomingDeadlines.length}</div>
                <div className="ds-label">DEADLINES 7d</div>
              </div>
            )}
          </div>

          {upcomingDeadlines.length > 0 && (
            <div className="deadline-bar">
              <span className="db-icon">⏰</span>
              <span className="db-label">UPCOMING:</span>
              {upcomingDeadlines.map(c => (
                <span key={c.id} className="db-item" onClick={() => openCase(c)}>
                  {c.caseNo || c.title} — {c.deadline}
                </span>
              ))}
            </div>
          )}

          <div className="list-controls">
            <input className="search-in" value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Search case no., title, respondent…" />
            <div className="filter-pills">
              {["All", ...Object.keys(STATUS_COLORS)].map(s => (
                <button key={s} className={`pill ${filter===s?"on":""}`}
                  style={filter===s&&s!=="All"?{color:STATUS_COLORS[s],borderColor:STATUS_COLORS[s]}:{}}
                  onClick={() => setFilter(s)}>{s}</button>
              ))}
            </div>
          </div>

          {loading ? <div className="loading">Loading cases…</div> :
           filtered.length === 0 ? (
             <div className="empty">
               <div className="empty-icon">⚖</div>
               <div className="empty-title">{cases.length === 0 ? "NO CASES YET" : "NO MATCHES"}</div>
               <div className="empty-sub">{cases.length === 0 ? "Create your first case to begin." : "Adjust search or filter."}</div>
               {cases.length === 0 && <button className="new-btn lg" onClick={startNew}>+ CREATE FIRST CASE</button>}
             </div>
           ) : (
             <div className="case-grid">
               {filtered.map(c => (
                 <div key={c.id} className={`case-card status-${c.status.toLowerCase()}`} onClick={() => openCase(c)}>
                   <div className="cc-top">
                     <div>
                       <div className="cc-status" style={{color: STATUS_COLORS[c.status]||"#888"}}>{c.status}</div>
                       <div className="cc-title">{c.title || "Untitled Case"}</div>
                       <div className="cc-no">{c.caseNo || "No Case #"}</div>
                     </div>
                     <button className="del-x" onClick={e => { e.stopPropagation(); setDeleteConfirm(c.id); }}>✕</button>
                   </div>
                   <div className="cc-court">{c.court}</div>
                   {(c.respondents||[]).length > 0 && (
                     <div className="cc-resp">vs. {c.respondents.slice(0,2).join(", ")}{c.respondents.length>2?` +${c.respondents.length-2}`:""}</div>
                   )}
                   <div className="cc-meta">
                     <div className="cc-phase">
                       <span className="phase-dot">◉</span>{c.phase}
                     </div>
                     {c.nextHearing && <div className="cc-hearing">📅 {c.nextHearing}</div>}
                     {c.deadline && <div className={`cc-deadline ${new Date(c.deadline) < new Date(Date.now()+3*24*60*60*1000)?"soon":""}`}>⏰ {c.deadline}</div>}
                   </div>
                   <div className="cc-updated">Updated {new Date(c.updatedAt).toLocaleDateString()}</div>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}

      {(view === "detail" || view === "new" || view === "edit") && editDraft && (
        <div className="detail-view">
          <div className="detail-header">
            <button className="back-btn" onClick={() => { setView("list"); setEditDraft(null); }}>← CASES</button>
            <div className="dh-title">{view === "new" ? "NEW CASE" : editDraft.title || "Untitled Case"}</div>
            <div className="dh-actions">
              <button className="save-btn" onClick={async () => {
                const saved = await saveCase(editDraft);
                setSelected(saved);
                setView("detail");
              }}>SAVE</button>
            </div>
          </div>

          <div className="detail-body">
            <div className="detail-col">
              {/* Core fields */}
              <Section title="CASE IDENTIFICATION">
                <FGrid>
                  <Field label="Case Title" value={editDraft.title} onChange={v => setEditDraft(d=>({...d,title:v}))} placeholder="In re Hartmann — Custody Enforcement" />
                  <Field label="Case Number" value={editDraft.caseNo} onChange={v => setEditDraft(d=>({...d,caseNo:v}))} placeholder="XX-FL-XXXXXX" />
                </FGrid>
                <div className="field" style={{marginBottom:10}}>
                  <label className="fl">COURT</label>
                  <select className="sel" value={editDraft.court} onChange={e => setEditDraft(d=>({...d,court:e.target.value}))}>
                    {COURTS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <FGrid>
                  <div className="field">
                    <label className="fl">STATUS</label>
                    <select className="sel" value={editDraft.status} onChange={e => setEditDraft(d=>({...d,status:e.target.value}))}>
                      {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label className="fl">CURRENT PHASE</label>
                    <select className="sel" value={editDraft.phase} onChange={e => setEditDraft(d=>({...d,phase:e.target.value}))}>
                      {PHASES_LIST.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <Field label="Next Hearing Date" value={editDraft.nextHearing} onChange={v => setEditDraft(d=>({...d,nextHearing:v}))} placeholder="2026-03-15" />
                  <Field label="Filing Deadline" value={editDraft.deadline} onChange={v => setEditDraft(d=>({...d,deadline:v}))} placeholder="2026-03-01" />
                </FGrid>
              </Section>

              <Section title="PARTIES">
                <Field label="Petitioner" value={editDraft.petitioner} onChange={v => setEditDraft(d=>({...d,petitioner:v}))} />
                <div className="field" style={{marginBottom:8}}>
                  <label className="fl">RESPONDENTS</label>
                  <div className="resp-list">
                    {(editDraft.respondents||[]).map((r,i) => (
                      <div key={i} className="resp-tag">
                        {r}
                        <button onClick={() => setEditDraft(d=>({...d,respondents:d.respondents.filter((_,j)=>j!==i)}))}>✕</button>
                      </div>
                    ))}
                  </div>
                  <div className="add-resp-row">
                    <input className="inp" value={newRespondent} onChange={e => setNewRespondent(e.target.value)}
                      onKeyDown={e => { if(e.key==="Enter"&&newRespondent.trim()){setEditDraft(d=>({...d,respondents:[...(d.respondents||[]),newRespondent.trim()]}));setNewRespondent("");}}}
                      placeholder="Add respondent — press Enter" />
                    <button className="add-btn" onClick={() => { if(newRespondent.trim()){setEditDraft(d=>({...d,respondents:[...(d.respondents||[]),newRespondent.trim()]}));setNewRespondent("");}}}>+</button>
                  </div>
                </div>
                <FGrid>
                  <Field label="Child Name" value={editDraft.childName} onChange={v => setEditDraft(d=>({...d,childName:v}))} />
                  <Field label="Existing Custody Order" value={editDraft.custodyOrder} onChange={v => setEditDraft(d=>({...d,custodyOrder:v}))} />
                </FGrid>
              </Section>

              <Section title="FACTS & NOTES">
                <div className="field-full">
                  <label className="fl">CASE FACTS SUMMARY</label>
                  <textarea className="ta" rows={5} value={editDraft.facts} onChange={e => setEditDraft(d=>({...d,facts:e.target.value}))}
                    placeholder="Key facts, orders, violations, timeline summary…" />
                </div>
                <div className="field-full">
                  <label className="fl">INTERNAL NOTES</label>
                  <textarea className="ta" rows={3} value={editDraft.notes} onChange={e => setEditDraft(d=>({...d,notes:e.target.value}))}
                    placeholder="Strategy notes, to-dos, open questions…" />
                </div>
              </Section>
            </div>

            <div className="sidebar-col">
              {/* Phase tracker */}
              <Section title="PHASE TRACKER">
                <div className="phase-track">
                  {PHASES_LIST.map((p, i) => {
                    const currentIdx = PHASES_LIST.indexOf(editDraft.phase);
                    const done = i < currentIdx;
                    const active = i === currentIdx;
                    return (
                      <div key={p} className={`phase-step ${done?"done":active?"active":""}`}
                        onClick={() => setEditDraft(d=>({...d,phase:p}))}>
                        <div className="ps-dot">{done?"✓":i+1}</div>
                        <div className="ps-label">{p}</div>
                      </div>
                    );
                  })}
                </div>
              </Section>

              {/* Counties */}
              <Section title="COUNTIES INVOLVED">
                <div className="county-grid">
                  {["Alameda","Solano","Marin","Contra Costa","San Francisco","Sacramento"].map(c => (
                    <button key={c}
                      className={`county-btn ${(editDraft.counties||[]).includes(c)?"on":""}`}
                      onClick={() => setEditDraft(d=>({...d,counties:d.counties.includes(c)?d.counties.filter(x=>x!==c):[...d.counties,c]}))}>
                      {c}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Related cases */}
              <Section title="CASE RELATIONSHIPS">
                <div className="related-list">
                  {cases.filter(c => c.id !== editDraft.id).slice(0,5).map(c => (
                    <div key={c.id} className="related-item" onClick={() => openCase(c)}>
                      <div className="ri-title">{c.title||"Untitled"}</div>
                      <div className="ri-no">{c.caseNo} · {c.court.split("—")[0].trim()}</div>
                    </div>
                  ))}
                  {cases.length <= 1 && <div className="empty-sub">No other cases</div>}
                </div>
              </Section>

              {/* Quick stats */}
              {selected && (
                <Section title="CASE METRICS">
                  <div className="metric"><span>Timeline Events</span><span>{(selected.timeline||[]).length}</span></div>
                  <div className="metric"><span>Exhibits</span><span>{(selected.exhibits||[]).length}</span></div>
                  <div className="metric"><span>Parties</span><span>{(selected.parties||[]).length}</span></div>
                  <div className="metric"><span>AI Outputs</span><span>{Object.keys(selected.sharedContext||{}).length}</span></div>
                  <div className="metric"><span>Created</span><span>{new Date(selected.createdAt).toLocaleDateString()}</span></div>
                </Section>
              )}

              <button className="launch-btn" onClick={async () => {
                const saved = await saveCase(editDraft);
                alert("Case saved. To open in the Civil Suit Simulator v7, load the VERNEN_Simulator_v7 artifact and the shared storage will sync this case data.");
              }}>
                ▶ OPEN IN SIMULATOR v7
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">DELETE CASE?</div>
            <div className="modal-body">
              {cases.find(c=>c.id===deleteConfirm)?.title || "This case"} will be permanently deleted from storage. This cannot be undone.
            </div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setDeleteConfirm(null)}>CANCEL</button>
              <button className="modal-confirm" onClick={() => deleteCase(deleteConfirm)}>DELETE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Components ───────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder }) {
  return (
    <div className="field">
      {label && <label className="fl">{label}</label>}
      <input className="inp" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder||""} />
    </div>
  );
}
function FGrid({ children }) { return <div className="fgrid">{children}</div>; }
function Section({ title, children }) {
  return (
    <div className="section">
      <div className="sec-title">{title}</div>
      {children}
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
.app{min-height:100vh;background:#0b0b0d;color:#c0b8a8;font-family:'IBM Plex Sans',sans-serif;font-size:13px;}
.header{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;background:#090909;border-bottom:1px solid #c9a84c20;}
.logo{font-family:'Playfair Display',serif;font-size:20px;color:#c9a84c;letter-spacing:3px;}
.logo-sub{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#555;letter-spacing:4px;margin-top:2px;}
.hr{display:flex;align-items:center;gap:10px;}
.saved-badge{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#6aba6a;letter-spacing:1px;}
.urgent-badge{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#c94a4a;letter-spacing:1px;background:#1a0808;border:1px solid #8a3030;padding:3px 8px;border-radius:2px;}
.case-count{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#555;letter-spacing:2px;}
.new-btn{background:#171406;border:1px solid #c9a84c;color:#c9a84c;padding:7px 16px;border-radius:2px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:2px;transition:all .2s;}
.new-btn:hover{background:#201a08;}
.new-btn.lg{margin-top:20px;padding:10px 24px;font-size:10px;}
.list-view{padding:0;}
.dashboard{display:flex;gap:1px;background:#111;border-bottom:1px solid #1a1a1e;}
.dash-stat{flex:1;padding:12px 16px;background:#0d0d10;cursor:pointer;transition:all .2s;text-align:center;border-bottom:2px solid transparent;}
.dash-stat:hover{background:#111114;}
.dash-stat.active{border-bottom-color:var(--c,#c9a84c);background:#111108;}
.dash-stat.deadline{background:#0f0a08;}
.ds-count{font-family:'IBM Plex Mono',monospace;font-size:18px;font-weight:500;color:var(--c,#c9a84c);}
.ds-label{font-family:'IBM Plex Mono',monospace;font-size:7px;color:#555;letter-spacing:2px;margin-top:2px;}
.deadline-bar{display:flex;align-items:center;gap:8px;padding:8px 20px;background:#0f0a05;border-bottom:1px solid #3a2a10;font-family:'IBM Plex Mono',monospace;font-size:9px;flex-wrap:wrap;}
.db-icon{font-size:11px;}
.db-label{color:#c9844a;letter-spacing:1px;}
.db-item{color:#c9a84c;cursor:pointer;border:1px solid #4a3510;padding:2px 8px;border-radius:2px;transition:border .2s;}
.db-item:hover{border-color:#c9a84c;}
.list-controls{display:flex;gap:12px;padding:12px 20px;border-bottom:1px solid #1a1a1e;align-items:center;flex-wrap:wrap;}
.search-in{background:#111114;border:1px solid #1e1e22;color:#c8c0b0;padding:7px 12px;border-radius:2px;font-family:'IBM Plex Mono',monospace;font-size:10px;outline:none;width:260px;}
.search-in:focus{border-color:#c9a84c35;}
.filter-pills{display:flex;gap:5px;flex-wrap:wrap;}
.pill{padding:4px 12px;border-radius:2px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:1px;border:1px solid #222;background:none;color:#555;transition:all .15s;}
.pill:hover{border-color:#c9a84c30;color:#999;}
.pill.on{border-color:#c9a84c;color:#c9a84c;background:#111108;}
.loading{padding:40px;text-align:center;font-family:'IBM Plex Mono',monospace;font-size:10px;color:#555;}
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;text-align:center;}
.empty-icon{font-size:36px;opacity:.3;margin-bottom:16px;}
.empty-title{font-family:'IBM Plex Mono',monospace;font-size:11px;color:#c9a84c;letter-spacing:3px;margin-bottom:8px;}
.empty-sub{font-size:11px;color:#444;}
.case-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1px;background:#111;padding:1px;}
.case-card{background:#0e0e11;padding:16px;cursor:pointer;transition:background .15s;border-left:2px solid transparent;}
.case-card:hover{background:#111114;}
.case-card.status-urgent{border-left-color:#c94a4a;}
.case-card.status-active{border-left-color:#6aba6a;}
.case-card.status-pending{border-left-color:#c9a84c;}
.case-card.status-appellate{border-left-color:#4a90d9;}
.cc-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;}
.cc-status{font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:2px;margin-bottom:3px;}
.cc-title{font-size:13px;color:#c8c0b0;font-weight:500;line-height:1.3;}
.cc-no{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#555;margin-top:2px;}
.cc-court{font-size:10px;color:#888;margin-bottom:5px;}
.cc-resp{font-size:11px;color:#a09060;margin-bottom:8px;}
.cc-meta{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:6px;}
.cc-phase{display:flex;align-items:center;gap:4px;font-family:'IBM Plex Mono',monospace;font-size:8px;color:#777;letter-spacing:1px;}
.phase-dot{color:#c9a84c;font-size:10px;}
.cc-hearing{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#6aba6a;}
.cc-deadline{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#c9a84c;}
.cc-deadline.soon{color:#c94a4a;}
.cc-updated{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#333;}
.del-x{background:none;border:none;color:#333;cursor:pointer;font-size:13px;padding:2px 5px;transition:color .2s;}
.del-x:hover{color:#c94a4a;}
/* Detail view */
.detail-view{display:flex;flex-direction:column;height:calc(100vh - 52px);}
.detail-header{display:flex;align-items:center;gap:16px;padding:12px 20px;background:#0c0c0e;border-bottom:1px solid #1a1a1e;}
.back-btn{background:none;border:1px solid #333;color:#888;padding:5px 12px;border-radius:2px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:1px;transition:all .2s;}
.back-btn:hover{border-color:#c9a84c;color:#c9a84c;}
.dh-title{flex:1;font-family:'Playfair Display',serif;font-size:16px;color:#c9a84c;}
.dh-actions{display:flex;gap:8px;}
.save-btn{background:#171406;border:1px solid #c9a84c;color:#c9a84c;padding:7px 18px;border-radius:2px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:2px;transition:all .2s;}
.save-btn:hover{background:#201a08;}
.detail-body{display:grid;grid-template-columns:1fr 260px;flex:1;overflow:hidden;}
.detail-col{padding:20px;overflow-y:auto;border-right:1px solid #1a1a1e;}
.sidebar-col{padding:16px;overflow-y:auto;background:#0c0c0e;}
.section{margin-bottom:20px;background:#0f0f12;border:1px solid #1a1a1e;border-radius:2px;padding:14px;}
.sec-title{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#c9a84c;letter-spacing:3px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #c9a84c15;}
.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;}
.field{display:flex;flex-direction:column;gap:4px;margin-bottom:8px;}
.field-full{margin-bottom:10px;}
.fl{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#c9a84c60;letter-spacing:2px;text-transform:uppercase;display:block;margin-bottom:3px;}
.inp{background:#131316;border:1px solid #222;color:#c8c0b0;padding:7px 10px;border-radius:2px;font-family:'IBM Plex Sans',sans-serif;font-size:12px;outline:none;width:100%;}
.inp:focus{border-color:#c9a84c35;}
.ta{width:100%;background:#131316;border:1px solid #222;color:#c8c0b0;padding:8px 10px;border-radius:2px;font-family:'IBM Plex Sans',sans-serif;font-size:12px;outline:none;resize:vertical;line-height:1.6;}
.ta:focus{border-color:#c9a84c35;}
.sel{width:100%;background:#131316;border:1px solid #222;color:#c8c0b0;padding:7px 10px;border-radius:2px;font-family:'IBM Plex Mono',monospace;font-size:10px;outline:none;}
.resp-list{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px;}
.resp-tag{display:flex;align-items:center;gap:5px;background:#1a1706;border:1px solid #c9a84c40;padding:4px 10px;border-radius:2px;font-size:11px;color:#c9a84c;}
.resp-tag button{background:none;border:none;color:#c9a84c60;cursor:pointer;font-size:12px;padding:0 2px;}
.resp-tag button:hover{color:#c94a4a;}
.add-resp-row{display:flex;gap:6px;}
.add-btn{background:#171406;border:1px solid #c9a84c;color:#c9a84c;padding:6px 12px;border-radius:2px;cursor:pointer;font-size:14px;transition:all .2s;}
.add-btn:hover{background:#201a08;}
/* Phase tracker */
.phase-track{display:flex;flex-direction:column;gap:4px;}
.phase-step{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:2px;cursor:pointer;transition:all .15s;}
.phase-step:hover{background:#131316;}
.phase-step.done .ps-dot{color:#6aba6a;}
.phase-step.active .ps-dot{color:#c9a84c;}
.ps-dot{font-family:'IBM Plex Mono',monospace;font-size:10px;color:#444;width:16px;text-align:center;}
.ps-label{font-size:11px;color:#888;}
.phase-step.done .ps-label{color:#6aba6a;}
.phase-step.active .ps-label{color:#c9a84c;font-weight:500;}
/* Counties */
.county-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:4px;}
.county-btn{padding:6px 8px;background:#131316;border:1px solid #222;border-radius:2px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:9px;color:#777;transition:all .15s;text-align:left;}
.county-btn:hover{border-color:#c9a84c30;}
.county-btn.on{background:#171406;border-color:#c9a84c;color:#c9a84c;}
/* Related & metrics */
.related-list{display:flex;flex-direction:column;gap:5px;}
.related-item{padding:7px 8px;background:#131316;border:1px solid #1e1e22;border-radius:2px;cursor:pointer;transition:all .15s;}
.related-item:hover{border-color:#c9a84c30;}
.ri-title{font-size:11px;color:#c8c0b0;}
.ri-no{font-family:'IBM Plex Mono',monospace;font-size:8px;color:#555;margin-top:2px;}
.metric{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #1a1a1e;font-family:'IBM Plex Mono',monospace;font-size:10px;color:#888;}
.metric span:last-child{color:#c9a84c;}
.launch-btn{width:100%;margin-top:12px;background:#0a130a;border:1px solid #4a8a4a;color:#6aba6a;padding:10px;border-radius:2px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:2px;transition:all .2s;}
.launch-btn:hover{background:#0d1a0d;}
/* Modal */
.modal-overlay{position:fixed;inset:0;background:#000000cc;display:flex;align-items:center;justify-content:center;z-index:1000;}
.modal{background:#141416;border:1px solid #c94a4a40;border-radius:3px;padding:24px;width:380px;}
.modal-title{font-family:'IBM Plex Mono',monospace;font-size:10px;color:#c94a4a;letter-spacing:2px;margin-bottom:12px;}
.modal-body{font-size:12px;color:#888;line-height:1.6;margin-bottom:20px;}
.modal-actions{display:flex;gap:10px;justify-content:flex-end;}
.modal-cancel{background:none;border:1px solid #333;color:#666;padding:7px 16px;border-radius:2px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:9px;}
.modal-confirm{background:#1a0808;border:1px solid #c94a4a;color:#c94a4a;padding:7px 16px;border-radius:2px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:1px;}
.modal-confirm:hover{background:#220a0a;}
@media(max-width:768px){.detail-body{grid-template-columns:1fr}.sidebar-col{display:none}.case-grid{grid-template-columns:1fr}}
`;
