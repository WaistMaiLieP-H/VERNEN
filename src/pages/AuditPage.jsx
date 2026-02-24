import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

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

const TIERS = [
  { id: 'standard', price: 35, name: 'Standard', desc: 'Single document, 6-pass S.o.C.' },
  { id: 'comprehensive', price: 99, name: 'Comprehensive', desc: 'Multi-doc, cross-reference, full report' },
  { id: 'litigation', price: 249, name: 'Litigation', desc: 'Full suite + filing-ready exhibits' }
];

export default function AuditPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPaid = searchParams.get('paid') === 'true';
  const sessionId = searchParams.get('session');

  const [tier, setTier] = useState('standard');
  const [documentText, setDocumentText] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [jurisdiction, setJurisdiction] = useState('CA');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(isPaid ? 'audit' : 'select');

  // Verify payment on load if returning from Stripe
  React.useEffect(() => {
    if (isPaid && sessionId) {
      fetch(`/api/verify-payment/${sessionId}`)
        .then(r => r.json())
        .then(data => { if (data.paid) setStep('audit'); })
        .catch(() => setStep('audit')); // fallback: allow audit
    }
  }, [isPaid, sessionId]);

  const categoryName = CATEGORY_NAMES[category] || category;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier, category,
          returnUrl: window.location.origin
        })
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else {
        // Stripe not configured — dev mode, skip to audit
        setStep('audit');
      }
    } catch {
      setStep('audit'); // Fallback: allow audit in dev mode
    } finally {
      setLoading(false);
    }
  };

  const handleAudit = async (e) => {
    e.preventDefault();
    if (!documentText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, documentText, documentType, jurisdiction, sessionId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Store result for display
      const stored = JSON.parse(localStorage.getItem('vernen_audits') || '{}');
      stored[data.auditId] = data;
      localStorage.setItem('vernen_audits', JSON.stringify(stored));
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
        <button onClick={() => navigate('/')} className="text-vernen-muted hover:text-vernen-gold text-sm">← Back</button>
        <h2 className="text-2xl font-bold mt-2">
          <span className="text-vernen-gold">{categoryName}</span> Audit
        </h2>
      </div>

      {step === 'select' && (
        <div>
          <p className="text-vernen-muted text-sm mb-4">Select your audit tier:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {TIERS.map(t => (
              <button key={t.id} onClick={() => setTier(t.id)}
                className={`p-4 rounded-lg border text-left transition ${
                  tier === t.id
                    ? 'border-vernen-gold bg-vernen-gold/10'
                    : 'border-vernen-border bg-vernen-panel hover:border-vernen-gold/30'
                }`}>
                <div className="text-lg font-bold text-vernen-gold">${t.price}</div>
                <div className="text-sm font-medium text-vernen-text">{t.name}</div>
                <div className="text-xs text-vernen-muted mt-1">{t.desc}</div>
              </button>
            ))}
          </div>
          <button onClick={handleCheckout} disabled={loading}
            className="w-full py-3 rounded font-semibold text-sm bg-vernen-gold text-vernen-dark hover:bg-vernen-gold/90 disabled:opacity-40">
            {loading ? 'Processing...' : `Proceed to Payment — $${TIERS.find(t => t.id === tier)?.price}`}
          </button>
        </div>
      )}

      {step === 'audit' && (
        <form onSubmit={handleAudit} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm text-vernen-muted block mb-1">Document Type</label>
              <input type="text" value={documentType} onChange={e => setDocumentType(e.target.value)}
                placeholder="e.g., Court Order, Police Report"
                className="w-full px-3 py-2 rounded bg-vernen-dark border border-vernen-border text-vernen-text placeholder-vernen-muted/50 text-sm focus:border-vernen-gold/50 outline-none" />
            </div>
            <div className="w-24">
              <label className="text-sm text-vernen-muted block mb-1">State</label>
              <input type="text" value={jurisdiction} onChange={e => setJurisdiction(e.target.value.toUpperCase())} maxLength={2}
                className="w-full px-3 py-2 rounded bg-vernen-dark border border-vernen-border text-vernen-text text-sm text-center focus:border-vernen-gold/50 outline-none" />
            </div>
          </div>
          <div>
            <label className="text-sm text-vernen-muted block mb-1">Document Text</label>
            <textarea value={documentText} onChange={e => setDocumentText(e.target.value)} rows={16}
              placeholder="Paste the full document text here..."
              className="w-full px-3 py-2 rounded bg-vernen-dark border border-vernen-border text-vernen-text placeholder-vernen-muted/50 text-sm leading-relaxed focus:border-vernen-gold/50 outline-none resize-y" />
          </div>
          {error && <div className="p-3 rounded bg-red-900/20 border border-red-800 text-red-300 text-sm">{error}</div>}
          <button type="submit" disabled={loading || !documentText.trim()}
            className="w-full py-3 rounded font-semibold text-sm bg-vernen-gold text-vernen-dark hover:bg-vernen-gold/90 disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? 'Running 6-Pass S.o.C. Audit...' : 'Submit for Audit'}
          </button>
        </form>
      )}
    </div>
  );
}
