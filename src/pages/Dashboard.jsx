import React from 'react';

const MOCK_AUDITS = [
  { id: 'AUD-001', type: 'Court Order Compliance', jurisdiction: 'CA', date: '2026-02-23', status: 'Complete', findings: 4 },
  { id: 'AUD-002', type: 'Police Report Analysis', jurisdiction: 'CA', date: '2026-02-22', status: 'Complete', findings: 7 },
];

export default function Dashboard() {
  return (
    <main className="pt-20 px-4 max-w-5xl mx-auto pb-20">
      <h1 className="text-3xl font-bold mb-2 gold-gradient">Case Dashboard</h1>
      <p className="text-gray-400 mb-8">Track your audits, filings, and documents.</p>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="card-surface p-5 text-center">
          <div className="text-2xl font-bold gold-gradient">2</div>
          <div className="text-xs text-gray-400 mt-1">Total Audits</div>
        </div>
        <div className="card-surface p-5 text-center">
          <div className="text-2xl font-bold gold-gradient">11</div>
          <div className="text-xs text-gray-400 mt-1">Findings Identified</div>
        </div>
        <div className="card-surface p-5 text-center">
          <div className="text-2xl font-bold gold-gradient">0</div>
          <div className="text-xs text-gray-400 mt-1">Pending</div>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-800">
              <th className="text-left p-3 text-gold-400 font-medium">ID</th>
              <th className="text-left p-3 text-gold-400 font-medium">Type</th>
              <th className="text-left p-3 text-gold-400 font-medium hidden md:table-cell">Jurisdiction</th>
              <th className="text-left p-3 text-gold-400 font-medium">Date</th>
              <th className="text-left p-3 text-gold-400 font-medium">Findings</th>
              <th className="text-left p-3 text-gold-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_AUDITS.map(a => (
              <tr key={a.id} className="border-b border-dark-800/50 hover:bg-dark-800/30">
                <td className="p-3 text-gray-300 font-mono">{a.id}</td>
                <td className="p-3 text-gray-300">{a.type}</td>
                <td className="p-3 text-gray-400 hidden md:table-cell">{a.jurisdiction}</td>
                <td className="p-3 text-gray-400">{a.date}</td>
                <td className="p-3 text-gold-400 font-bold">{a.findings}</td>
                <td className="p-3"><span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs">{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-gray-600 text-xs mt-4 text-center">Dashboard connects to live audit data once API backend is deployed.</p>
    </main>
  );
}
