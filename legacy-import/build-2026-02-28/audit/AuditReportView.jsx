/**
 * VERNEN™ Audit Report View Component
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * React component for rendering structured audit reports
 * with risk visualization, category scoring, filing readiness,
 * and exportable report display.
 */

import { useState, useMemo } from 'react';

const C = {
  bg: '#0b0d14',
  surface: '#13151f',
  surfaceAlt: '#191c2a',
  border: '#252840',
  accent: '#6366f1',
  accentGlow: '#818cf8',
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#22c55e',
  info: '#3b82f6',
  text: '#e8ecf4',
  textDim: '#8b93a7',
  textMuted: '#5a6178',
};

const RISK_COLORS = { CRITICAL: C.critical, HIGH: C.high, MEDIUM: C.medium, LOW: C.low, INFO: C.info, UNKNOWN: C.textMuted };
const SEV_COLORS = { error: C.critical, warning: C.medium, info: C.info };
const STATUS_CONFIG = {
  READY_TO_FILE: { color: C.low, icon: '✓', label: 'Ready to File' },
  NEEDS_REVIEW: { color: C.medium, icon: '⚠', label: 'Needs Review' },
  CRITICAL_ISSUES: { color: C.critical, icon: '✕', label: 'Critical Issues' },
  NOT_READY: { color: C.high, icon: '⊘', label: 'Not Ready' },
};

const s = {
  wrap: { fontFamily: '"JetBrains Mono","Fira Code",monospace', background: C.bg, color: C.text, minHeight: '100vh', padding: '24px' },
  card: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '20px', marginBottom: '16px' },
  cardTitle: { fontSize: '12px', fontWeight: 700, color: C.accentGlow, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 14px 0' },
  pill: (color) => ({ display: 'inline-block', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: `${color}1a`, color, border: `1px solid ${color}44` }),
  scoreRing: (score, size = 80) => {
    const r = (size - 8) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (score / 100) * circ;
    const color = score >= 90 ? C.low : score >= 70 ? C.medium : score >= 50 ? C.high : C.critical;
    return { size, r, circ, offset, color };
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' },
  findingRow: (sev) => ({
    padding: '12px 16px', borderRadius: '8px', marginBottom: '8px',
    borderLeft: `3px solid ${SEV_COLORS[sev] || C.textMuted}`,
    background: `${SEV_COLORS[sev] || C.textMuted}0a`,
  }),
  readinessCheck: (passed) => ({
    display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '6px',
    background: passed ? `${C.low}0f` : `${C.critical}0a`,
    marginBottom: '6px',
  }),
  checkIcon: (passed) => ({
    width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', fontWeight: 700, flexShrink: 0,
    background: passed ? `${C.low}22` : `${C.critical}22`,
    color: passed ? C.low : C.critical,
    border: `1px solid ${passed ? C.low : C.critical}44`,
  }),
  catBar: (score) => ({
    height: '6px', borderRadius: '3px', background: C.border, overflow: 'hidden', marginTop: '6px',
  }),
  catFill: (score) => ({
    height: '100%', borderRadius: '3px', width: `${score}%`,
    background: score >= 80 ? C.low : score >= 60 ? C.medium : C.critical,
    transition: 'width 0.5s ease',
  }),
  recCard: (priority) => ({
    padding: '10px 14px', borderRadius: '6px', marginBottom: '8px',
    borderLeft: `3px solid ${priority === 1 ? C.critical : priority === 2 ? C.medium : C.info}`,
    background: C.surfaceAlt,
  }),
  tab: (active) => ({
    padding: '8px 16px', borderRadius: '6px 6px 0 0', fontSize: '11px', fontWeight: active ? 700 : 500,
    color: active ? C.accent : C.textDim, cursor: 'pointer',
    background: active ? C.surface : 'transparent',
    borderBottom: active ? `2px solid ${C.accent}` : 'none',
  }),
  timelineItem: (critical) => ({
    padding: '10px 14px', borderRadius: '6px', marginBottom: '6px',
    background: critical ? `${C.critical}0a` : C.surfaceAlt,
    border: `1px solid ${critical ? `${C.critical}33` : C.border}`,
  }),
};

function ScoreRing({ score, size = 80, label }) {
  const { r, circ, offset, color } = s.scoreRing(score, size);
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fontSize={size * 0.25} fontWeight="700" fill={color}
          fontFamily="JetBrains Mono,monospace">{score}</text>
      </svg>
      {label && <div style={{ fontSize: '10px', color: C.textDim, marginTop: '4px' }}>{label}</div>}
    </div>
  );
}

