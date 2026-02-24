import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ResultPage() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const [audit, setAudit] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('vernen_audits') || '{}');
    if (stored[auditId]) setAudit(stored[auditId]);
  }, [auditId]);

  if (!audit) return (
    <div className="text-center py-20">
      <p className="text-vernen-muted">Audit not found.</p>
      <button onClick={() => navigate('/')} className="mt-4 text-vernen-gold hover:underline text-sm">Dashboard</button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/')} className="text-vernen-muted hover:text-vernen-gold text-sm mb-6 block">← Dashboard</button>
      <div className="bg-vernen-panel border border-vernen-border rounded-lg overflow-hidden">
        <div className="p-5 border-b border-vernen-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-vernen-gold">Audit Report</h2>
            <p className="text-vernen-muted text-xs mt-1">
              {audit.auditId} · {audit.category} · {audit.jurisdiction} · {new Date(audit.timestamp).toLocaleString()}
            </p>
          </div>
          <button onClick={() => {
              const blob = new Blob([
                `VERNEN™ AUDIT REPORT\n`,
                `ID: ${audit.auditId}\n`,
                `Category: ${audit.category}\n`,
                `Jurisdiction: ${audit.jurisdiction}\n`,
                `Date: ${audit.timestamp}\n`,
                `${'='.repeat(60)}\n\n`,
                audit.result, '\n\n',
                `${'='.repeat(60)}\n`,
                audit.disclaimer, '\n',
                '© 2026 VERNEN™ — Michael Vernen Thomas Hartmann'
              ], { type: 'text/plain' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `${audit.auditId}.txt`; a.click();
            }}
            className="px-4 py-2 rounded text-sm bg-vernen-gold/10 text-vernen-gold hover:bg-vernen-gold/20 transition">
            Export
          </button>
        </div>
        <div className="p-5">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-vernen-text">{audit.result}</pre>
        </div>
        <div className="p-4 border-t border-vernen-border bg-vernen-dark/50 text-xs text-vernen-muted">
          {audit.disclaimer}
        </div>
      </div>
    </div>
  );
}
