import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="border-b border-vernen-border bg-vernen-panel">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <span className="text-vernen-gold text-2xl font-bold tracking-wider">VERNEN™</span>
          <span className="text-vernen-muted text-sm hidden sm:block">AI-Powered Legal Audit</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-vernen-muted hover:text-vernen-gold transition">Dashboard</Link>
          <a href="https://vernen-audit.netlify.app" target="_blank" rel="noopener"
             className="text-vernen-muted hover:text-vernen-gold transition">Info</a>
          <span className="px-3 py-1 rounded bg-vernen-gold/10 text-vernen-gold text-xs font-medium">
            Beta
          </span>
        </nav>
      </div>
    </header>
  );
}
