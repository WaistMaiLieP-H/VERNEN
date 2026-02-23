import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ResultPage() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const [audit, setAudit] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(`audit_${auditId}`);
    if (stored) setAudit(JSON.parse(stored));
  }, [auditId]);

  if (!audit) {
    return (
      <div className="text-center py-20">
        <p className="text-vernen-muted">Audit not found.</p>
        <button onClick={() => navigate('/')}
          className="mt-4 text-vernen-gold hover:underline text-sm">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button onClick={() => navigate('/')} className="text-vernen-muted hover:text-vernen-gold text-sm">
          ← Back to Dashboard
        </button>
      </div>

      <div className="bg-vernen-panel border border-vernen-border rounded-lg overflow-hidden">
        <div className="p-5 border-b border-vernen-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-vernen-gold">Audit Report</h2>
            <p className="text-vernen-muted text-xs mt-1">
              {audit.auditId} · {audit.category} · {audit.jurisdiction} · {new Date(audit.timestamp).toLocaleString()}
            </p>
          </div>
          <button onClick={() => {
              const blob = new Blob([audit.result], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = `${audit.auditId}.txt`; a.click();
            }}
            className="px-4 py-2 rounded text-sm bg-vernen-gold/10 text-vernen-gold
                       hover:bg-vernen-gold/20 transition">
            Export Report
          </button>
        </div>
        <div className="p-5">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-vernen-text font-mono">
            {audit.result}
          </pre>
        </div>
        <div className="p-4 border-t border-vernen-border bg-vernen-dark/50 text-xs text-vernen-muted">
          {audit.disclaimer}
        </div>
      </div>
    </div>
  );
}
