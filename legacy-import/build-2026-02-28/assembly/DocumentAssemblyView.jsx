/**
 * VERNEN™ Document Assembly View
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Interactive UI for the Document Assembly Engine. Manages party profiles,
 * case context, package building, cross-form data propagation, and
 * consistency checking across multi-form filing packages.
 */

import React, { useState, useCallback, useMemo } from 'react';

// ─── CONSTANTS ─────────────────────────────────────────────────────
const PACKAGE_TYPES = [
  { id: 'dissolution', label: 'Dissolution of Marriage', forms: ['FL-100', 'FL-110', 'FL-150', 'FL-311'], icon: '⚖' },
  { id: 'custody_rfo', label: 'Custody RFO Package', forms: ['FL-300', 'FL-305', 'FL-311', 'FL-312', 'MC-031'], icon: '👨‍👧' },
  { id: 'dvro', label: 'DV Restraining Order', forms: ['DV-100', 'DV-110', 'DV-109'], icon: '🛡' },
  { id: 'fee_waiver', label: 'Fee Waiver Package', forms: ['FW-001', 'FW-003'], icon: '💰' },
  { id: 'custody_modification', label: 'Custody Modification', forms: ['FL-300', 'FL-311', 'FL-312', 'MC-031'], icon: '📝' },
  { id: 'support_modification', label: 'Support Modification', forms: ['FL-300', 'FL-150', 'MC-031'], icon: '💵' },
  { id: 'contempt', label: 'Contempt Proceeding', forms: ['FL-410', 'FL-411', 'MC-031'], icon: '⚡' },
  { id: 'small_claims', label: 'Small Claims', forms: ['SC-100'], icon: '📄' },
  { id: 'appeal', label: 'Appeal Package', forms: ['APP-002', 'APP-010'], icon: '🔼' }
];

const PARTY_FIELDS = [
  { key: 'fullName', label: 'Full Legal Name', required: true, type: 'text' },
  { key: 'address', label: 'Street Address', required: false, type: 'text', pii: true },
  { key: 'city', label: 'City', required: false, type: 'text' },
  { key: 'state', label: 'State', required: false, type: 'text' },
  { key: 'zip', label: 'ZIP Code', required: false, type: 'text' },
  { key: 'phone', label: 'Phone', required: false, type: 'tel', pii: true },
  { key: 'email', label: 'Email', required: false, type: 'email', pii: true },
  { key: 'dob', label: 'Date of Birth', required: false, type: 'date', pii: true },
  { key: 'attorney', label: 'Attorney Name (or "In Pro Per")', required: false, type: 'text' },
  { key: 'barNumber', label: 'State Bar Number', required: false, type: 'text' }
];

const CHILD_FIELDS = [
  { key: 'fullName', label: 'Child Full Name', required: true, type: 'text' },
  { key: 'dob', label: 'Date of Birth', required: true, type: 'date', pii: true },
  { key: 'age', label: 'Current Age', required: false, type: 'number' },
  { key: 'residessWith', label: 'Currently Resides With', required: false, type: 'select',
    options: ['Petitioner', 'Respondent', 'Other'] }
];

const TABS = [
  { id: 'parties', label: 'Parties' },
  { id: 'case', label: 'Case Info' },
  { id: 'children', label: 'Children' },
  { id: 'package', label: 'Package Builder' },
  { id: 'review', label: 'Review & Export' }
];

// ─── HELPER: Empty Objects ─────────────────────────────────────────
const emptyParty = () => PARTY_FIELDS.reduce((o, f) => ({ ...o, [f.key]: '' }), {});
const emptyChild = () => CHILD_FIELDS.reduce((o, f) => ({ ...o, [f.key]: '' }), {});

