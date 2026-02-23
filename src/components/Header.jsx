import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV = [
  { path: '/', label: 'Home' },
  { path: '/audit', label: 'Start Audit' },
  { path: '/services', label: 'Services' }
];

export default function Header() {
  const loc = useLocation();
  return (
    <header style={{ background: 'var(--dark-surface)', borderBottom: '1px solid var(--gold)', padding: '0 2rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <Link to="/" style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: 2, color: 'var(--gold)' }}>
          VERNEN™
        </Link>
        <nav style={{ display: 'flex', gap: '1.5rem' }}>
          {NAV.map(n => (
            <Link key={n.path} to={n.path} style={{
              color: loc.pathname === n.path ? 'var(--gold)' : 'var(--text-muted)',
              fontWeight: loc.pathname === n.path ? 600 : 400,
              fontSize: '0.9rem', transition: 'color 0.2s'
            }}>{n.label}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
