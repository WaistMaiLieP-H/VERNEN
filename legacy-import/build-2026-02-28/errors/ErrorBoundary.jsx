/**
 * VERNEN™ Error Boundary
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * React error boundary with retry capability, crash recovery UI,
 * structured error logging, and exportable error logs.
 */

import React from 'react';

// ─── ERROR LOGGER ──────────────────────────────────────────────────
class ErrorLogger {
  constructor(maxEntries = 200) {
    this.maxEntries = maxEntries;
    this.entries = [];
    this.listeners = [];
  }

  log(entry) {
    const record = {
      id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      level: entry.level || 'error',
      source: entry.source || 'unknown',
      message: entry.message || 'Unknown error',
      stack: entry.stack || null,
      componentStack: entry.componentStack || null,
      context: entry.context || {},
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      url: typeof window !== 'undefined' ? window.location.href : 'N/A'
    };
    this.entries.push(record);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
    this.listeners.forEach(fn => { try { fn(record); } catch {} });
    return record;
  }

  getEntries(filter = {}) {
    let results = [...this.entries];
    if (filter.level) results = results.filter(e => e.level === filter.level);
    if (filter.source) results = results.filter(e => e.source === filter.source);
    if (filter.since) results = results.filter(e => new Date(e.timestamp) >= new Date(filter.since));
    return results;
  }

  getRecentErrors(count = 10) {
    return this.entries.slice(-count);
  }

  clear() { this.entries = []; }

  exportJSON() {
    return JSON.stringify({
      platform: 'VERNEN',
      exportedAt: new Date().toISOString(),
      totalErrors: this.entries.length,
      entries: this.entries
    }, null, 2);
  }

  exportCSV() {
    const headers = ['id', 'timestamp', 'level', 'source', 'message', 'url'];
    const rows = this.entries.map(e =>
      headers.map(h => `"${String(e[h] || '').replace(/"/g, '""')}"`).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  onError(listener) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }
}

// Singleton logger
const errorLogger = new ErrorLogger();

// ─── ERROR BOUNDARY COMPONENT ──────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      showDetails: false,
      showExport: false
    };
    this.maxRetries = props.maxRetries || 3;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    errorLogger.log({
      level: 'error',
      source: this.props.name || 'ErrorBoundary',
      message: error?.message || 'Component crash',
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      context: {
        retryCount: this.state.retryCount,
        props: this._safeSerializeProps()
      }
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  _safeSerializeProps() {
    try {
      const { children, onError, fallback, ...rest } = this.props;
      return JSON.parse(JSON.stringify(rest));
    } catch { return {}; }
  }

  handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) return;
    this.setState(prev => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prev.retryCount + 1
    }));
    errorLogger.log({
      level: 'info',
      source: this.props.name || 'ErrorBoundary',
      message: `Retry attempt ${this.state.retryCount + 1}/${this.maxRetries}`
    });
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      showDetails: false
    });
    if (this.props.onReset) this.props.onReset();
  };

  handleExportLogs = () => {
    const json = errorLogger.exportJSON();
    if (typeof document === 'undefined') return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vernen_error_log_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return typeof this.props.fallback === 'function'
        ? this.props.fallback({
            error: this.state.error,
            retry: this.handleRetry,
            reset: this.handleReset,
            retryCount: this.state.retryCount,
            canRetry: this.state.retryCount < this.maxRetries
          })
        : this.props.fallback;
    }

    return React.createElement('div', {
      role: 'alert',
      'aria-live': 'assertive',
      style: styles.container
    },
      React.createElement('div', { style: styles.card },
        // Header
        React.createElement('div', { style: styles.header },
          React.createElement('div', { style: styles.iconContainer },
            React.createElement('svg', {
              width: 32, height: 32, viewBox: '0 0 24 24',
              fill: 'none', stroke: '#dc2626', strokeWidth: 2
            },
              React.createElement('circle', { cx: 12, cy: 12, r: 10 }),
              React.createElement('line', { x1: 12, y1: 8, x2: 12, y2: 12 }),
              React.createElement('line', { x1: 12, y1: 16, x2: 12.01, y2: 16 })
            )
          ),
          React.createElement('div', null,
            React.createElement('h2', { style: styles.title }, 'Something went wrong'),
            React.createElement('p', { style: styles.subtitle },
              this.props.name
                ? `An error occurred in the ${this.props.name} module.`
                : 'An unexpected error occurred.'
            )
          )
        ),

        // Error message
        React.createElement('div', { style: styles.errorBox },
          React.createElement('code', { style: styles.errorCode },
            this.state.error?.message || 'Unknown error'
          )
        ),

        // Actions
        React.createElement('div', { style: styles.actions },
          this.state.retryCount < this.maxRetries
            ? React.createElement('button', {
                onClick: this.handleRetry,
                style: styles.btnPrimary,
                'aria-label': `Retry (attempt ${this.state.retryCount + 1} of ${this.maxRetries})`
              },
                `Retry (${this.maxRetries - this.state.retryCount} left)`
              )
            : React.createElement('span', { style: styles.exhausted },
                'Maximum retries reached'
              ),

          React.createElement('button', {
            onClick: this.handleReset,
            style: styles.btnSecondary
          }, 'Reset Module'),

          React.createElement('button', {
            onClick: () => this.setState(p => ({ showDetails: !p.showDetails })),
            style: styles.btnGhost,
            'aria-expanded': this.state.showDetails
          }, this.state.showDetails ? 'Hide Details' : 'Show Details'),

          React.createElement('button', {
            onClick: this.handleExportLogs,
            style: styles.btnGhost,
            'aria-label': 'Export error logs'
          }, 'Export Logs')
        ),

        // Details panel
        this.state.showDetails && React.createElement('div', { style: styles.details },
          React.createElement('h3', { style: styles.detailsTitle }, 'Error Details'),
          React.createElement('div', { style: styles.detailSection },
            React.createElement('strong', null, 'Error Stack:'),
            React.createElement('pre', { style: styles.pre },
              this.state.error?.stack || 'No stack trace available'
            )
          ),
          this.state.errorInfo?.componentStack && React.createElement('div', { style: styles.detailSection },
            React.createElement('strong', null, 'Component Stack:'),
            React.createElement('pre', { style: styles.pre },
              this.state.errorInfo.componentStack
            )
          ),
          React.createElement('div', { style: styles.detailSection },
            React.createElement('strong', null, 'Recent Error Log:'),
            React.createElement('pre', { style: styles.pre },
              JSON.stringify(errorLogger.getRecentErrors(5), null, 2)
            )
          )
        )
      )
    );
  }
}