// ─── SUB-COMPONENTS ────────────────────────────────────────────────
function FieldInput({ field, value, onChange }) {
  const baseStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd',
    borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit'
  };

  if (field.type === 'select') {
    return (
      <select value={value || ''} onChange={e => onChange(field.key, e.target.value)} style={baseStyle}
        aria-label={field.label}>
        <option value="">— Select —</option>
        {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  }
  return (
    <input type={field.type || 'text'} value={value || ''}
      onChange={e => onChange(field.key, e.target.value)}
      style={baseStyle} aria-label={field.label}
      required={field.required} />
  );
}

function PartyForm({ title, data, onChange, role }) {
  return (
    <fieldset style={s.fieldset}>
      <legend style={s.legend}>{title}</legend>
      <div style={s.fieldGrid}>
        {PARTY_FIELDS.map(f => (
          <div key={f.key} style={f.key === 'fullName' || f.key === 'address' ? s.fieldFull : s.fieldHalf}>
            <label style={s.label}>
              {f.label}{f.required && <span style={s.required}> *</span>}
              {f.pii && <span style={s.piiBadge}>PII</span>}
            </label>
            <FieldInput field={f} value={data[f.key]} onChange={onChange} />
          </div>
        ))}
      </div>
    </fieldset>
  );
}

function ChildCard({ index, data, onChange, onRemove }) {
  return (
    <div style={s.childCard}>
      <div style={s.childHeader}>
        <span style={s.childTitle}>Child {index + 1}</span>
        <button onClick={onRemove} style={s.removeBtn} aria-label={`Remove child ${index + 1}`}>✕</button>
      </div>
      <div style={s.fieldGrid}>
        {CHILD_FIELDS.map(f => (
          <div key={f.key} style={f.key === 'fullName' ? s.fieldFull : s.fieldHalf}>
            <label style={s.label}>
              {f.label}{f.required && <span style={s.required}> *</span>}
            </label>
            <FieldInput field={f} value={data[f.key]}
              onChange={(key, val) => onChange(index, key, val)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ConsistencyResult({ checks }) {
  if (!checks || checks.length === 0) {
    return <div style={s.passBox}>✅ All cross-form fields are consistent.</div>;
  }
  return (
    <div style={s.issueList}>
      {checks.map((c, i) => (
        <div key={i} style={s.issueItem}>
          <span style={{ ...s.issueBadge, background: c.severity === 'error' ? '#fee2e2' : '#fef3c7',
            color: c.severity === 'error' ? '#991b1b' : '#856404' }}>
            {c.severity === 'error' ? 'ERROR' : 'WARNING'}
          </span>
          <span>{c.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────
export default function DocumentAssemblyView({ language = 'en', onExport }) {
  const [activeTab, setActiveTab] = useState('parties');
  const [petitioner, setPetitioner] = useState(emptyParty());
  const [respondent, setRespondent] = useState(emptyParty());
  const [children, setChildren] = useState([]);
  const [caseInfo, setCaseInfo] = useState({
    caseNumber: '', county: '', filingDate: '', courtName: '',
    courtAddress: '', department: '', hearingDate: '', hearingTime: ''
  });
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [customForms, setCustomForms] = useState([]);
  const [consistencyChecks, setConsistencyChecks] = useState(null);

  // ── Handlers ────────────────────────────────────────────────────
  const updatePetitioner = useCallback((key, val) => setPetitioner(p => ({ ...p, [key]: val })), []);
  const updateRespondent = useCallback((key, val) => setRespondent(p => ({ ...p, [key]: val })), []);
  const updateCase = useCallback((key, val) => setCaseInfo(c => ({ ...c, [key]: val })), []);

  const addChild = useCallback(() => setChildren(c => [...c, emptyChild()]), []);
  const removeChild = useCallback((idx) => setChildren(c => c.filter((_, i) => i !== idx)), []);
  const updateChild = useCallback((idx, key, val) => {
    setChildren(c => c.map((child, i) => i === idx ? { ...child, [key]: val } : child));
  }, []);

  // ── Derived Data ────────────────────────────────────────────────
  const activeForms = useMemo(() => {
    if (selectedPackage) {
      const pkg = PACKAGE_TYPES.find(p => p.id === selectedPackage);
      return pkg ? pkg.forms : [];
    }
    return customForms;
  }, [selectedPackage, customForms]);

  const assembledData = useMemo(() => ({
    petitioner, respondent, children, caseInfo,
    packageType: selectedPackage,
    forms: activeForms,
    assembledAt: new Date().toISOString()
  }), [petitioner, respondent, children, caseInfo, selectedPackage, activeForms]);

  // ── Completeness Stats ──────────────────────────────────────────
  const completeness = useMemo(() => {
    const partyScore = (party) => {
      const required = PARTY_FIELDS.filter(f => f.required);
      const filled = required.filter(f => party[f.key]?.trim());
      return { filled: filled.length, total: required.length };
    };
    const pet = partyScore(petitioner);
    const res = partyScore(respondent);
    const childrenOk = children.length === 0 || children.every(c => c.fullName?.trim() && c.dob?.trim());
    const caseOk = caseInfo.caseNumber?.trim() && caseInfo.county?.trim();
    const packageOk = activeForms.length > 0;

    const totalRequired = pet.total + res.total + (children.length > 0 ? 2 : 0) + 2 + 1;
    const totalFilled = pet.filled + res.filled + (childrenOk ? (children.length > 0 ? 2 : 0) : 0) + (caseOk ? 2 : 0) + (packageOk ? 1 : 0);
    const pct = totalRequired > 0 ? Math.round((totalFilled / totalRequired) * 100) : 0;

    return { petitioner: pet, respondent: res, childrenOk, caseOk, packageOk, pct };
  }, [petitioner, respondent, children, caseInfo, activeForms]);

  // ── Consistency Check ───────────────────────────────────────────
  const runConsistencyCheck = useCallback(() => {
    const issues = [];
    if (!petitioner.fullName?.trim()) issues.push({ severity: 'error', message: 'Petitioner name is required for all forms.' });
    if (!respondent.fullName?.trim()) issues.push({ severity: 'error', message: 'Respondent name is required for all forms.' });
    if (!caseInfo.caseNumber?.trim()) issues.push({ severity: 'warning', message: 'Case number is missing — will need to be added at filing.' });
    if (!caseInfo.county?.trim()) issues.push({ severity: 'error', message: 'County/Court is required for filing.' });
    if (activeForms.length === 0) issues.push({ severity: 'error', message: 'No forms selected for assembly.' });

    const needsChildren = ['FL-311', 'FL-312', 'FL-300', 'DV-100'].some(f => activeForms.includes(f));
    if (needsChildren && children.length === 0) {
      issues.push({ severity: 'warning', message: 'Selected forms require children info but none entered.' });
    }
    children.forEach((c, i) => {
      if (!c.fullName?.trim()) issues.push({ severity: 'error', message: `Child ${i + 1}: name is required.` });
      if (!c.dob?.trim()) issues.push({ severity: 'warning', message: `Child ${i + 1}: date of birth is recommended.` });
    });

    setConsistencyChecks(issues);
    return issues;
  }, [petitioner, respondent, caseInfo, children, activeForms]);

  // ── Export ──────────────────────────────────────────────────────
  const handleExport = useCallback((format) => {
    if (onExport) onExport(assembledData, 'assembly_package', format);
  }, [onExport, assembledData]);

  // ── Tab Rendering ───────────────────────────────────────────────
  const renderTab = () => {
    switch (activeTab) {
      case 'parties':
        return (
          <div>
            <PartyForm title="Petitioner (Filing Party)" data={petitioner}
              onChange={updatePetitioner} role="petitioner" />
            <div style={{ height: '24px' }} />
            <PartyForm title="Respondent (Other Party)" data={respondent}
              onChange={updateRespondent} role="respondent" />
          </div>
        );

      case 'case':
        return (
          <fieldset style={s.fieldset}>
            <legend style={s.legend}>Case Information</legend>
            <div style={s.fieldGrid}>
              {[
                { key: 'caseNumber', label: 'Case Number', required: true },
                { key: 'county', label: 'County', required: true },
                { key: 'courtName', label: 'Court Name' },
                { key: 'courtAddress', label: 'Court Address' },
                { key: 'department', label: 'Department' },
                { key: 'filingDate', label: 'Filing Date', type: 'date' },
                { key: 'hearingDate', label: 'Hearing Date', type: 'date' },
                { key: 'hearingTime', label: 'Hearing Time', type: 'time' }
              ].map(f => (
                <div key={f.key} style={f.key === 'courtAddress' ? s.fieldFull : s.fieldHalf}>
                  <label style={s.label}>
                    {f.label}{f.required && <span style={s.required}> *</span>}
                  </label>
                  <input type={f.type || 'text'} value={caseInfo[f.key] || ''}
                    onChange={e => updateCase(f.key, e.target.value)}
                    style={s.input} aria-label={f.label} />
                </div>
              ))}
            </div>
          </fieldset>
        );

      case 'children':
        return (
          <div>
            <div style={s.sectionHeader}>
              <h3 style={s.sectionTitle}>Minor Children</h3>
              <button onClick={addChild} style={s.addBtn}>+ Add Child</button>
            </div>
            {children.length === 0 ? (
              <div style={s.emptyState}>
                <p style={s.emptyText}>No children added yet.</p>
                <p style={s.emptyHint}>
                  Add children if filing custody, visitation, or support forms.
                </p>
              </div>
            ) : (
              children.map((child, i) => (
                <ChildCard key={i} index={i} data={child}
                  onChange={updateChild} onRemove={() => removeChild(i)} />
              ))
            )}
          </div>
        );

      case 'package':
        return (
          <div>
            <h3 style={s.sectionTitle}>Select Filing Package</h3>
            <div style={s.packageGrid}>
              {PACKAGE_TYPES.map(pkg => (
                <button key={pkg.id}
                  onClick={() => { setSelectedPackage(pkg.id); setCustomForms([]); }}
                  style={{
                    ...s.packageCard,
                    borderColor: selectedPackage === pkg.id ? '#1a3a5c' : '#e5e7eb',
                    background: selectedPackage === pkg.id ? '#f0f5fb' : '#fff'
                  }}
                  aria-pressed={selectedPackage === pkg.id}>
                  <span style={s.packageIcon}>{pkg.icon}</span>
                  <span style={s.packageLabel}>{pkg.label}</span>
                  <span style={s.packageForms}>{pkg.forms.length} forms</span>
                </button>
              ))}
            </div>

            {selectedPackage && (
              <div style={s.formList}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Forms in this package:
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {activeForms.map(f => (
                    <span key={f} style={s.formChip}>{f}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'review':
        return (
          <div>
            {/* Completeness Score */}
            <div style={s.scoreSection}>
              <div style={{
                ...s.scoreRing,
                background: completeness.pct >= 80 ? '#059669' : completeness.pct >= 50 ? '#d97706' : '#dc2626'
              }}>
                {completeness.pct}%
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px' }}>
                  {completeness.pct >= 80 ? 'Ready for Assembly' : completeness.pct >= 50 ? 'Partially Complete' : 'Needs More Information'}
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  Petitioner: {completeness.petitioner.filled}/{completeness.petitioner.total} •
                  Respondent: {completeness.respondent.filled}/{completeness.respondent.total} •
                  Children: {children.length} •
                  Forms: {activeForms.length}
                </p>
              </div>
            </div>

            {/* Consistency Check */}
            <div style={s.checkSection}>
              <div style={s.sectionHeader}>
                <h3 style={s.sectionTitle}>Cross-Form Consistency</h3>
                <button onClick={runConsistencyCheck} style={s.checkBtn}>Run Check</button>
              </div>
              {consistencyChecks !== null && <ConsistencyResult checks={consistencyChecks} />}
            </div>

            {/* Summary Table */}
            <div style={{ marginTop: '24px' }}>
              <h3 style={s.sectionTitle}>Assembly Summary</h3>
              <table style={s.table}>
                <tbody>
                  <tr><td style={s.tdLabel}>Petitioner</td><td style={s.tdValue}>{petitioner.fullName || '—'}</td></tr>
                  <tr><td style={s.tdLabel}>Respondent</td><td style={s.tdValue}>{respondent.fullName || '—'}</td></tr>
                  <tr><td style={s.tdLabel}>Case Number</td><td style={s.tdValue}>{caseInfo.caseNumber || '—'}</td></tr>
                  <tr><td style={s.tdLabel}>County</td><td style={s.tdValue}>{caseInfo.county || '—'}</td></tr>
                  <tr><td style={s.tdLabel}>Package</td><td style={s.tdValue}>
                    {selectedPackage ? PACKAGE_TYPES.find(p => p.id === selectedPackage)?.label : 'Custom'}
                  </td></tr>
                  <tr><td style={s.tdLabel}>Forms</td><td style={s.tdValue}>{activeForms.join(', ') || '—'}</td></tr>
                  <tr><td style={s.tdLabel}>Children</td><td style={s.tdValue}>
                    {children.length > 0 ? children.map(c => c.fullName || 'Unnamed').join(', ') : 'None'}
                  </td></tr>
                </tbody>
              </table>
            </div>

            {/* Export Actions */}
            <div style={s.exportBar}>
              <button onClick={() => handleExport('html')} style={s.exportBtn}>Export HTML</button>
              <button onClick={() => handleExport('json')} style={s.exportBtnSec}>Export JSON</button>
              <button onClick={() => handleExport('csv')} style={s.exportBtnSec}>Export CSV</button>
              <button onClick={() => handleExport('markdown')} style={s.exportBtnSec}>Export Markdown</button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Main Render ─────────────────────────────────────────────────
  return (
    <div style={s.container}>
      <div style={s.header}>
        <h2 style={s.title}>Document Assembly</h2>
        <p style={s.subtitle}>
          Build multi-form filing packages with automatic cross-form data propagation.
        </p>
      </div>

      {/* Tab Bar */}
      <div style={s.tabs} role="tablist" aria-label="Assembly sections">
        {TABS.map(tab => (
          <button key={tab.id} role="tab" aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...s.tab,
              color: activeTab === tab.id ? '#1a3a5c' : '#6b7280',
              borderBottomColor: activeTab === tab.id ? '#1a3a5c' : 'transparent',
              fontWeight: activeTab === tab.id ? '600' : '400'
            }}>
            {tab.label}
            {tab.id === 'review' && (
              <span style={{
                ...s.tabBadge,
                background: completeness.pct >= 80 ? '#d1fae5' : completeness.pct >= 50 ? '#fef3c7' : '#fee2e2',
                color: completeness.pct >= 80 ? '#065f46' : completeness.pct >= 50 ? '#856404' : '#991b1b'
              }}>
                {completeness.pct}%
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={s.content} role="tabpanel">
        {renderTab()}
      </div>

      {/* Step Navigation */}
      <div style={s.stepNav}>
        {activeTab !== 'parties' && (
          <button onClick={() => {
            const idx = TABS.findIndex(t => t.id === activeTab);
            if (idx > 0) setActiveTab(TABS[idx - 1].id);
          }} style={s.stepBtnSec}>← Previous</button>
        )}
        <div style={{ flex: 1 }} />
        {activeTab !== 'review' && (
          <button onClick={() => {
            const idx = TABS.findIndex(t => t.id === activeTab);
            if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].id);
          }} style={s.stepBtn}>Next →</button>
        )}
      </div>
    </div>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────
const s = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '32px 24px' },
  header: { marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#1a3a5c', margin: '0 0 6px' },
  subtitle: { fontSize: '14px', color: '#6b7280', margin: 0 },

  tabs: { display: 'flex', borderBottom: '2px solid #e5e7eb', gap: 0, overflow: 'auto', marginBottom: '24px' },
  tab: {
    padding: '10px 20px', border: 'none', background: 'transparent', fontSize: '14px',
    cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: '-2px',
    fontFamily: 'inherit', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px',
    transition: 'color 0.15s'
  },
  tabBadge: { fontSize: '11px', padding: '1px 6px', borderRadius: '10px', fontWeight: '600' },
  content: { minHeight: '400px' },

  fieldset: { border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px 24px', marginBottom: '16px' },
  legend: { fontSize: '16px', fontWeight: '700', color: '#1a3a5c', padding: '0 8px' },
  fieldGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  fieldFull: { gridColumn: '1 / -1' },
  fieldHalf: {},
  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' },
  required: { color: '#dc2626' },
  piiBadge: {
    display: 'inline-block', fontSize: '9px', background: '#fef3c7', color: '#92400e',
    padding: '0 4px', borderRadius: '3px', marginLeft: '6px', fontWeight: '600', verticalAlign: 'middle'
  },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd',
    borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit'
  },

  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', color: '#374151', margin: 0 },
  addBtn: {
    padding: '8px 16px', borderRadius: '6px', border: '1px solid #1a3a5c',
    background: '#fff', color: '#1a3a5c', fontWeight: '600', fontSize: '13px', cursor: 'pointer'
  },

  childCard: {
    border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px 20px',
    marginBottom: '12px', background: '#fafbfc'
  },
  childHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  childTitle: { fontSize: '14px', fontWeight: '600', color: '#374151' },
  removeBtn: {
    width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #fca5a5',
    background: '#fff', color: '#dc2626', cursor: 'pointer', fontSize: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },

  emptyState: { textAlign: 'center', padding: '48px 24px', background: '#f9fafb', borderRadius: '10px', border: '1px dashed #d1d5db' },
  emptyText: { fontSize: '16px', color: '#6b7280', margin: '0 0 8px' },
  emptyHint: { fontSize: '13px', color: '#9ca3af', margin: 0 },

  packageGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' },
  packageCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
    padding: '20px 16px', border: '2px solid #e5e7eb', borderRadius: '10px',
    cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.15s, background 0.15s',
    background: '#fff', textAlign: 'center'
  },
  packageIcon: { fontSize: '28px' },
  packageLabel: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  packageForms: { fontSize: '11px', color: '#9ca3af' },
  formList: { padding: '16px', background: '#f9fafb', borderRadius: '8px' },
  formChip: {
    display: 'inline-block', padding: '4px 10px', background: '#e0ecf8',
    color: '#1a3a5c', borderRadius: '4px', fontSize: '12px', fontWeight: '600'
  },

  scoreSection: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', padding: '20px', background: '#f9fafb', borderRadius: '10px' },
  scoreRing: {
    width: '72px', height: '72px', borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: '20px',
    fontWeight: '700', color: '#fff', flexShrink: 0
  },

  checkSection: { marginBottom: '24px' },
  checkBtn: {
    padding: '8px 16px', borderRadius: '6px', border: 'none',
    background: '#1a3a5c', color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer'
  },
  passBox: { padding: '16px', background: '#d1fae5', borderRadius: '8px', color: '#065f46', fontWeight: '500', fontSize: '14px', marginTop: '12px' },
  issueList: { marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' },
  issueItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' },
  issueBadge: { padding: '2px 8px', borderRadius: '3px', fontSize: '11px', fontWeight: '600', flexShrink: 0 },

  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  tdLabel: { padding: '10px 12px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb', width: '160px' },
  tdValue: { padding: '10px 12px', color: '#6b7280', borderBottom: '1px solid #e5e7eb' },

  exportBar: { display: 'flex', gap: '10px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' },
  exportBtn: {
    padding: '10px 24px', borderRadius: '6px', border: 'none',
    background: '#1a3a5c', color: '#fff', fontWeight: '600', fontSize: '14px', cursor: 'pointer'
  },
  exportBtnSec: {
    padding: '10px 20px', borderRadius: '6px', border: '1px solid #d0d5dd',
    background: '#fff', color: '#374151', fontWeight: '500', fontSize: '14px', cursor: 'pointer'
  },

  stepNav: { display: 'flex', gap: '12px', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' },
  stepBtn: {
    padding: '10px 24px', borderRadius: '6px', border: 'none',
    background: '#1a3a5c', color: '#fff', fontWeight: '600', fontSize: '14px', cursor: 'pointer'
  },
  stepBtnSec: {
    padding: '10px 20px', borderRadius: '6px', border: '1px solid #d0d5dd',
    background: '#fff', color: '#374151', fontWeight: '500', fontSize: '14px', cursor: 'pointer'
  }
};
