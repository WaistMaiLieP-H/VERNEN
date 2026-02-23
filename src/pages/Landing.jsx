import React from 'react';
import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: '🔍', title: 'Document Audit', desc: 'Upload any legal document. Our 6-pass S.o.C. engine traces every defect to its governing statute.' },
  { icon: '📋', title: 'Form Guidance', desc: 'Field-by-field instructions for court forms across all 50 states.' },
  { icon: '🌐', title: '13 Languages', desc: 'Full multilingual support with annotated legal glossaries.' },
  { icon: '⚖️', title: 'Compliance Analysis', desc: 'Real-time statute validation against state codes, federal law, and professional standards.' },
  { icon: '🛡️', title: 'Bias Detection', desc: 'Automated detection of one-sided drafting, missing disclosures, and procedural irregularities.' },
  { icon: '📊', title: 'Case Dashboard', desc: 'Track filings, deadlines, audit history, and document status from one command center.' },
];

const STATS = [
  { num: '28+', label: 'Audit Modules' },
  { num: '13', label: 'Languages' },
  { num: '50', label: 'States' },
  { num: '6-Pass', label: 'S.o.C. Protocol' },
];

export default function Landing() {
  return (
    <main className="pt-16">
      {/* Hero */}
      <section className="relative px-4 py-24 md:py-36 text-center max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          <span className="gold-gradient">AI-Powered Legal Analysis</span>
          <br />
          <span className="text-white">For Everyone</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
          VERNEN™ delivers audit-grade legal document analysis powered by Claude AI.
          Statute-traced findings. 13 languages. No attorney required.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/audit"
            className="px-8 py-3 bg-gold-500 text-dark-950 rounded-lg font-semibold text-lg hover:bg-gold-400 transition">
            Start Free Audit
          </Link>
          <Link to="/pricing"
            className="px-8 py-3 border border-gold-500 text-gold-400 rounded-lg font-semibold text-lg hover:bg-gold-500/10 transition">
            View Pricing
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 py-12 border-y border-dark-800/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(({ num, label }) => (
            <div key={label}>
              <div className="text-3xl font-bold gold-gradient">{num}</div>
              <div className="text-sm text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 gold-gradient">What VERNEN™ Does</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} className="card-surface p-6">
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 text-center">
        <div className="card-surface max-w-3xl mx-auto p-12">
          <h2 className="text-3xl font-bold mb-4 gold-gradient">Ready to Audit Your Documents?</h2>
          <p className="text-gray-400 mb-8">Upload any legal document and receive a statute-traced compliance report in minutes.</p>
          <Link to="/audit"
            className="inline-block px-8 py-3 bg-gold-500 text-dark-950 rounded-lg font-semibold text-lg hover:bg-gold-400 transition">
            Launch Audit Portal
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-dark-800/50 text-center text-xs text-gray-500">
        <p>© 2026 Michael Vernen Thomas Hartmann. VERNEN™ — All rights reserved.</p>
        <p className="mt-1">IP Manifest Filed February 2, 2026 | Powered by Claude AI</p>
      </footer>
    </main>
  );
}
