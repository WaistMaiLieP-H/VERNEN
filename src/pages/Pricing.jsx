import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || '';

const TIERS = [
  {
    id: 'standard',
    name: 'Standard Audit',
    price: '$35',
    period: 'per document',
    features: [
      'Single document audit (up to 20 pages)',
      'Full 6-pass S.o.C. analysis',
      'Statute-traced findings with severity',
      'TXT + DOCX export',
    ],
    cta: 'Run Audit',
    highlight: false,
  },
  {
    id: 'comprehensive',
    name: 'Comprehensive Audit',
    price: '$99',
    period: 'per analysis',
    features: [
      'Multi-document audit (up to 50 pages)',
      'Cross-reference and consistency analysis',
      'Bias and fraud screening',
      'All 14 audit categories available',
      'Priority processing',
    ],
    cta: 'Start Pro Audit',
    highlight: true,
  },
  {
    id: 'litigation',
    name: 'Litigation Package',
    price: '$249',
    period: 'per case',
    features: [
      'Unlimited documents per case',
      'All 28+ audit skill modules active',
      'Constitutional rights analysis',
      'Professional conduct review',
      'Filing-ready exhibit generation',
      'Timeline analysis + cross-case mapping',
    ],
    cta: 'Launch Case Review',
    highlight: false,
  },
];

const CATEGORIES = [
  { id: 'family-law', name: 'Family Law', icon: '⚖️' },
  { id: 'civil-rights', name: 'Civil Rights', icon: '🏛️' },
  { id: 'law-enforcement', name: 'Law Enforcement', icon: '🔍' },
  { id: 'insurance', name: 'Insurance Bad Faith', icon: '📋' },
  { id: 'medical', name: 'Medical Billing', icon: '🏥' },
  { id: 'attorney-conduct', name: 'Attorney Ethics', icon: '📜' },
  { id: 'cps', name: 'Child Protective Services', icon: '🛡️' },
  { id: 'real-estate', name: 'Real Estate Fraud', icon: '🏠' },
  { id: 'consumer-reports', name: 'FCRA / Consumer', icon: '📊' },
  { id: 'disability', name: 'SSA/DDS Disability', icon: '♿' },
  { id: 'victim-rights', name: "Victim Rights", icon: '⚡' },
  { id: 'labor', name: 'Labor & Employment', icon: '👷' },
  { id: 'military', name: 'Military Standards', icon: '🎖️' },
  { id: 'state-agency', name: 'State Agency', icon: '🏢' },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    if (!selectedTier || !selectedCategory) {
      setError('Select both an audit tier and category to proceed.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          category: selectedCategory,
          returnUrl: window.location.origin,
        }),
      });
      const data = await resp.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        // Stripe not configured — go to CashApp fallback
        setError(`Payment gateway unavailable. Use CashApp: $SuccessFlow78 with memo "VERNEN ${selectedTier} - ${selectedCategory}"`);
      }
    } catch (err) {
      setError(`Payment gateway offline. Use CashApp: $SuccessFlow78 with memo "VERNEN ${selectedTier} - ${selectedCategory}"`);
    } finally {
      setLoading(false);
    }
  };

  const handleFreeDemo = () => {
    navigate('/audit/demo');
  };

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>VERNEN™ Audit Services</h1>
      <p style={styles.subtitle}>AI-powered legal document analysis. Every finding traced to statute.</p>

      {/* Pricing Tiers */}
      <div style={styles.tiersGrid}>
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            onClick={() => { setSelectedTier(tier.id); setError(''); }}
            style={{
              ...styles.tierCard,
              ...(tier.highlight ? styles.tierHighlight : {}),
              ...(selectedTier === tier.id ? styles.tierSelected : {}),
            }}
          >
            {tier.highlight && <span style={styles.popularBadge}>MOST POPULAR</span>}
            <h3 style={styles.tierName}>{tier.name}</h3>
            <div style={styles.priceRow}>
              <span style={styles.price}>{tier.price}</span>
              <span style={styles.period}>{tier.period}</span>
            </div>
            <ul style={styles.featureList}>
              {tier.features.map((f) => (
                <li key={f} style={styles.featureItem}>
                  <span style={styles.checkmark}>✓</span>{f}
                </li>
              ))}
            </ul>
            <button
              style={{
                ...styles.tierBtn,
                ...(selectedTier === tier.id ? styles.tierBtnActive : {}),
              }}
            >
              {selectedTier === tier.id ? '● SELECTED' : tier.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Category Selection */}
      {selectedTier && (
        <div style={styles.categorySection}>
          <h2 style={styles.sectionTitle}>Select Audit Category</h2>
          <div style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setError(''); }}
                style={{
                  ...styles.categoryCard,
                  ...(selectedCategory === cat.id ? styles.categorySelected : {}),
                }}
              >
                <span style={styles.categoryIcon}>{cat.icon}</span>
                <span style={styles.categoryName}>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checkout */}
      {selectedTier && selectedCategory && (
        <div style={styles.checkoutBar}>
          <div style={styles.checkoutInfo}>
            <span style={styles.checkoutTier}>{TIERS.find(t => t.id === selectedTier)?.name}</span>
            <span style={styles.checkoutSep}>→</span>
            <span style={styles.checkoutCat}>{CATEGORIES.find(c => c.id === selectedCategory)?.name}</span>
            <span style={styles.checkoutPrice}>{TIERS.find(t => t.id === selectedTier)?.price}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading}
            style={styles.checkoutBtn}
          >
            {loading ? 'Processing…' : '▶ PROCEED TO PAYMENT'}
          </button>
        </div>
      )}

      {error && <p style={styles.error}>{error}</p>}

      {/* Free Demo CTA */}
      <div style={styles.demoSection}>
        <p style={styles.demoText}>Want to try the engine first?</p>
        <a href="https://vernen-legal.netlify.app/app" style={styles.demoBtn}>
          ▶ FREE DEMO — Autonomous Audit Engine
        </a>
        <p style={styles.demoSubtext}>No account required. Paste any document.</p>
      </div>

      <div style={styles.footer}>
        <p>Payment via Stripe or CashApp ($SuccessFlow78)</p>
        <p style={styles.footerSub}>30-day satisfaction guarantee • IP Manifest filed Feb 2, 2026</p>
      </div>
    </main>
  );
}

