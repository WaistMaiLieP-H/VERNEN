/**
 * VERNEN™ Filing Guide View Component
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * React component for rendering court-specific filing guides
 * with interactive checklists, fee breakdowns, service requirements,
 * and deadline tracking.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

const COLORS = {
  bg: '#0f1117',
  surface: '#1a1d27',
  surfaceHover: '#22263a',
  border: '#2a2e3f',
  accent: '#6366f1',
  accentLight: '#818cf8',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
};

const styles = {
  container: {
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    background: COLORS.bg,
    color: COLORS.textPrimary,
    minHeight: '100vh',
    padding: '24px',
  },
  header: {
    borderBottom: `1px solid ${COLORS.border}`,
    paddingBottom: '20px',
    marginBottom: '24px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: COLORS.textPrimary,
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '13px',
    color: COLORS.textSecondary,
    margin: 0,
  },
  badge: (color) => ({
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: `${color}22`,
    color: color,
    border: `1px solid ${color}44`,
    marginRight: '6px',
  }),
  section: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: COLORS.accentLight,
    margin: '0 0 12px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  checklistItem: (completed) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background 0.15s',
    background: completed ? `${COLORS.success}11` : 'transparent',
    opacity: completed ? 0.75 : 1,
  }),
  checkbox: (completed) => ({
    width: '18px',
    height: '18px',
    borderRadius: '4px',
    border: `2px solid ${completed ? COLORS.success : COLORS.border}`,
    backgroundColor: completed ? COLORS.success : 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px',
    transition: 'all 0.15s',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold',
  }),
  feeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: `1px solid ${COLORS.border}`,
  },
  feeAmount: (amount) => ({
    fontWeight: 700,
    fontSize: '16px',
    color: amount > 0 ? COLORS.warning : COLORS.success,
  }),
  deadlineCard: (critical) => ({
    padding: '12px 16px',
    borderRadius: '6px',
    border: `1px solid ${critical ? COLORS.error + '66' : COLORS.border}`,
    backgroundColor: critical ? `${COLORS.error}11` : COLORS.surface,
    marginBottom: '8px',
  }),
  tipCard: {
    padding: '10px 14px',
    borderRadius: '6px',
    borderLeft: `3px solid ${COLORS.accent}`,
    backgroundColor: `${COLORS.accent}11`,
    marginBottom: '8px',
    fontSize: '12px',
    lineHeight: '1.6',
    color: COLORS.textSecondary,
  },
  serviceMethodBadge: (method) => {
    const color = method.includes('personal') ? COLORS.warning : method === 'none' ? COLORS.success : COLORS.info;
    return {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 600,
      backgroundColor: `${color}22`,
      color: color,
      border: `1px solid ${color}44`,
    };
  },
  progress: {
    bar: {
      width: '100%',
      height: '6px',
      borderRadius: '3px',
      backgroundColor: COLORS.border,
      overflow: 'hidden',
      marginTop: '8px',
    },
    fill: (pct) => ({
      width: `${pct}%`,
      height: '100%',
      borderRadius: '3px',
      backgroundColor: pct === 100 ? COLORS.success : COLORS.accent,
      transition: 'width 0.3s ease',
    }),
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '20px',
    overflowX: 'auto',
  },
  tab: (active) => ({
    padding: '8px 16px',
    borderRadius: '6px 6px 0 0',
    fontSize: '12px',
    fontWeight: active ? 700 : 500,
    color: active ? COLORS.accent : COLORS.textSecondary,
    backgroundColor: active ? COLORS.surface : 'transparent',
    border: `1px solid ${active ? COLORS.border : 'transparent'}`,
    borderBottom: active ? `2px solid ${COLORS.accent}` : '1px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  }),
  courtInfo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    fontSize: '13px',
  },
  courtField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  courtLabel: {
    fontSize: '10px',
    fontWeight: 600,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  courtValue: {
    color: COLORS.textPrimary,
    fontSize: '13px',
  },
  printBtn: {
    padding: '8px 20px',
    borderRadius: '6px',
    border: `1px solid ${COLORS.accent}`,
    backgroundColor: 'transparent',
    color: COLORS.accent,
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
};

const TABS = [
  { id: 'overview', label: '⊞ Overview' },
  { id: 'checklist', label: '☑ Checklist' },
  { id: 'fees', label: '$ Fees' },
  { id: 'service', label: '⟐ Service' },
  { id: 'deadlines', label: '⏰ Deadlines' },
  { id: 'tips', label: '💡 Pro Se Tips' },
];

export default function FilingGuideView({ guide, onChecklistUpdate, onPrint }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    if (guide?.checklist) {
      const initial = {};
      guide.checklist.forEach((item) => {
        initial[item.step] = item.status === 'completed';
      });
      setCheckedItems(initial);
    }
  }, [guide]);

  const toggleCheck = useCallback(
    (step) => {
      setCheckedItems((prev) => {
        const updated = { ...prev, [step]: !prev[step] };
        onChecklistUpdate?.(updated);
        return updated;
      });
    },
    [onChecklistUpdate]
  );

  const progress = useMemo(() => {
    if (!guide?.checklist) return 0;
    const total = guide.checklist.length;
    const done = Object.values(checkedItems).filter(Boolean).length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [checkedItems, guide]);

  if (!guide || guide.error) {
    return (
      <div style={styles.container}>
        <div style={styles.section}>
          <p style={{ color: COLORS.error }}>{guide?.error || 'No filing guide data available.'}</p>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <>
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Court Information</h3>
        <div style={styles.courtInfo}>
          <div style={styles.courtField}>
            <span style={styles.courtLabel}>Court</span>
            <span style={styles.courtValue}>{guide.court.name}</span>
          </div>
          <div style={styles.courtField}>
            <span style={styles.courtLabel}>Address</span>
            <span style={styles.courtValue}>{guide.court.address}</span>
          </div>
          <div style={styles.courtField}>
            <span style={styles.courtLabel}>Filing Hours</span>
            <span style={styles.courtValue}>{guide.court.filingHours}</span>
          </div>
          <div style={styles.courtField}>
            <span style={styles.courtLabel}>Clerk Phone</span>
            <span style={styles.courtValue}>{guide.court.clerkPhone}</span>
          </div>
          <div style={styles.courtField}>
            <span style={styles.courtLabel}>Self-Help Center</span>
            <span style={styles.courtValue}>{guide.court.selfHelp}</span>
          </div>
          <div style={styles.courtField}>
            <span style={styles.courtLabel}>E-Filing</span>
            <span style={styles.courtValue}>
              {guide.court.efiling ? (
                <span style={styles.badge(COLORS.success)}>Available</span>
              ) : (
                <span style={styles.badge(COLORS.textMuted)}>Not Available</span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Filing Summary</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <span style={styles.badge(COLORS.accent)}>{guide.meta.formId}</span>
          <span style={styles.badge(COLORS.textSecondary)}>{guide.meta.formLabel}</span>
          {guide.fees.feeWaiverEligible && <span style={styles.badge(COLORS.success)}>Fee Waiver Eligible</span>}
        </div>
        <div style={{ display: 'flex', gap: '24px', marginTop: '12px' }}>
          <div>
            <span style={{ ...styles.courtLabel, display: 'block' }}>Filing Fee</span>
            <span style={styles.feeAmount(guide.fees.filingFee)}>
              {guide.fees.filingFee > 0 ? `$${guide.fees.filingFee}` : 'No Fee'}
            </span>
          </div>
          <div>
            <span style={{ ...styles.courtLabel, display: 'block' }}>Motion Fee</span>
            <span style={styles.feeAmount(guide.fees.motionFee)}>
              {guide.fees.motionFee > 0 ? `$${guide.fees.motionFee}` : 'No Fee'}
            </span>
          </div>
          <div>
            <span style={{ ...styles.courtLabel, display: 'block' }}>Checklist Progress</span>
            <span style={{ fontWeight: 700, fontSize: '16px', color: progress === 100 ? COLORS.success : COLORS.accent }}>
              {progress}%
            </span>
          </div>
        </div>
        <div style={styles.progress.bar}>
          <div style={styles.progress.fill(progress)} />
        </div>
      </div>

      {guide.companions && guide.companions.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Companion Forms</h3>
          {guide.companions.map((comp, i) => (
            <div key={i} style={{ ...styles.feeRow, borderBottom: i < guide.companions.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
              <div>
                <span style={{ fontWeight: 600, color: COLORS.textPrimary }}>{comp.formId}</span>
                <span style={{ marginLeft: '8px', color: COLORS.textSecondary, fontSize: '12px' }}>{comp.label}</span>
                {comp.required && <span style={{ ...styles.badge(COLORS.error), marginLeft: '8px' }}>Required</span>}
              </div>
              <span style={{ fontSize: '12px', color: COLORS.textMuted }}>{comp.notes?.substring(0, 60)}...</span>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderChecklist = () => (
    <div style={styles.section}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ ...styles.sectionTitle, margin: 0 }}>Filing Checklist</h3>
        <span style={{ fontSize: '13px', color: progress === 100 ? COLORS.success : COLORS.textSecondary }}>
          {Object.values(checkedItems).filter(Boolean).length} / {guide.checklist.length} complete
        </span>
      </div>
      <div style={styles.progress.bar}>
        <div style={styles.progress.fill(progress)} />
      </div>
      <div style={{ marginTop: '16px' }}>
        {guide.checklist.map((item) => (
          <div
            key={item.step}
            style={styles.checklistItem(checkedItems[item.step])}
            onClick={() => toggleCheck(item.step)}
          >
            <div style={styles.checkbox(checkedItems[item.step])}>
              {checkedItems[item.step] && '✓'}
            </div>
            <div style={{ flex: 1 }}>
              <span
                style={{
                  fontSize: '13px',
                  textDecoration: checkedItems[item.step] ? 'line-through' : 'none',
                  color: checkedItems[item.step] ? COLORS.textMuted : COLORS.textPrimary,
                }}
              >
                {item.task}
              </span>
              {item.required && !checkedItems[item.step] && (
                <span style={{ ...styles.badge(COLORS.error), marginLeft: '8px', fontSize: '10px' }}>Required</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFees = () => (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>Fee Schedule</h3>
      <div style={styles.feeRow}>
        <span style={{ color: COLORS.textSecondary }}>First Filing Fee</span>
        <span style={styles.feeAmount(guide.fees.filingFee)}>
          {guide.fees.filingFee > 0 ? `$${guide.fees.filingFee}` : 'No Fee'}
        </span>
      </div>
      <div style={styles.feeRow}>
        <span style={{ color: COLORS.textSecondary }}>Motion Fee</span>
        <span style={styles.feeAmount(guide.fees.motionFee)}>
          {guide.fees.motionFee > 0 ? `$${guide.fees.motionFee}` : 'No Fee'}
        </span>
      </div>
      <div style={{ ...styles.feeRow, borderBottom: 'none' }}>
        <span style={{ color: COLORS.textSecondary }}>Fee Waiver Eligible</span>
        <span style={{ color: guide.fees.feeWaiverEligible ? COLORS.success : COLORS.textMuted }}>
          {guide.fees.feeWaiverEligible ? 'Yes — FW-001' : 'N/A'}
        </span>
      </div>
      {guide.fees.notes.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          {guide.fees.notes.map((note, i) => (
            <div key={i} style={styles.tipCard}>
              {note}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderService = () => {
    if (!guide.service) {
      return (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Service Requirements</h3>
          <p style={{ color: COLORS.textMuted, fontSize: '13px' }}>No service requirements for this form.</p>
        </div>
      );
    }

    return (
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Service Requirements</h3>
        <div style={{ marginBottom: '16px' }}>
          <span style={styles.serviceMethodBadge(guide.service.method)}>{guide.service.method}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div style={styles.courtField}>
            <span style={styles.courtLabel}>Who Can Serve</span>
            <span style={{ ...styles.courtValue, fontSize: '12px' }}>{guide.service.server}</span>
          </div>
          <div style={styles.courtField}>
            <span style={styles.courtLabel}>Timeline</span>
            <span style={{ ...styles.courtValue, fontSize: '12px' }}>{guide.service.timeline}</span>
          </div>
          <div style={styles.courtField}>
            <span style={styles.courtLabel}>Proof of Service Form</span>
            <span style={styles.courtValue}>{guide.service.proofOfServiceForm}</span>
          </div>
          <div style={styles.courtField}>
            <span style={styles.courtLabel}>Statutory Basis</span>
            <span style={{ ...styles.courtValue, fontSize: '12px' }}>{guide.service.statutoryBasis}</span>
          </div>
        </div>
        <div style={{ ...styles.tipCard, borderLeftColor: COLORS.info }}>
          {guide.service.notes}
        </div>
        {guide.service.warnings.map((warn, i) => (
          <div key={i} style={{ ...styles.tipCard, borderLeftColor: COLORS.warning }}>
            ⚠ {warn}
          </div>
        ))}
      </div>
    );
  };

  const renderDeadlines = () => (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>Filing Deadlines</h3>
      {(!guide.deadlines || guide.deadlines.length === 0) ? (
        <p style={{ color: COLORS.textMuted, fontSize: '13px' }}>No specific deadline rules for this form type.</p>
      ) : (
        guide.deadlines.map((d, i) => (
          <div key={i} style={styles.deadlineCard(d.critical)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '13px', color: d.critical ? COLORS.error : COLORS.textPrimary }}>
                  {d.event}
                </span>
                {d.critical && <span style={{ ...styles.badge(COLORS.error), marginLeft: '8px' }}>Critical</span>}
              </div>
              {d.date && <span style={{ fontWeight: 600, color: COLORS.warning }}>{d.date}</span>}
            </div>
            {d.calculation && (
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: COLORS.textSecondary }}>{d.calculation}</p>
            )}
            {d.statutory && (
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: COLORS.textMuted }}>{d.statutory}</p>
            )}
          </div>
        ))
      )}
    </div>
  );

  const renderTips = () => (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>Pro Se Tips</h3>
      {guide.proSeTips.map((tip, i) => (
        <div key={i} style={styles.tipCard}>
          <span style={{ fontWeight: 600, color: COLORS.accent, marginRight: '6px' }}>#{i + 1}</span>
          {tip}
        </div>
      ))}
    </div>
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'checklist': return renderChecklist();
      case 'fees': return renderFees();
      case 'service': return renderService();
      case 'deadlines': return renderDeadlines();
      case 'tips': return renderTips();
      default: return renderOverview();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={styles.title}>
              Filing Guide: {guide.meta.formId} — {guide.meta.formLabel}
            </h1>
            <p style={styles.subtitle}>
              {guide.court.name} · Generated {new Date(guide.meta.generatedAt).toLocaleDateString()}
            </p>
          </div>
          <button style={styles.printBtn} onClick={() => onPrint?.(guide)}>
            ⎙ Export Guide
          </button>
        </div>
      </div>

      <div style={styles.tabs}>
        {TABS.map((tab) => (
          <div key={tab.id} style={styles.tab(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </div>
        ))}
      </div>

      {renderTab()}

      <div style={{ textAlign: 'center', padding: '16px', fontSize: '10px', color: COLORS.textMuted }}>
        {guide.meta.disclaimer}
      </div>
    </div>
  );
}