// ─── STYLES ────────────────────────────────────────────────────────
const styles = {
  container: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    minHeight: '300px', padding: '24px', fontFamily: "'Segoe UI', sans-serif"
  },
  card: {
    maxWidth: '640px', width: '100%', background: '#fff',
    borderRadius: '12px', border: '1px solid #e5e7eb',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '32px', overflow: 'hidden'
  },
  header: {
    display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px'
  },
  iconContainer: {
    flexShrink: 0, width: '48px', height: '48px', borderRadius: '50%',
    background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  title: {
    fontSize: '18px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px'
  },
  subtitle: {
    fontSize: '14px', color: '#666', margin: '0'
  },
  errorBox: {
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
    padding: '12px 16px', marginBottom: '20px'
  },
  errorCode: {
    fontSize: '13px', color: '#991b1b', wordBreak: 'break-word', fontFamily: 'monospace'
  },
  actions: {
    display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px'
  },
  btnPrimary: {
    padding: '8px 20px', borderRadius: '6px', border: 'none',
    background: '#1a3a5c', color: '#fff', fontWeight: '600',
    fontSize: '14px', cursor: 'pointer'
  },
  btnSecondary: {
    padding: '8px 20px', borderRadius: '6px', border: '1px solid #d0d5dd',
    background: '#fff', color: '#344054', fontWeight: '500',
    fontSize: '14px', cursor: 'pointer'
  },
  btnGhost: {
    padding: '8px 16px', borderRadius: '6px', border: 'none',
    background: 'transparent', color: '#2563eb', fontWeight: '500',
    fontSize: '14px', cursor: 'pointer', textDecoration: 'underline'
  },
  exhausted: {
    color: '#dc2626', fontSize: '14px', fontWeight: '600', padding: '8px 0'
  },
  details: {
    borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '8px'
  },
  detailsTitle: {
    fontSize: '14px', fontWeight: '700', color: '#1a1a1a', marginBottom: '12px'
  },
  detailSection: {
    marginBottom: '16px'
  },
  pre: {
    background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px',
    padding: '12px', fontSize: '12px', fontFamily: 'monospace',
    overflow: 'auto', maxHeight: '200px', whiteSpace: 'pre-wrap',
    wordBreak: 'break-word', marginTop: '4px'
  }
};

// ─── GLOBAL ERROR HANDLER ──────────────────────────────────────────
function installGlobalErrorHandler() {
  if (typeof window === 'undefined') return;
  window.addEventListener('error', (event) => {
    errorLogger.log({
      level: 'error',
      source: 'window.onerror',
      message: event.message,
      stack: event.error?.stack,
      context: { filename: event.filename, lineno: event.lineno, colno: event.colno }
    });
  });
  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.log({
      level: 'error',
      source: 'unhandledrejection',
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack
    });
  });
}

export { ErrorBoundary, ErrorLogger, errorLogger, installGlobalErrorHandler };
export default ErrorBoundary;
