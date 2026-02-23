import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Services() {
  const [services, setServices] = useState([]);
  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(d => setServices(d.services || [])).catch(() => {});
  }, []);

  const tierColors = { standard: '#4a9', professional: 'var(--gold)', enterprise: '#c6f' };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ color: 'var(--gold)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>Services</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Claude AI-powered legal analysis at a fraction of traditional attorney fees.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {services.map(s => (
          <div key={s.id} style={{ padding: '1.5rem', background: 'var(--dark-card)', borderRadius: 12, border: `1px solid ${tierColors[s.tier] || '#2a2a3a'}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: tierColors[s.tier], textTransform: 'uppercase', letterSpacing: 1 }}>{s.tier}</div>
            <h3 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.1rem' }}>{s.name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', flex: 1, lineHeight: 1.5 }}>{s.desc}</p>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gold)', marginTop: '1rem' }}>
              ${(s.price / 100).toFixed(0)}
            </div>
            <Link to="/audit" style={{
              display: 'block', textAlign: 'center', marginTop: '1rem', padding: '0.6rem',
              background: 'var(--gold)', color: 'var(--dark)', fontWeight: 600, borderRadius: 6, fontSize: '0.9rem'
            }}>Get Started</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
