import React, { useState, useEffect } from 'react';

export default function Audit() {
  const [caseTypes, setCaseTypes] = useState([]);
  const [form, setForm] = useState({ document_text: '', case_type: '', jurisdiction: 'CA', language: 'en' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/case-types').then(r => r.json()).then(d => setCaseTypes(d.case_types || [])).catch(() => {});
  }, []);

  const submit = async () => {
    if (!form.document_text || !form.case_type) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      setResult(data);
    } catch (e) { setResult({ error: e.message }); }
    setLoading(false);
  };

  const fieldStyle = {
    width: '100%', padding: '0.75rem', background: 'var(--dark-surface)',
    border: '1px solid #2a2a3a', borderRadius: 8, color: 'var(--text-primary)',
    fontSize: '0.95rem', outline: 'none'
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ color: 'var(--gold)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>Submit Document for Audit</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Paste your document text below. Select case type and jurisdiction.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Case Type */}
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 6 }}>Case Type</label>
          <select value={form.case_type} onChange={e => setForm({...form, case_type: e.target.value})} style={{...fieldStyle, cursor: 'pointer'}}>
            <option value="">— Select Case Type —</option>
            {caseTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Jurisdiction + Language */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 6 }}>Jurisdiction</label>
            <select value={form.jurisdiction} onChange={e => setForm({...form, jurisdiction: e.target.value})} style={{...fieldStyle, cursor: 'pointer'}}>
              <option value="CA">California</option>
              <option value="FEDERAL">Federal</option>
              <option value="TX">Texas (planned)</option>
              <option value="NY">New York (planned)</option>
              <option value="FL">Florida (planned)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 6 }}>Language</label>
            <select value={form.language} onChange={e => setForm({...form, language: e.target.value})} style={{...fieldStyle, cursor: 'pointer'}}>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="zh">中文</option>
              <option value="tl">Tagalog</option>
              <option value="vi">Tiếng Việt</option>
              <option value="ko">한국어</option>
              <option value="ar">العربية</option>
              <option value="hy">Հայերեն</option>
              <option value="fa">فارسی</option>
              <option value="ru">Русский</option>
              <option value="ja">日本語</option>
              <option value="hi">हिन्दी</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>

        {/* Document Text */}
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 6 }}>Document Text</label>
          <textarea value={form.document_text} onChange={e => setForm({...form, document_text: e.target.value})}
            placeholder="Paste the full text of the document to be audited..."
            rows={14} style={{...fieldStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem'}} />
        </div>

        {/* Submit */}
        <button onClick={submit} disabled={loading || !form.document_text || !form.case_type} style={{
          padding: '0.9rem', background: loading ? '#555' : 'var(--gold)', color: 'var(--dark)',
          fontWeight: 700, border: 'none', borderRadius: 8, fontSize: '1rem', cursor: loading ? 'wait' : 'pointer'
        }}>{loading ? 'Analyzing...' : 'Submit for S.o.C. Audit →'}</button>
      </div>

      {/* Result */}
      {result && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--dark-card)', borderRadius: 12, border: result.error ? '1px solid #c44' : '1px solid var(--gold)' }}>
          {result.error ? (
            <p style={{ color: '#f66' }}>Error: {result.error}</p>
          ) : (
            <>
              <h3 style={{ color: 'var(--gold)', margin: '0 0 1rem' }}>Audit Submitted</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Audit ID:</span> {result.submission?.audit_id}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> {result.submission?.status}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Case Type:</span> {result.submission?.case_type?.name}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Passes:</span> {result.submission?.estimated_passes}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Skills:</span> {result.submission?.skills_applied?.length}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Language:</span> {result.submission?.language}</div>
              </div>
              <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontSize: '0.85rem' }}>{result.message}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
