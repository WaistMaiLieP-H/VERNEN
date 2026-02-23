import React from 'react';
import { Link } from 'react-router-dom';

const SERVICES = [
  { category: 'Document Auditing', items: [
    { name: 'Court Order Compliance Audit', desc: 'Verify orders against CRC, CCP, Family Code requirements', price: '$35' },
    { name: 'Police Report Analysis', desc: 'Audit against POST standards and statutory duty requirements', price: '$35' },
    { name: 'CPS Determination Review', desc: 'Evaluate against WIC and CDSS standards', price: '$35' },
    { name: 'Medical Billing Fraud Scan', desc: 'Identify upcoding, unbundling, and billing irregularities', price: '$99' },
    { name: 'Insurance Bad Faith Audit', desc: 'Analyze claims handling against CA Insurance Code', price: '$99' },
  ]},
  { category: 'Legal Form Guidance', items: [
    { name: 'California Family Law Forms', desc: 'FL-300, FL-310, FL-311, DV-100 series — field-by-field', price: '$35' },
    { name: 'Federal Civil Rights Filing', desc: '§1983 complaint preparation and compliance check', price: '$99' },
    { name: 'Multi-State Form Package', desc: 'TX, NY, FL court form guidance with jurisdiction mapping', price: '$99' },
  ]},
  { category: 'Comprehensive Analysis', items: [
    { name: 'Full Case Audit', desc: 'Multi-document deep audit across all applicable standards', price: '$249' },
    { name: 'Attorney Conduct Review', desc: 'Evaluate against CA Rules of Professional Conduct', price: '$249' },
    { name: 'Constitutional Rights Analysis', desc: 'Due process, equal protection, 4th/14th Amendment audit', price: '$249' },
  ]},
];

export default function Services() {
  return (
    <main className="pt-20 px-4 max-w-5xl mx-auto pb-20">
      <h1 className="text-3xl font-bold mb-2 gold-gradient">Services Catalog</h1>
      <p className="text-gray-400 mb-10">Every analysis is statute-traced and powered by Claude AI.</p>
      {SERVICES.map(({ category, items }) => (
        <div key={category} className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">{category}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {items.map(({ name, desc, price }) => (
              <div key={name} className="card-surface p-5 flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-white text-sm">{name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{desc}</p>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <div className="text-gold-400 font-bold">{price}</div>
                  <Link to="/audit" className="text-xs text-gold-500 hover:underline">Start →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
