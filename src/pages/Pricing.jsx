import React from 'react';
import { Link } from 'react-router-dom';

const PLANS = [
  { name: 'Single Audit', price: '$35', period: 'per document', features: [
    'One document audit (up to 20 pages)',
    'S.o.C. compliance report',
    'Statute-traced findings',
    'PDF export',
  ], cta: 'Run Audit', highlight: false },
  { name: 'Pro Package', price: '$99', period: 'per analysis', features: [
    'Multi-document audit (up to 50 pages)',
    'Deep compliance analysis',
    'Cross-reference detection',
    'Bias and fraud screening',
    'Priority processing',
  ], cta: 'Start Pro Audit', highlight: true },
  { name: 'Full Case Review', price: '$249', period: 'per case', features: [
    'Unlimited documents per case',
    'All 28+ audit modules active',
    'Constitutional rights analysis',
    'Professional conduct review',
    'Exportable litigation packet',
    'Dedicated audit session',
  ], cta: 'Launch Case Review', highlight: false },
];

export default function Pricing() {
  return (
    <main className="pt-20 px-4 max-w-5xl mx-auto pb-20">
      <h1 className="text-3xl font-bold text-center mb-2 gold-gradient">Transparent Pricing</h1>
      <p className="text-gray-400 text-center mb-12">No subscriptions required. Pay per audit.</p>
      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map(({ name, price, period, features, cta, highlight }) => (
          <div key={name} className={`card-surface p-6 flex flex-col ${highlight ? 'border-gold-500 ring-1 ring-gold-500/30' : ''}`}>
            {highlight && <span className="text-xs text-gold-400 font-semibold mb-2">MOST POPULAR</span>}
            <h3 className="text-lg font-bold text-white">{name}</h3>
            <div className="mt-2 mb-4">
              <span className="text-3xl font-bold gold-gradient">{price}</span>
              <span className="text-sm text-gray-500 ml-1">{period}</span>
            </div>
            <ul className="space-y-2 mb-6 flex-1">
              {features.map(f => (
                <li key={f} className="text-sm text-gray-400 flex items-start gap-2">
                  <span className="text-gold-400 mt-0.5">✓</span>{f}
                </li>
              ))}
            </ul>
            <Link to="/audit" className={`block text-center py-3 rounded-lg font-semibold text-sm transition ${
              highlight ? 'bg-gold-500 text-dark-950 hover:bg-gold-400' : 'border border-gold-500 text-gold-400 hover:bg-gold-500/10'
            }`}>{cta}</Link>
          </div>
        ))}
      </div>
      <div className="mt-12 text-center">
        <p className="text-gray-500 text-sm">Payment via CashApp ($SuccessFlow78) or Stripe (coming soon)</p>
        <p className="text-gray-600 text-xs mt-1">30-day satisfaction guarantee on all services</p>
      </div>
    </main>
  );
}