const styles = {
  main: { maxWidth: 1000, margin: '0 auto', padding: '40px 20px', fontFamily: "'IBM Plex Mono', monospace", color: '#c8c0b0', background: '#0a0a0c' },
  title: { textAlign: 'center', fontSize: 28, fontWeight: 700, color: '#c9a84c', marginBottom: 4, letterSpacing: 2 },
  subtitle: { textAlign: 'center', fontSize: 13, color: '#666', marginBottom: 40 },
  tiersGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 40 },
  tierCard: { background: '#111114', border: '1px solid #1e1e22', borderRadius: 4, padding: 24, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column' },
  tierHighlight: { borderColor: '#c9a84c40', boxShadow: '0 0 20px #c9a84c10' },
  tierSelected: { borderColor: '#c9a84c', boxShadow: '0 0 12px #c9a84c30' },
  popularBadge: { fontSize: 9, color: '#c9a84c', letterSpacing: 3, marginBottom: 8 },
  tierName: { fontSize: 16, fontWeight: 700, color: '#e0d8c8', marginBottom: 8 },
  priceRow: { marginBottom: 16 },
  price: { fontSize: 28, fontWeight: 700, color: '#c9a84c' },
  period: { fontSize: 11, color: '#555', marginLeft: 6 },
  featureList: { listStyle: 'none', padding: 0, margin: 0, flex: 1, marginBottom: 16 },
  featureItem: { fontSize: 12, color: '#888', padding: '4px 0', display: 'flex', alignItems: 'flex-start', gap: 8 },
  checkmark: { color: '#c9a84c', flexShrink: 0 },
  tierBtn: { background: 'none', border: '1px solid #333', color: '#666', padding: '10px 16px', borderRadius: 2, cursor: 'pointer', fontSize: 11, letterSpacing: 2, fontFamily: "'IBM Plex Mono', monospace", transition: 'all 0.2s' },
  tierBtnActive: { borderColor: '#c9a84c', color: '#c9a84c', background: '#171406' },
  categorySection: { marginBottom: 40 },
  sectionTitle: { fontSize: 14, color: '#c9a84c', letterSpacing: 3, marginBottom: 16, textAlign: 'center' },
  categoryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 },
  categoryCard: { background: '#0e0e11', border: '1px solid #1a1a1e', borderRadius: 3, padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' },
  categorySelected: { borderColor: '#c9a84c', background: '#131108' },
  categoryIcon: { fontSize: 16 },
  categoryName: { fontSize: 11, color: '#999' },
  checkoutBar: { background: '#111108', border: '1px solid #c9a84c40', borderRadius: 4, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  checkoutInfo: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  checkoutTier: { fontSize: 13, color: '#c9a84c', fontWeight: 600 },
  checkoutSep: { color: '#444' },
  checkoutCat: { fontSize: 12, color: '#aaa' },
  checkoutPrice: { fontSize: 18, fontWeight: 700, color: '#c9a84c', marginLeft: 12 },
  checkoutBtn: { background: '#c9a84c', color: '#0a0a0c', border: 'none', padding: '12px 24px', borderRadius: 3, cursor: 'pointer', fontSize: 12, fontWeight: 700, letterSpacing: 2, fontFamily: "'IBM Plex Mono', monospace" },
  error: { color: '#c94a4a', fontSize: 12, textAlign: 'center', marginBottom: 20, background: '#150505', border: '1px solid #5a2020', borderRadius: 3, padding: '10px 16px' },
  demoSection: { textAlign: 'center', marginTop: 40, padding: '24px 0', borderTop: '1px solid #1a1a1e' },
  demoText: { fontSize: 13, color: '#666', marginBottom: 12 },
  demoBtn: { display: 'inline-block', background: 'none', border: '1px solid #4a90d9', color: '#4a90d9', padding: '10px 20px', borderRadius: 3, textDecoration: 'none', fontSize: 12, letterSpacing: 2, fontFamily: "'IBM Plex Mono', monospace" },
  demoSubtext: { fontSize: 10, color: '#444', marginTop: 8 },
  footer: { textAlign: 'center', marginTop: 40, fontSize: 11, color: '#555' },
  footerSub: { fontSize: 10, color: '#444', marginTop: 4 },
};
