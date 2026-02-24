import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import AuditPage from './pages/AuditPage';
import ResultPage from './pages/ResultPage';

export default function App() {
  return (
    <div className="min-h-screen bg-vernen-dark">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/audit/:category" element={<AuditPage />} />
          <Route path="/result/:auditId" element={<ResultPage />} />
        </Routes>
      </main>
      <footer className="text-center text-vernen-muted text-xs py-6 border-t border-vernen-border">
        © 2026 VERNEN™ — Michael Vernen Thomas Hartmann. All rights reserved. IP Manifest filed Feb 2, 2026.
      </footer>
    </div>
  );
}
