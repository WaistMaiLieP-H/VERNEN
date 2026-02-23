import React, { useState, useRef } from 'react';

const CASE_TYPES = [
  'Family Law / Custody',
  'Civil Rights (§1983)',
  'Insurance Bad Faith',
  'Real Estate / Title Fraud',
  'Medical Billing Fraud',
  'Employment / Labor',
  'CPS / Child Welfare',
  'Law Enforcement Conduct',
  'Court Order Compliance',
  'Consumer Reports (FCRA)',
  'SSA / Disability',
  'Other',
];

const JURISDICTIONS = [
  'California', 'Texas', 'New York', 'Florida',
  'Federal', 'Other State',
];

export default function AuditPortal() {
  const [caseType, setCaseType] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!caseType || !jurisdiction) return;
    setStatus('analyzing');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('caseType', caseType);
      formData.append('jurisdiction', jurisdiction);
      formData.append('description', description);
      files.forEach(f => formData.append('documents', f));

      const res = await fetch('/api/audit', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
      setStatus('complete');
    } catch (err) {
      setStatus('error');
      setResult({ error: err.message });
    }
  };

  return (
    <main className="pt-20 px-4 max-w-4xl mx-auto pb-20">
      <h1 className="text-3xl font-bold mb-2 gold-gradient">Document Audit Portal</h1>
      <p className="text-gray-400 mb-8">Upload documents, select case type and jurisdiction. Claude AI analyzes against governing standards.</p>

      <div className="space-y-6">
        {/* Case Type */}
        <div className="card-surface p-6">
          <label className="block text-sm font-medium text-gold-400 mb-2">Case Type</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {CASE_TYPES.map(ct => (
              <button key={ct} onClick={() => setCaseType(ct)}
                className={`text-left text-sm px-3 py-2 rounded-lg border transition ${
                  caseType === ct
                    ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                    : 'border-dark-800 text-gray-400 hover:border-gray-600'
                }`}>{ct}</button>
            ))}
          </div>
        </div>

        {/* Jurisdiction */}
        <div className="card-surface p-6">
          <label className="block text-sm font-medium text-gold-400 mb-2">Jurisdiction</label>
          <div className="flex flex-wrap gap-2">
            {JURISDICTIONS.map(j => (
              <button key={j} onClick={() => setJurisdiction(j)}
                className={`text-sm px-4 py-2 rounded-lg border transition ${
                  jurisdiction === j
                    ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                    : 'border-dark-800 text-gray-400 hover:border-gray-600'
                }`}>{j}</button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="card-surface p-6">
          <label className="block text-sm font-medium text-gold-400 mb-2">Describe Your Situation (optional)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            rows={4} placeholder="Provide context for a more targeted audit..."
            className="w-full bg-dark-950 border border-dark-800 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-gold-500 focus:outline-none resize-none" />
        </div>

        {/* File Upload */}
        <div className="card-surface p-6">
          <label className="block text-sm font-medium text-gold-400 mb-2">Upload Documents</label>
          <div onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-dark-800 rounded-lg p-8 text-center cursor-pointer hover:border-gold-500/50 transition">
            <p className="text-gray-400 text-sm">Click to upload or drag files here</p>
            <p className="text-gray-600 text-xs mt-1">PDF, DOCX, images — up to 25MB per file</p>
          </div>
          <input ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.tiff"
            onChange={handleFiles} className="hidden" />
          {files.length > 0 && (
            <div className="mt-3 space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-dark-950 rounded px-3 py-2 text-sm">
                  <span className="text-gray-300 truncate">{f.name}</span>
                  <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300 ml-2">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button onClick={handleSubmit}
          disabled={!caseType || !jurisdiction || status === 'analyzing'}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition ${
            !caseType || !jurisdiction
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : status === 'analyzing'
              ? 'bg-gold-600 text-dark-950 animate-pulse'
              : 'bg-gold-500 text-dark-950 hover:bg-gold-400'
          }`}>
          {status === 'analyzing' ? '⏳ Analyzing with Claude AI...' :
           status === 'complete' ? '✓ Audit Complete — Run Another' :
           'Run S.o.C. Audit'}
        </button>

        {/* Results */}
        {result && !result.error && (
          <div className="card-surface p-6">
            <h2 className="text-xl font-bold gold-gradient mb-4">Audit Results</h2>
            <pre className="bg-dark-950 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {result?.error && (
          <div className="card-surface p-6 border-red-500/50">
            <p className="text-red-400 text-sm">Error: {result.error}</p>
            <p className="text-gray-500 text-xs mt-2">API endpoint not yet connected. Backend deployment required.</p>
          </div>
        )}
      </div>
    </main>
  );
}