const TABS = [
  { id: 'summary', label: '⊞ Summary' },
  { id: 'findings', label: '⚑ Findings' },
  { id: 'risk', label: '◈ Risk' },
  { id: 'readiness', label: '☑ Readiness' },
  { id: 'recs', label: '→ Actions' },
  { id: 'timeline', label: '⏰ Timeline' },
  { id: 'audit', label: '⊕ Audit Trail' },
];

export default function AuditReportView({ report, onExport }) {
  const [tab, setTab] = useState('summary');
  const [findingFilter, setFindingFilter] = useState('all');

  const filteredFindings = useMemo(() => {
    if (!report?.findings) return [];
    if (findingFilter === 'all') return report.findings;
    return report.findings.filter((f) => f.severity === findingFilter);
  }, [report, findingFilter]);

  if (!report) {
    return <div style={s.wrap}><div style={s.card}><p style={{ color: C.textMuted }}>No audit report data.</p></div></div>;
  }

  const { summary, riskAssessment, categoryScores, filingReadiness, recommendations, deadlineTimeline, auditTrail } = report;
  const status = STATUS_CONFIG[summary.overallStatus] || STATUS_CONFIG.NOT_READY;

  const renderSummary = () => (
    <>
      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0' }}>
              {summary.formId} — {summary.formLabel}
            </h2>
            <p style={{ fontSize: '12px', color: C.textDim, margin: '0 0 12px 0' }}>{summary.courtName}</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={s.pill(status.color)}>{status.icon} {status.label}</span>
              <span style={s.pill(RISK_COLORS[riskAssessment.overallRisk])}>{riskAssessment.overallRiskLabel} Risk</span>
              {summary.filingFee > 0 && <span style={s.pill(C.medium)}>${summary.filingFee} fee</span>}
            </div>
          </div>
          <ScoreRing score={summary.complianceScore} size={90} label="Compliance" />
        </div>
      </div>

      <div style={s.grid3}>
        <div style={s.card}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: summary.criticalCount > 0 ? C.critical : C.low }}>{summary.criticalCount}</div>
            <div style={{ fontSize: '10px', color: C.textDim }}>Critical</div>
          </div>
        </div>
        <div style={s.card}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: summary.warningCount > 0 ? C.medium : C.low }}>{summary.warningCount}</div>
            <div style={{ fontSize: '10px', color: C.textDim }}>Warnings</div>
          </div>
        </div>
        <div style={s.card}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: C.info }}>{summary.infoCount}</div>
            <div style={{ fontSize: '10px', color: C.textDim }}>Info</div>
          </div>
        </div>
      </div>

      <div style={s.card}>
        <h3 style={s.cardTitle}>Category Scores</h3>
        {categoryScores && Object.entries(categoryScores).map(([key, cat]) => (
          <div key={key} style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px' }}>{cat.icon} {cat.label}</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: cat.score >= 80 ? C.low : cat.score >= 60 ? C.medium : C.critical }}>
                {cat.score}%
                {cat.findingCount > 0 && <span style={{ color: C.textMuted, fontWeight: 400 }}> ({cat.findingCount} finding{cat.findingCount !== 1 ? 's' : ''})</span>}
              </span>
            </div>
            <div style={s.catBar(cat.score)}><div style={s.catFill(cat.score)} /></div>
          </div>
        ))}
      </div>
    </>
  );

  const renderFindings = () => (
    <div style={s.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ ...s.cardTitle, margin: 0 }}>Audit Findings ({filteredFindings.length})</h3>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', 'error', 'warning', 'info'].map((f) => (
            <span key={f} onClick={() => setFindingFilter(f)}
              style={{ ...s.pill(findingFilter === f ? C.accent : C.textMuted), cursor: 'pointer', fontSize: '10px' }}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </span>
          ))}
        </div>
      </div>
      {filteredFindings.length === 0 ? (
        <p style={{ color: C.textMuted, fontSize: '12px' }}>No findings match the selected filter.</p>
      ) : (
        filteredFindings.map((f) => (
          <div key={f.id} style={s.findingRow(f.severity)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '12px' }}>{f.id}</span>
                <span style={{ ...s.pill(SEV_COLORS[f.severity]), marginLeft: '8px' }}>{f.severity}</span>
                <span style={{ ...s.pill(C.textMuted), marginLeft: '4px' }}>{f.category}</span>
              </div>
              {f.field && <span style={{ fontSize: '10px', color: C.textMuted }}>Field: {f.field}</span>}
            </div>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}>{f.title}</p>
            {f.details && <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: C.textDim }}>{f.details}</p>}
            {f.statutoryBasis && <p style={{ margin: '0 0 4px 0', fontSize: '10px', color: C.textMuted }}>§ {f.statutoryBasis}</p>}
            {f.recommendation && (
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: C.accentGlow, fontStyle: 'italic' }}>→ {f.recommendation}</p>
            )}
          </div>
        ))
      )}
    </div>
  );

  const renderRisk = () => (
    <>
      <div style={s.card}>
        <h3 style={s.cardTitle}>Risk Assessment</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
          <ScoreRing score={100 - riskAssessment.riskScore} size={100} label="Safety Score" />
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: RISK_COLORS[riskAssessment.overallRisk] }}>
              {riskAssessment.overallRiskLabel}
            </div>
            <p style={{ fontSize: '12px', color: C.textDim, margin: '4px 0 0' }}>{riskAssessment.overallRiskDescription}</p>
          </div>
        </div>
        <div style={s.grid2}>
          {Object.entries(riskAssessment.riskDistribution).map(([level, count]) => (
            <div key={level} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '4px', background: C.surfaceAlt }}>
              <span style={{ fontSize: '11px', color: RISK_COLORS[level.toUpperCase()] }}>{level}</span>
              <span style={{ fontSize: '11px', fontWeight: 700 }}>{count}</span>
            </div>
          ))}
        </div>
      </div>
      {riskAssessment.factors.length > 0 && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>Risk Factors</h3>
          {riskAssessment.factors.slice(0, 10).map((f, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < 9 ? `1px solid ${C.border}` : 'none' }}>
              <span style={{ fontSize: '12px', flex: 1 }}>{f.finding}</span>
              <span style={s.pill(RISK_COLORS[f.riskLevel])}>{f.riskLevel}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderReadiness = () => (
    <div style={s.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ ...s.cardTitle, margin: 0 }}>Filing Readiness</h3>
        <span style={s.pill(filingReadiness.readyToFile ? C.low : C.critical)}>
          {filingReadiness.readyToFile ? '✓ Ready' : '✕ Not Ready'} — {filingReadiness.readinessScore}%
        </span>
      </div>
      {filingReadiness.checks.map((check, i) => (
        <div key={i} style={s.readinessCheck(check.passed)}>
          <div style={s.checkIcon(check.passed)}>{check.passed ? '✓' : '✕'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 600 }}>{check.check}</div>
            <div style={{ fontSize: '11px', color: C.textDim }}>{check.detail}</div>
          </div>
          {check.requiresManualConfirmation && !check.passed && (
            <span style={s.pill(C.medium)}>Manual</span>
          )}
        </div>
      ))}
      <div style={{ marginTop: '12px', fontSize: '11px', color: C.textDim }}>
        {filingReadiness.passedCount} of {filingReadiness.totalChecks} checks passed
        {filingReadiness.manualConfirmationsNeeded > 0 && ` · ${filingReadiness.manualConfirmationsNeeded} manual confirmation(s) needed`}
      </div>
    </div>
  );

  const renderRecs = () => (
    <div style={s.card}>
      <h3 style={s.cardTitle}>Recommended Actions</h3>
      {recommendations?.length > 0 ? recommendations.map((rec, i) => (
        <div key={i} style={s.recCard(rec.priority)}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
            <span style={s.pill(rec.priority === 1 ? C.critical : rec.priority === 2 ? C.medium : C.info)}>{rec.label}</span>
            <span style={{ fontSize: '10px', color: C.textMuted }}>{rec.category}</span>
          </div>
          <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5' }}>{rec.action}</p>
        </div>
      )) : <p style={{ color: C.textMuted, fontSize: '12px' }}>No recommendations at this time.</p>}
    </div>
  );

  const renderTimeline = () => (
    <div style={s.card}>
      <h3 style={s.cardTitle}>Deadline Timeline</h3>
      {deadlineTimeline?.length > 0 ? deadlineTimeline.map((d, i) => (
        <div key={i} style={s.timelineItem(d.critical)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: '12px', color: d.critical ? C.critical : C.text }}>{d.event}</span>
              {d.critical && <span style={{ ...s.pill(C.critical), marginLeft: '8px' }}>Critical</span>}
              {d.status === 'PASSED' && <span style={{ ...s.pill(C.textMuted), marginLeft: '4px' }}>Passed</span>}
            </div>
            {d.date && <span style={{ fontSize: '12px', fontWeight: 600, color: C.medium }}>{d.date}</span>}
          </div>
          {d.calculation && <p style={{ margin: '4px 0 0', fontSize: '11px', color: C.textDim }}>{d.calculation}</p>}
          {d.statutory && <p style={{ margin: '2px 0 0', fontSize: '10px', color: C.textMuted }}>§ {d.statutory}</p>}
        </div>
      )) : <p style={{ color: C.textMuted, fontSize: '12px' }}>No deadline data available.</p>}
    </div>
  );

  const renderAudit = () => (
    <div style={s.card}>
      <h3 style={s.cardTitle}>Audit Trail</h3>
      {auditTrail?.auditSteps?.map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0', borderBottom: i < auditTrail.auditSteps.length - 1 ? `1px solid ${C.border}` : 'none' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `${C.low}22`, color: C.low, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>{step.step}</div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '12px' }}>{step.action}</span>
          </div>
          <span style={s.pill(step.status === 'complete' ? C.low : C.textMuted)}>{step.status}</span>
        </div>
      ))}
      {auditTrail?.dataIntegrity && (
        <div style={{ marginTop: '16px', padding: '12px', borderRadius: '6px', background: C.surfaceAlt }}>
          <div style={{ fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>Data Integrity</div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '11px' }}>
            <span>Fields: <strong>{auditTrail.dataIntegrity.formFieldCount}</strong></span>
            <span>Rules: <strong>{auditTrail.dataIntegrity.validationRulesChecked}</strong></span>
            <span>Findings: <strong>{auditTrail.dataIntegrity.findingsGenerated}</strong></span>
          </div>
        </div>
      )}
    </div>
  );

  const renderTab = () => {
    switch (tab) {
      case 'summary': return renderSummary();
      case 'findings': return renderFindings();
      case 'risk': return renderRisk();
      case 'readiness': return renderReadiness();
      case 'recs': return renderRecs();
      case 'timeline': return renderTimeline();
      case 'audit': return renderAudit();
      default: return renderSummary();
    }
  };

  return (
    <div style={s.wrap}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${C.border}`, paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0' }}>Compliance Audit Report</h1>
          <p style={{ fontSize: '11px', color: C.textDim, margin: 0 }}>
            {report.meta.reportId} · Generated {new Date(report.meta.generatedAt).toLocaleDateString()}
          </p>
        </div>
        <button onClick={() => onExport?.(report)} style={{
          padding: '8px 20px', borderRadius: '6px', border: `1px solid ${C.accent}`,
          background: 'transparent', color: C.accent, fontSize: '11px', fontWeight: 600, cursor: 'pointer',
        }}>⎙ Export</button>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', overflowX: 'auto' }}>
        {TABS.map((t) => (
          <div key={t.id} style={s.tab(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</div>
        ))}
      </div>

      {renderTab()}

      <div style={{ textAlign: 'center', padding: '16px', fontSize: '9px', color: C.textMuted }}>
        {report.meta.disclaimer}
      </div>
    </div>
  );
}
