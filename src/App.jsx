import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import AuditPortal from './pages/AuditPortal';
import Services from './pages/Services';
import Pricing from './pages/Pricing';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/audit" element={<AuditPortal />} />
        <Route path="/services" element={<Services />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
}
