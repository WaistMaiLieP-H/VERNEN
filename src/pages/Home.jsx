import React from 'react';
import { Link } from 'react-router-dom';

const STATS = [
  { label: 'Audit Skills', value: '28+' },
  { label: 'Languages', value: '13' },
  { label: 'Case Types', value: '12' },
  { label: 'Audit Passes', value: '6' }
];

export default function Home() {
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '3rem 2rem' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--gold)', margin: 0, letterSpacing: 1 }}>
          VERNEN™
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          AI-Powered Consumer Legal Services Marketplace
        </p>
        <p style={{ fontSize: '1rem', color: 'var(--text-primary)', maxWidth: 600, margin: '1.5rem auto', lineHeight: 1.7 }}>
          Statute-traced document auditing. Field-level form guidance. Case analysis across 13 languages. Powered by Claude AI.
        </p>
        <Link to="/audit" style={{
          display: 'inline-block', marginTop: '1rem', padding: '0.9rem 2.5rem',
          background: 'var(--gold)', color: 'var(--dark)', fontWeight: 700,
          borderRadius: 8, fontSize: '1rem', transition: 'background 0.2s'
        }}>Start Your Audit →</Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '3rem' }}>
        {STATS.map(s => (
          <div key={s.label} style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--dark-card)', borderRadius: 12, border: '1px solid #2a2a3a' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gold)' }}>{s.value}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <h2 style={{ color: 'var(--gold)', fontSize: '1.5rem', marginBottom: '1.5rem' }}>How It Works</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        {[
          { step: '1', title: 'Upload', desc: 'Submit your document and select case type + jurisdiction.' },
          { step: '2', title: 'Analyze', desc: 'Claude AI runs a 6-pass S.o.C. audit against governing standards.' },
          { step: '3', title: 'Receive', desc: 'Get a branded audit report with statute-traced findings.' }
        ].map(s => (
          <div key={s.step} style={{ padding: '1.5rem', background: 'var(--dark-card)', borderRadius: 12, border: '1px solid #2a2a3a' }}>
            <div style={{ color: 'var(--gold)', fontWeight: 800, fontSize: '1.5rem' }}>{s.step}</div>
            <div style={{ fontWeight: 600, marginTop: 8 }}>{s.title}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 6, lineHeight: 1.5 }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
