import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Audit from './pages/Audit';
import Services from './pages/Services';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/services" element={<Services />} />
          </Routes>
        </main>
        <footer style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', borderTop: '1px solid #222' }}>
          © 2026 VERNEN™ — Michael Vernen Thomas Hartmann. All rights reserved. IP Manifest Filed Feb 2, 2026.
        </footer>
      </div>
    </BrowserRouter>
  );
}
