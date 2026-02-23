import React from 'react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-400 mb-8">Your audit history and case management.</p>

      {/* Placeholder - auth required */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold mb-2">Sign in to view your audits</h2>
        <p className="text-gray-400 text-sm mb-6">Your audit history, reports, and case files will appear here once authentication is enabled.</p>
        <Link to="/audit" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-2.5 rounded-lg transition inline-block">
          Run an Audit Now
        </Link>
      </div>

      {/* Preview of what dashboard will show */}
      <div className="mt-10 grid md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-gray-500 text-xs uppercase">Total Audits</p>
          <p className="text-2xl font-bold text-amber-400">—</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-gray-500 text-xs uppercase">Findings Identified</p>
          <p className="text-2xl font-bold text-amber-400">—</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-gray-500 text-xs uppercase">Active Cases</p>
          <p className="text-2xl font-bold text-amber-400">—</p>
        </div>
      </div>
    </div>
  );
}
