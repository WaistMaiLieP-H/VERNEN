import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const CATEGORY_NAMES = {
  'family-law': 'California Family Law',
  'civil-rights': 'Constitutional & Civil Rights',
  'law-enforcement': 'Law Enforcement Conduct',
  'insurance': 'Insurance Bad Faith',
  'medical': 'Medical Billing & Conduct',
  'attorney-conduct': 'Attorney Ethics',
  'cps': 'Child Protective Services',
  'real-estate': 'Real Estate Transaction Fraud',
  'consumer-reports': 'FCRA / Consumer Reports',
  'disability': 'SSA/DDS Disability',
  'victim-rights': "Marsy's Law / Victim Rights",
  'labor': 'Labor & Employment',
  'military': 'Military Standards',
  'state-agency': 'State Agency Correspondence'
};

export default function AuditPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [documentText, setDocumentText] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [jurisdiction, setJurisdiction] = useState('CA');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const categoryName = CATEGORY_NAMES[category] || category;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!documentText.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, documentText, documentType, jurisdiction })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem(`audit_${data.auditId}`, JSON.stringify(data));
      navigate(`/result/${data.auditId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <button onClick={() => navigate('/')} className="text-vernen-muted hover:text-vernen-gold text-sm">
          ← Back to Dashboard
        </button>
        <h2 className="text-2xl font-bold mt-2">
          <span className="text-vernen-gold">{categoryName}</span> Audit
        </h2>
        <p className="text-vernen-muted text-sm mt-1">
          Paste document text below for 6-pass S.o.C. compliance analysis.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm text-vernen-muted block mb-1">Document Type</label>
            <input type="text" value={documentType}
              onChange={e => setDocumentType(e.target.value)}
              placeholder="e.g., Court Order, Police Report, Insurance Letter"
              className="w-full px-3 py-2 rounded bg-vernen-dark border border-vernen-border
                         text-vernen-text placeholder-vernen-muted/50 text-sm
                         focus:border-vernen-gold/50 outline-none" />
          </div>
          <div className="w-24">
            <label className="text-sm text-vernen-muted block mb-1">State</label>
            <input type="text" value={jurisdiction}
              onChange={e => setJurisdiction(e.target.value.toUpperCase())} maxLength={2}
              className="w-full px-3 py-2 rounded bg-vernen-dark border border-vernen-border
                         text-vernen-text text-sm text-center
                         focus:border-vernen-gold/50 outline-none" />
          </div>
        </div>

        <div>
          <label className="text-sm text-vernen-muted block mb-1">Document Text</label>
          <textarea value={documentText} onChange={e => setDocumentText(e.target.value)}
            rows={16} placeholder="Paste the full document text here..."
            className="w-full px-3 py-2 rounded bg-vernen-dark border border-vernen-border
                       text-vernen-text placeholder-vernen-muted/50 text-sm leading-relaxed
                       focus:border-vernen-gold/50 outline-none resize-y" />
        </div>

        {error && (
          <div className="p-3 rounded bg-red-900/20 border border-red-800 text-red-300 text-sm">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading || !documentText.trim()}
          className="w-full py-3 rounded font-semibold text-sm transition
                     bg-vernen-gold text-vernen-dark hover:bg-vernen-gold/90
                     disabled:opacity-40 disabled:cursor-not-allowed">
          {loading ? 'Running 6-Pass Audit...' : 'Submit for Audit — $35'}
        </button>
      </form>
    </div>
  );
}
