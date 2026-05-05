/**
 * VERNEN™ Application Shell — INTEGRATED
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Main application entry with full platform integration:
 * - PlatformProvider wraps all components with shared state
 * - ModuleConnector registers all engines on startup
 * - Custom hooks feed live data between GDN ↔ Validation ↔ Filing ↔ Audit
 * - Assembly view fully wired with cross-form data propagation
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

// Auth
import { AuthProvider, useAuth, useAccessControl } from './auth/AuthContext.jsx';

// Payments
import { PaymentProvider } from './payments/PaymentContext.jsx';

// Platform integration
import { PlatformProvider, usePlatform } from './platform/PlatformContext.jsx';
import { connectAllModules } from './platform/ModuleConnector.js';
import {
  useFormData,
  useValidation,
  useFilingGuide,
  useAudit,
  useAssembly,
  useLanguage,
} from './platform/useVERNEN.js';

// Infrastructure
import ErrorBoundary, { installGlobalErrorHandler, errorLogger } from './errors/ErrorBoundary.jsx';
import { createPersistenceManager } from './persistence/PersistenceManager.js';
import { createExportEngine, EXPORT_FORMATS, MODULE_TYPES } from './export/ExportEngine.js';
import { createAccessibilityManager } from './a11y/AccessibilityManager.js';

// Lazy-loaded view modules
const GDNNavigator = React.lazy(() => import('./gdn_navigator/GDN_Navigator.jsx'));
const ValidationResults = React.lazy(() => import('./validation_engine/ValidationResults.jsx'));
const FilingGuideView = React.lazy(() => import('./filing_guide/FilingGuideView.jsx'));
const AuditReportView = React.lazy(() => import('./audit/AuditReportView.jsx'));
const DocumentAssemblyView = React.lazy(() => import('./assembly/DocumentAssemblyView.jsx'));
const HelpPanel = React.lazy(() => import('./help/HelpPanel.jsx'));

// ─── CONSTANTS ─────────────────────────────────────────────────────
const VIEWS = {
  DASHBOARD: 'dashboard',
  GDN: 'gdn',
  VALIDATION: 'validation',
  FILING_GUIDE: 'filing_guide',
  AUDIT: 'audit',
  ASSEMBLY: 'assembly',
  SETTINGS: 'settings',
  HELP: 'help',
};

const NAV_ITEMS = [
  { id: VIEWS.DASHBOARD, label: 'Dashboard', icon: '◉' },
  { id: VIEWS.GDN, label: 'Document Navigator', icon: '📋' },
  { id: VIEWS.VALIDATION, label: 'Validation', icon: '✓' },
  { id: VIEWS.FILING_GUIDE, label: 'Filing Guide', icon: '⚖' },
  { id: VIEWS.AUDIT, label: 'Audit Report', icon: '🔍' },
  { id: VIEWS.ASSEMBLY, label: 'Assembly', icon: '📦' },
  { id: VIEWS.SETTINGS, label: 'Settings', icon: '⚙' },
  { id: VIEWS.HELP, label: 'Help', icon: '?' },
];

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' }, { code: 'es', label: 'Español' },
  { code: 'zh', label: '中文' }, { code: 'vi', label: 'Tiếng Việt' },
  { code: 'ko', label: '한국어' }, { code: 'ar', label: 'العربية' },
  { code: 'tl', label: 'Tagalog' }, { code: 'ru', label: 'Русский' },
  { code: 'pt', label: 'Português' }, { code: 'ht', label: 'Kreyòl' },
  { code: 'so', label: 'Soomaali' }, { code: 'ti', label: 'ትግርኛ' },
  { code: 'am', label: 'አማርኛ' },
];

// ─── LOADING SPINNER ───────────────────────────────────────────────
function LoadingSpinner({ message = 'Loading module...' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '300px', gap: '16px',
    }} role="status" aria-label={message}>
      <div style={{
        width: '40px', height: '40px', border: '3px solid #e5e7eb',
        borderTopColor: '#1a3a5c', borderRadius: '50%',
        animation: 'vernen-spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>{message}</p>
    </div>
  );
}

// ─── LIVE STATUS BAR ───────────────────────────────────────────────
// Shows real-time platform state: active form, validation score, county
function StatusBar() {
  const { state, ready } = usePlatform();
  if (!ready) return null;

  const currentForm = state?.currentForm;
  const score = state?.validationResults?.score;
  const county = state?.currentCounty;
  const lang = state?.currentLanguage || 'en';
  const formCount = Object.keys(state?.formData || {}).length;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '16px',
      padding: '8px 16px', background: '#f0f4f8',
      borderBottom: '1px solid #e2e8f0', fontSize: '12px', color: '#475569',
      flexWrap: 'wrap',
    }}>
      {currentForm && (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontWeight: '600' }}>Form:</span> {currentForm}
        </span>
      )}
      {score !== null && score !== undefined && (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444',
          }} />
          <span style={{ fontWeight: '600' }}>Score:</span> {score}%
        </span>
      )}
      {county && (
        <span><span style={{ fontWeight: '600' }}>County:</span> {county}</span>
      )}
      {formCount > 0 && (
        <span><span style={{ fontWeight: '600' }}>Forms:</span> {formCount} active</span>
      )}
      <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>
        Lang: {lang.toUpperCase()} | Platform {ready ? '● Active' : '○ Loading'}
      </span>
    </div>
  );
}

// ─── DASHBOARD ─────────────────────────────────────────────────────
function Dashboard({ onNavigate }) {
  const { state } = usePlatform();
  const formCount = Object.keys(state?.formData || {}).length;
  const lastScore = state?.validationResults?.score;

  const cards = [
    {
      id: VIEWS.GDN, title: 'Document Navigator',
      desc: 'Complete California Judicial Council forms with guided assistance in 13 languages.',
      stat: `${formCount} form${formCount !== 1 ? 's' : ''} in progress`,
      color: '#1a3a5c',
    },
    {
      id: VIEWS.VALIDATION, title: 'Pre-Filing Validation',
      desc: 'Check forms for compliance errors, missing fields, and deadline issues.',
      stat: lastScore != null ? `Last score: ${lastScore}%` : 'Real-time compliance scoring',
      color: '#059669',
    },
    {
      id: VIEWS.FILING_GUIDE, title: 'Filing Guide',
      desc: 'Court-specific checklists, fee schedules, service requirements, and deadline calculators.',
      stat: '5 Bay Area courts covered',
      color: '#7c3aed',
    },
    {
      id: VIEWS.AUDIT, title: 'Compliance Audit',
      desc: 'Structured audit reports with risk assessment, recommendations, and filing readiness.',
      stat: 'Professional-grade reports',
      color: '#d97706',
    },
    {
      id: VIEWS.ASSEMBLY, title: 'Document Assembly',
      desc: 'Auto-populate multi-form packages with cross-form data propagation.',
      stat: `${formCount} form${formCount !== 1 ? 's' : ''} ready to assemble`,
      color: '#dc2626',
    },
  ];

  return (
    <div id="main-content" style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: '800', color: '#1a3a5c', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          VERNEN™
        </h1>
        <p style={{ fontSize: '18px', color: '#475569', margin: '0 0 12px', fontWeight: '500' }}>
          Multilingual Legal Compliance Platform
        </p>
        <p style={{ fontSize: '15px', color: '#6b7280', margin: '0 auto', maxWidth: '600px', lineHeight: '1.6' }}>
          Navigate California court forms, validate compliance, and generate professional
          filing packages — in 13 languages.
        </p>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px', marginBottom: '48px',
      }}>
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => onNavigate(card.id)}
            style={{
              background: '#fff', border: '1px solid #e5e7eb', borderTop: `4px solid ${card.color}`,
              borderRadius: '10px', padding: '24px', textAlign: 'left', cursor: 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              fontFamily: 'inherit', width: '100%',
            }}
            aria-label={`Open ${card.title}`}
          >
            <h3 style={{ fontSize: '17px', fontWeight: '700', margin: '0 0 8px', color: card.color }}>{card.title}</h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 12px', lineHeight: '1.5' }}>{card.desc}</p>
            <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {card.stat}
            </span>
          </button>
        ))}
      </div>
      <div style={{ textAlign: 'center', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
        <p style={{ fontSize: '12px', color: '#9ca3af', maxWidth: '600px', margin: '0 auto 8px' }}>
          VERNEN™ provides legal form guidance and compliance checking. It does not provide legal advice.
        </p>
        <p style={{ fontSize: '11px', color: '#d1d5db' }}>
          © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}

// ─── SETTINGS PANEL ────────────────────────────────────────────────
function SettingsPanel({ a11yPrefs, onA11yToggle, onExportLogs }) {
  const { language, changeLanguage } = useLanguage();

  return (
    <div id="main-content" style={{ maxWidth: '700px', margin: '0 auto', padding: '32px 24px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a3a5c', marginBottom: '24px' }}>Settings</h2>
      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>Language</h3>
        <select
          value={language}
          onChange={(e) => changeLanguage(e.target.value)}
          style={{ width: '100%', maxWidth: '300px', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: '6px', fontSize: '14px' }}
          aria-label="Select language"
        >
          {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </section>
      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>Accessibility</h3>
        {[
          { key: 'highContrast', label: 'High Contrast Mode' },
          { key: 'largeText', label: 'Large Text' },
          { key: 'reducedMotion', label: 'Reduced Motion' },
          { key: 'focusIndicators', label: 'Enhanced Focus Indicators' },
        ].map(pref => (
          <label key={pref.key} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
            <input type="checkbox" checked={a11yPrefs[pref.key] || false} onChange={() => onA11yToggle(pref.key)}
              style={{ marginRight: '12px', width: '18px', height: '18px' }} />
            {pref.label}
          </label>
        ))}
      </section>
      <section>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>Diagnostics</h3>
        <button onClick={onExportLogs} style={{
          padding: '10px 20px', borderRadius: '6px', border: '1px solid #d0d5dd',
          background: '#fff', color: '#344054', fontWeight: '500', fontSize: '14px', cursor: 'pointer',
        }}>Export Error Logs</button>
      </section>
    </div>
  );
}

// ─── APP INNER (runs inside PlatformProvider) ──────────────────────
function AppInner() {
  const { platform, ready, state, dispatch } = usePlatform();
  const { language, changeLanguage } = useLanguage();

  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modulesConnected, setModulesConnected] = useState(false);

  // Infrastructure refs
  const persistence = useRef(null);
  const exportEngine = useRef(null);
  const a11y = useRef(null);
  const [a11yPrefs, setA11yPrefs] = useState({});

  // ── Connect all engine modules to platform ──────────────────────
  useEffect(() => {
    if (ready && platform && !modulesConnected) {
      connectAllModules(platform);
      setModulesConnected(true);
      console.log('[App] All modules wired to platform');
    }
  }, [ready, platform, modulesConnected]);

  // ── Initialize infrastructure services ──────────────────────────
  useEffect(() => {
    persistence.current = createPersistenceManager();
    exportEngine.current = createExportEngine({ language });
    a11y.current = createAccessibilityManager({ language });
    a11y.current.init();
    installGlobalErrorHandler();

    const savedLang = persistence.current.getPreference('language', 'en');
    if (savedLang !== 'en') changeLanguage(savedLang);
    setA11yPrefs(a11y.current.getPreferences());

    return () => {
      persistence.current?.endSession();
      a11y.current?.destroy();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigation ──────────────────────────────────────────────────
  const navigate = useCallback((view) => {
    setCurrentView(view);
    dispatch({ type: 'NAVIGATE', payload: { view } });
    a11y.current?.announceStatus(`Navigated to ${view.replace(/_/g, ' ')}`);
    persistence.current?.pushNavigation({ view, language });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [dispatch, language]);

  // ── A11y Toggle ─────────────────────────────────────────────────
  const handleA11yToggle = useCallback((key) => {
    a11y.current?.setPreference(key, !a11yPrefs[key]);
    setA11yPrefs(a11y.current?.getPreferences() || {});
  }, [a11yPrefs]);

  // ── Export handler shared by all modules ─────────────────────────
  const handleExport = useCallback((data, moduleType, format) => {
    exportEngine.current?.exportAndDownload(data, moduleType, format);
  }, []);

  // ── Render Active View ──────────────────────────────────────────
  const renderView = () => {
    const currentForm = state?.currentForm;

    switch (currentView) {
      case VIEWS.DASHBOARD:
        return <Dashboard onNavigate={navigate} />;

      case VIEWS.GDN:
        return (
          <ErrorBoundary name="GDN Navigator" onReset={() => navigate(VIEWS.DASHBOARD)}>
            <React.Suspense fallback={<LoadingSpinner message="Loading Document Navigator..." />}>
              <div id="main-content">
                <GDNNavigator
                  language={language}
                  onExport={handleExport}
                  onFormSelect={(formId) => dispatch({ type: 'FORM_SELECT', payload: { formId } })}
                  onFieldUpdate={(formId, fieldId, value) =>
                    dispatch({ type: 'FORM_FIELD_UPDATE', payload: { formId, fieldId, value } })
                  }
                />
              </div>
            </React.Suspense>
          </ErrorBoundary>
        );

      case VIEWS.VALIDATION:
        return (
          <ErrorBoundary name="Validation" onReset={() => navigate(VIEWS.DASHBOARD)}>
            <React.Suspense fallback={<LoadingSpinner message="Loading Validation..." />}>
              <div id="main-content">
                <ValidationResults
                  language={language}
                  onExport={handleExport}
                  formId={currentForm}
                  formData={currentForm ? state?.formData?.[currentForm] : null}
                  onValidate={(formId) => dispatch({ type: 'VALIDATE_FORM', payload: { formId } })}
                />
              </div>
            </React.Suspense>
          </ErrorBoundary>
        );

      case VIEWS.FILING_GUIDE:
        return (
          <ErrorBoundary name="Filing Guide" onReset={() => navigate(VIEWS.DASHBOARD)}>
            <React.Suspense fallback={<LoadingSpinner message="Loading Filing Guide..." />}>
              <div id="main-content">
                <FilingGuideView
                  language={language}
                  onExport={handleExport}
                  formId={currentForm}
                  county={state?.currentCounty}
                  onCountyChange={(county) => dispatch({ type: 'CHANGE_COUNTY', payload: { county } })}
                  onGenerate={(formId, county) =>
                    dispatch({ type: 'GENERATE_FILING_GUIDE', payload: { formId, countyKey: county } })
                  }
                />
              </div>
            </React.Suspense>
          </ErrorBoundary>
        );

      case VIEWS.AUDIT:
        return (
          <ErrorBoundary name="Audit Report" onReset={() => navigate(VIEWS.DASHBOARD)}>
            <React.Suspense fallback={<LoadingSpinner message="Loading Audit Report..." />}>
              <div id="main-content">
                <AuditReportView
                  language={language}
                  onExport={handleExport}
                  formId={currentForm}
                  formData={currentForm ? state?.formData?.[currentForm] : null}
                  validationResults={state?.validationResults}
                  onGenerate={(formId) =>
                    dispatch({ type: 'GENERATE_AUDIT_REPORT', payload: { formId } })
                  }
                />
              </div>
            </React.Suspense>
          </ErrorBoundary>
        );

      case VIEWS.ASSEMBLY:
        return (
          <ErrorBoundary name="Assembly" onReset={() => navigate(VIEWS.DASHBOARD)}>
            <React.Suspense fallback={<LoadingSpinner message="Loading Document Assembly..." />}>
              <div id="main-content">
                <DocumentAssemblyView
                  language={language}
                  onExport={handleExport}
                  allFormData={state?.formData || {}}
                  county={state?.currentCounty}
                  onAssemble={(formIds, county) =>
                    dispatch({ type: 'EXPORT_PACKAGE', payload: { formIds, countyKey: county } })
                  }
                />
              </div>
            </React.Suspense>
          </ErrorBoundary>
        );

      case VIEWS.HELP:
        return (
          <ErrorBoundary name="Help" onReset={() => navigate(VIEWS.DASHBOARD)}>
            <React.Suspense fallback={<LoadingSpinner message="Loading Help..." />}>
              <div id="main-content"><HelpPanel language={language} /></div>
            </React.Suspense>
          </ErrorBoundary>
        );

      case VIEWS.SETTINGS:
        return (
          <SettingsPanel
            a11yPrefs={a11yPrefs}
            onA11yToggle={handleA11yToggle}
            onExportLogs={() => {
              const json = errorLogger.exportJSON();
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = `vernen_error_log_${Date.now()}.json`;
              document.body.appendChild(a); a.click();
              document.body.removeChild(a); URL.revokeObjectURL(url);
            }}
          />
        );

      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  // ── Main Layout ─────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fb' }}>
      {/* Sidebar Navigation */}
      <nav
        id="navigation"
        style={{
          background: '#0f2440', color: '#fff', display: 'flex', flexDirection: 'column',
          transition: 'width 0.2s ease, min-width 0.2s ease', overflow: 'hidden', flexShrink: 0,
          width: sidebarOpen ? '240px' : '60px', minWidth: sidebarOpen ? '240px' : '60px',
        }}
        aria-label="Main navigation"
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          {sidebarOpen && <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.02em' }}>VERNEN™</span>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
              width: '28px', height: '28px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px',
            }}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <div style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                padding: '10px 12px', border: 'none', borderRadius: '6px', color: '#e2e8f0',
                cursor: 'pointer', fontSize: '14px', textAlign: 'left', transition: 'background 0.15s',
                fontFamily: 'inherit',
                background: currentView === item.id ? '#1e3a5f' : 'transparent',
                fontWeight: currentView === item.id ? '600' : '400',
              }}
              aria-current={currentView === item.id ? 'page' : undefined}
            >
              <span style={{ fontSize: '16px', width: '24px', textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </div>

        {sidebarOpen && (
          <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              style={{
                width: '100%', padding: '8px', background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px',
                color: '#fff', fontSize: '13px',
              }}
              aria-label="Select language"
            >
              {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <StatusBar />
        <main style={{ flex: 1 }} role="main">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

// ─── APP WRAPPER (AuthProvider + PlatformProvider + ErrorBoundary) ──
export default function App() {
  return (
    <ErrorBoundary name="VERNEN App" maxRetries={5}>
      <AuthProvider config={{ apiUrl: '/api/auth' }}>
        <PaymentProvider config={{ apiUrl: '/api/payments' }}>
          <PlatformProvider config={{ debug: true, language: 'en' }}>
            <AppInner />
          </PlatformProvider>
        </PaymentProvider>
      </AuthProvider>
      <style>{`
        @keyframes vernen-spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          #navigation { position: fixed; z-index: 100; height: 100vh; }
        }
      `}</style>
    </ErrorBoundary>
  );
}
