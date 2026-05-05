/**
 * VERNEN™ Help Panel
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Contextual help system with slide-out panel, field-level tooltips,
 * keyboard shortcut reference, module-specific guidance, and
 * multilingual support stubs.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ─── HELP CONTENT DATABASE ─────────────────────────────────────────
const HELP_CONTENT = {
  dashboard: {
    title: 'Getting Started',
    sections: [
      {
        heading: 'Welcome to VERNEN™',
        body: 'VERNEN is a multilingual legal compliance platform that helps you navigate California Judicial Council forms. Choose a module from the dashboard or sidebar to begin.'
      },
      {
        heading: 'Workflow Overview',
        steps: [
          'Select your form(s) in the Document Navigator',
          'Fill in fields with guided annotations in your preferred language',
          'Run pre-filing validation to catch errors and missing fields',
          'Review the Filing Guide for court-specific instructions and fees',
          'Generate an audit report for compliance documentation',
          'Use Document Assembly for multi-form packages'
        ]
      }
    ]
  },
  gdn: {
    title: 'Document Navigator Help',
    sections: [
      {
        heading: 'Selecting a Form',
        body: 'Choose a form category (Family Law, Domestic Violence, Fee Waiver, etc.) then select the specific form. Each form includes field-level annotations explaining what to enter.'
      },
      {
        heading: 'Language Support',
        body: 'All form guidance is available in 13 languages. Change your language using the selector in the sidebar or Settings panel. Annotations, tooltips, and legal glossary terms will update automatically.'
      },
      {
        heading: 'Field Annotations',
        body: 'Click the ⓘ icon next to any field to see detailed guidance including: what information to enter, legal definitions, common mistakes to avoid, and statutory references.'
      }
    ]
  },
  validation: {
    title: 'Validation Help',
    sections: [
      {
        heading: 'Compliance Scoring',
        body: 'The validation engine checks your forms against 41+ rules including required fields, format validation, deadline compliance, and cross-form dependency checks. Scores above 80% indicate filing readiness.'
      },
      {
        heading: 'Error Severity Levels',
        items: [
          { label: 'Critical', desc: 'Must fix before filing — form will be rejected' },
          { label: 'Error', desc: 'Should fix — may cause delays or issues' },
          { label: 'Warning', desc: 'Review recommended — may not affect filing' },
          { label: 'Info', desc: 'Informational — best practice suggestions' }
        ]
      }
    ]
  },
  filing_guide: {
    title: 'Filing Guide Help',
    sections: [
      {
        heading: 'Court Information',
        body: 'Filing guides include court-specific details for 5 Bay Area counties (Alameda, Solano, Marin, San Francisco, Contra Costa). Each guide shows the court address, filing hours, e-filing availability, and contact information.'
      },
      {
        heading: 'Fee Schedule',
        body: 'Fee amounts are based on current court schedules. If you qualify for a fee waiver (FW-001), most filing fees can be waived. The guide indicates which fees are waivable.'
      },
      {
        heading: 'Service Requirements',
        body: 'After filing, most documents must be served on the other party. The guide shows service method requirements (personal, mail, electronic) with statutory citations for each form.'
      }
    ]
  },
  audit: {
    title: 'Audit Report Help',
    sections: [
      {
        heading: 'Audit Categories',
        body: 'Reports evaluate 7 categories: Completeness, Accuracy, Compliance, Service, Deadlines, Cross-Form Consistency, and Procedural requirements. Each category receives an individual score.'
      },
      {
        heading: 'Risk Assessment',
        body: 'Findings are rated CRITICAL, HIGH, MEDIUM, LOW, or INFO. The overall risk assessment considers finding severity, frequency, and potential impact on your filing.'
      }
    ]
  },
  assembly: {
    title: 'Document Assembly Help',
    sections: [
      {
        heading: 'Party Profiles',
        body: 'Enter petitioner and respondent information once. This data automatically propagates to all forms in your package, ensuring consistency across documents.'
      },
      {
        heading: 'Package Types',
        body: 'Pre-configured packages bundle the correct forms for common filings (dissolution, custody RFO, DVRO, fee waiver, etc.). You can also build custom packages.'
      },
      {
        heading: 'Consistency Check',
        body: 'Before exporting, run the consistency check to verify that party names, case numbers, and court information match across all forms in your package.'
      }
    ]
  }
};

const KEYBOARD_SHORTCUTS = [
  { keys: 'Alt + 1', action: 'Go to main content' },
  { keys: 'Alt + 2', action: 'Go to form section' },
  { keys: 'Alt + 3', action: 'Go to results section' },
  { keys: 'Alt + H', action: 'Toggle high contrast' },
  { keys: 'Alt + T', action: 'Toggle large text' },
  { keys: 'Alt + M', action: 'Toggle reduced motion' },
  { keys: 'Escape', action: 'Close modal / help panel' },
  { keys: '?', action: 'Open help panel (when not in input)' }
];

// ─── TOOLTIP COMPONENT ─────────────────────────────────────────────
export function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  const show = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
    }
    setVisible(true);
  }, []);

  return (
    <span ref={triggerRef} onMouseEnter={show} onMouseLeave={() => setVisible(false)}
      onFocus={show} onBlur={() => setVisible(false)}
      style={{ position: 'relative', display: 'inline-flex', cursor: 'help' }}
      aria-describedby={visible ? 'vernen-tooltip' : undefined}>
      {children}
      {visible && (
        <span id="vernen-tooltip" role="tooltip" style={{
          position: 'fixed', top: position.top, left: position.left,
          transform: 'translateX(-50%)', background: '#1f2937', color: '#fff',
          padding: '6px 12px', borderRadius: '6px', fontSize: '12px',
          maxWidth: '280px', lineHeight: '1.4', zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', whiteSpace: 'normal',
          pointerEvents: 'none'
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

// ─── FIELD HELP ICON ───────────────────────────────────────────────
export function FieldHelp({ text }) {
  return (
    <Tooltip text={text}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '18px', height: '18px', borderRadius: '50%', background: '#e0ecf8',
        color: '#1a3a5c', fontSize: '11px', fontWeight: '700', marginLeft: '6px',
        verticalAlign: 'middle', cursor: 'help'
      }} aria-label="Help">ⓘ</span>
    </Tooltip>
  );
}

// ─── HELP PANEL (SLIDE-OUT) ────────────────────────────────────────
export default function HelpPanel({ isOpen, onClose, activeModule = 'dashboard' }) {
  const [activeSection, setActiveSection] = useState('context');
  const panelRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  const content = HELP_CONTENT[activeModule] || HELP_CONTENT.dashboard;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
        zIndex: 998, transition: 'opacity 0.2s'
      }} aria-hidden="true" />

      {/* Panel */}
      <aside ref={panelRef} tabIndex={-1} role="complementary"
        aria-label="Help panel" style={{
          position: 'fixed', top: 0, right: 0, width: '380px', maxWidth: '90vw',
          height: '100vh', background: '#fff', zIndex: 999,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', display: 'flex',
          flexDirection: 'column', fontFamily: "'Segoe UI', sans-serif",
          animation: 'vernen-slide-in 0.2s ease'
        }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #e5e7eb', flexShrink: 0
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a5c', margin: 0 }}>
            Help
          </h2>
          <button onClick={onClose} aria-label="Close help panel" style={{
            width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #e5e7eb',
            background: '#fff', fontSize: '16px', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>✕</button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
          {[
            { id: 'context', label: 'This Page' },
            { id: 'shortcuts', label: 'Shortcuts' },
            { id: 'about', label: 'About' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveSection(tab.id)} style={{
              flex: 1, padding: '10px', border: 'none', background: 'transparent',
              fontSize: '13px', fontWeight: activeSection === tab.id ? '600' : '400',
              color: activeSection === tab.id ? '#1a3a5c' : '#6b7280',
              borderBottom: activeSection === tab.id ? '2px solid #1a3a5c' : '2px solid transparent',
              cursor: 'pointer', fontFamily: 'inherit'
            }}>{tab.label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {activeSection === 'context' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a3a5c', marginBottom: '16px' }}>
                {content.title}
              </h3>
              {content.sections.map((section, i) => (
                <div key={i} style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    {section.heading}
                  </h4>
                  {section.body && (
                    <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
                      {section.body}
                    </p>
                  )}
                  {section.steps && (
                    <ol style={{ paddingLeft: '20px', margin: '8px 0 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.8' }}>
                      {section.steps.map((step, j) => <li key={j}>{step}</li>)}
                    </ol>
                  )}
                  {section.items && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      {section.items.map((item, j) => (
                        <div key={j} style={{
                          padding: '8px 12px', background: '#f9fafb', borderRadius: '6px',
                          borderLeft: '3px solid #1a3a5c'
                        }}>
                          <strong style={{ fontSize: '13px', color: '#374151' }}>{item.label}:</strong>
                          <span style={{ fontSize: '13px', color: '#6b7280', marginLeft: '6px' }}>{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeSection === 'shortcuts' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a3a5c', marginBottom: '16px' }}>
                Keyboard Shortcuts
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {KEYBOARD_SHORTCUTS.map((shortcut, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', background: '#f9fafb', borderRadius: '6px'
                  }}>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>{shortcut.action}</span>
                    <kbd style={{
                      padding: '2px 8px', background: '#fff', border: '1px solid #d0d5dd',
                      borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace',
                      color: '#374151', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>{shortcut.keys}</kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'about' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a3a5c', marginBottom: '16px' }}>
                About VERNEN™
              </h3>
              <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.7' }}>
                <p style={{ marginBottom: '12px' }}>
                  VERNEN™ is a multilingual legal compliance platform designed to help pro se
                  litigants navigate California court forms with confidence. The platform
                  covers 28 Judicial Council forms across 10 legal domains in 13 languages.
                </p>
                <p style={{ marginBottom: '12px' }}>
                  <strong>Coverage:</strong> Family Law, Domestic Violence, Child Custody,
                  Support, Fee Waivers, Small Claims, Civil Harassment, Housing,
                  Elder Abuse, and Appeals.
                </p>
                <p style={{ marginBottom: '12px' }}>
                  <strong>Languages:</strong> English, Spanish, Chinese, Vietnamese, Korean,
                  Arabic, Tagalog, Russian, Portuguese, Haitian Creole, Somali, Tigrinya, Amharic.
                </p>
                <div style={{
                  marginTop: '20px', padding: '16px', background: '#fef3c7',
                  borderRadius: '8px', border: '1px solid #fbbf24'
                }}>
                  <strong style={{ color: '#92400e' }}>Disclaimer:</strong>
                  <p style={{ margin: '4px 0 0', color: '#92400e', fontSize: '12px' }}>
                    VERNEN™ provides legal form guidance and compliance checking. It does not
                    provide legal advice. For legal counsel, consult a licensed attorney in
                    your jurisdiction.
                  </p>
                </div>
                <p style={{ marginTop: '20px', fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
                  © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.<br />
                  VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.<br />
                  IP Manifest Filed February 2, 2026.
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      <style>{`
        @keyframes vernen-slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
