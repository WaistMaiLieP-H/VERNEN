import React, { useState, useRef } from 'react';

const CASE_TYPES = [
  { id: 'family_law', label: 'Family Law / Custody' },
  { id: 'civil_rights', label: 'Civil Rights / § 1983' },
  { id: 'cps', label: 'CPS / Child Welfare' },
  { id: 'law_enforcement', label: 'Law Enforcement Conduct' },
  { id: 'insurance', label: 'Insurance Bad Faith' },
  { id: 'medical', label: 'Medical Billing / Surgery' },
  { id: 'court_order', label: 'Court Order Compliance' },
  { id: 'attorney_conduct', label: 'Attorney Conduct' },
  { id: 'disability', label: 'SSA / Disability' },
  { id: 'real_estate', label: 'Real Estate / Deed Fraud' },
  { id: 'military', label: 'Military / UCMJ' },
  { id: 'general', label: 'General Document Audit' }
];

const JURISDICTIONS = [
  { id: 'CA', label: 'California' },
  { id: 'TX', label: 'Texas' },
  { id: 'NY', label: 'New York' },
  { id: 'FL', label: 'Florida' },
  { id: 'OTHER', label: 'Other State' }
];

export default function AuditPage() {
  const [documentText, setDocumentText] = useState('');
  const [caseType, setCaseType] = useState('general');
  const [jurisdiction, setJurisdiction] = useState('CA');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const fileRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setDocumentText(ev.target.result);
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!documentText.trim()) { setError('Upload or paste a document.'); return; }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_text: documentText, case_type: caseType, jurisdiction })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Audit failed');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Document Audit</h1>
      <p className="text-gray-400 mb-8">Upload or paste your document. Select case type and jurisdiction. VERNEN™ runs a 6-pass S.o.C. compliance analysis.</p>

      <div className="space-y-6">
        {/* File upload */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Upload Document</label>
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-amber-500/50 transition"
               onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" className="hidden" accept=".txt,.pdf,.doc,.docx" onChange={handleFileUpload} />
            {fileName ? <p className="text-amber-400">{fileName}</p> : <p className="text-gray-500">Click to upload (.txt, .pdf, .doc, .docx)</p>}
          </div>
        </div>

        {/* Text input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Or Paste Document Text</label>
          <textarea
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
            className="w-full h-48 bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-200 focus:border-amber-500 focus:outline-none resize-y"
            placeholder="Paste your court order, police report, letter, or filing here..."
          />
        </div>

        {/* Case type + Jurisdiction */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Case Type</label>
            <select value={caseType} onChange={(e) => setCaseType(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-gray-200 focus:border-amber-500 focus:outline-none">
              {CASE_TYPES.map(ct => <option key={ct.id} value={ct.id}>{ct.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Jurisdiction</label>
            <select value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-gray-200 focus:border-amber-500 focus:outline-none">
              {JURISDICTIONS.map(j => <option key={j.id} value={j.id}>{j.label}</option>)}
            </select>
          </div>
        </div>

        {/* Submit */}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button onClick={handleSubmit} disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 text-black font-semibold py-3 rounded-lg transition">
          {loading ? 'Running 6-Pass Audit...' : 'Run VERNEN™ Audit'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-10 bg-gray-900 border border-amber-500/30 rounded-xl p-6">
          <h2 className="text-xl font-bold text-amber-400 mb-4">Audit Report — {result.audit_id}</h2>
          <div className="grid grid-cols-3 gap-4 text-sm mb-6">
            <div><span className="text-gray-500">Case Type:</span> <span className="text-gray-200">{result.case_type}</span></div>
            <div><span className="text-gray-500">Jurisdiction:</span> <span className="text-gray-200">{result.jurisdiction}</span></div>
            <div><span className="text-gray-500">Timestamp:</span> <span className="text-gray-200">{new Date(result.timestamp).toLocaleString()}</span></div>
          </div>
          <h3 className="font-semibold mb-2">S.o.C. Audit Passes</h3>
          <div className="space-y-2">
            {result.passes?.map(p => (
              <div key={p.pass} className="flex items-center gap-3 text-sm">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">Pass {p.pass}: {p.name}</span>
              </div>
            ))}
          </div>
          {result._note && <p className="mt-4 text-xs text-gray-500 italic">{result._note}</p>}
        </div>
      )}
    </div>
  );
}
