import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CATEGORY_ICONS = {
  'family-law': '⚖️', 'civil-rights': '🛡️', 'law-enforcement': '🔍',
  'insurance': '📋', 'medical': '🏥', 'attorney-conduct': '📜',
  'cps': '👶', 'real-estate': '🏠', 'consumer-reports': '📊',
  'disability': '♿', 'victim-rights': '🔔', 'labor': '🔧',
  'military': '🎖️', 'state-agency': '🏛️'
};

export default function Dashboard() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => { setCategories(data.categories); setLoading(false); })
      .catch(() => {
        // Fallback: hardcoded categories if API not running
        setCategories([
          { id: 'family-law', name: 'California Family Law', description: 'Custody orders, support calculations, DVRO compliance' },
          { id: 'civil-rights', name: 'Constitutional & Civil Rights', description: '1983 claims, due process, equal protection' },
          { id: 'law-enforcement', name: 'Law Enforcement Conduct', description: 'Police reports, use of force, POST standards' },
          { id: 'insurance', name: 'Insurance Bad Faith', description: 'Claims handling, settlement practices, denial analysis' },
          { id: 'medical', name: 'Medical Billing & Conduct', description: 'Billing fraud, upcoding, professional standards' },
          { id: 'attorney-conduct', name: 'Attorney Ethics', description: 'Rules of Professional Conduct violations' },
          { id: 'cps', name: 'Child Protective Services', description: 'CPS investigations, WIC compliance, CDSS standards' },
          { id: 'real-estate', name: 'Real Estate Transaction Fraud', description: 'Title defects, escrow fraud, deed irregularities' },
          { id: 'consumer-reports', name: 'FCRA / Consumer Reports', description: 'Credit reporting disputes, reinvestigation failures' },
          { id: 'disability', name: 'SSA/DDS Disability', description: 'Disability determination deficiencies' },
          { id: 'victim-rights', name: "Marsy's Law / Victim Rights", description: 'DA correspondence, victim notification' },
          { id: 'labor', name: 'Labor & Employment', description: 'Labor Code violations, NLRA, union matters' },
          { id: 'military', name: 'Military Standards', description: 'UCMJ, DoD directives, service records' },
          { id: 'state-agency', name: 'State Agency Correspondence', description: 'SAM compliance, plain language, accessibility' }
        ]);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">
          <span className="text-vernen-gold">VERNEN™</span> Legal Audit Marketplace
        </h1>
        <p className="text-vernen-muted text-lg max-w-2xl mx-auto">
          Claude AI-powered document auditing across 14 categories. Upload. Audit. Act.
        </p>
        <div className="flex justify-center gap-6 mt-4 text-xs text-vernen-muted">
          <span>🔒 Statute-Traced</span>
          <span>🌐 13 Languages</span>
          <span>⚡ 6-Pass S.o.C. Protocol</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-vernen-muted">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <Link key={cat.id} to={`/audit/${cat.id}`}
              className="group block p-5 rounded-lg bg-vernen-panel border border-vernen-border
                         hover:border-vernen-gold/50 transition-all duration-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{CATEGORY_ICONS[cat.id] || '📄'}</span>
                <div>
                  <h3 className="font-semibold text-vernen-text group-hover:text-vernen-gold transition">
                    {cat.name}
                  </h3>
                  <p className="text-vernen-muted text-sm mt-1">{cat.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
