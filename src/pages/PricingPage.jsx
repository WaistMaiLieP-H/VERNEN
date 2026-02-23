import React from 'react';
import { Link } from 'react-router-dom';

const tiers = [
  {
    id: 'basic', name: 'Single Audit', price: 35,
    features: ['1 document audit', '6-pass S.o.C. compliance check', 'PDF report with statute citations', 'Standard processing'],
    cta: 'Start Audit', highlight: false
  },
  {
    id: 'standard', name: 'Case Package', price: 99,
    features: ['Up to 5 documents', 'Cross-document analysis', 'Timeline mapping', 'PDF + DOCX reports', 'Bias & fraud detection layer'],
    cta: 'Get Case Package', highlight: true
  },
  {
    id: 'premium', name: 'Full Litigation Prep', price: 249,
    features: ['Unlimited documents', 'Multi-jurisdiction analysis', 'Form guidance in 13 languages', 'Attorney briefing packet', 'Priority processing', 'Scenario-indexed recommendations'],
    cta: 'Get Full Prep', highlight: false
  }
];

export default function PricingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-center mb-2">Pricing</h1>
      <p className="text-gray-400 text-center mb-12">
        No subscriptions required. Pay per audit or per case.
      </p>
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map(tier => (
          <div key={tier.id} className={`rounded-xl p-6 ${tier.highlight ? 'bg-amber-500/10 border-2 border-amber-500' : 'bg-gray-900 border border-gray-800'}`}>
            {tier.highlight && <p className="text-amber-400 text-xs font-semibold uppercase mb-2">Most Popular</p>}
            <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
            <p className="text-3xl font-bold text-amber-400 mb-4">${tier.price}</p>
            <ul className="space-y-2 mb-6">
              {tier.features.map((f, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">✓</span>{f}
                </li>
              ))}
            </ul>
            <Link to="/audit" className={`block text-center py-2.5 rounded-lg font-semibold transition ${tier.highlight ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'border border-gray-600 hover:border-amber-500 text-gray-300'}`}>
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>
      <div className="mt-12 text-center">
        <p className="text-gray-500 text-sm">Payment via CashApp: <span className="text-amber-400 font-mono">$SuccessFlow78</span></p>
        <p className="text-gray-600 text-xs mt-2">Stripe integration coming soon</p>
      </div>
    </div>
  );
}
