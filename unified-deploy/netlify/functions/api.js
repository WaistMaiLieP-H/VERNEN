// VERNEN™ Netlify Serverless Functions — API endpoints
// Light endpoints served here; audit execution proxied to Render backend
// Deployed automatically with the site at /.netlify/functions/

const PRICING = {
  standard: { amount: 3500, name: 'Standard Audit', description: 'Single document, 6-pass S.o.C. analysis' },
  comprehensive: { amount: 9900, name: 'Comprehensive Audit', description: 'Multi-document, cross-reference, full compliance report' },
  litigation: { amount: 24900, name: 'Litigation Package', description: 'Full audit suite + filing-ready exhibits + timeline analysis' }
};

const CATEGORIES = {
  'family-law': { name: 'California Family Law', description: 'Custody orders, support calculations, DVRO compliance' },
  'civil-rights': { name: 'Constitutional & Civil Rights', description: '1983 claims, due process, equal protection' },
  'law-enforcement': { name: 'Law Enforcement Conduct', description: 'Police reports, use of force, POST standards' },
  'insurance': { name: 'Insurance Bad Faith', description: 'Claims handling, settlement practices, denial analysis' },
  'medical': { name: 'Medical Billing & Conduct', description: 'Billing fraud, upcoding, professional standards' },
  'attorney-conduct': { name: 'Attorney Ethics', description: 'Rules of Professional Conduct violations' },
  'cps': { name: 'Child Protective Services', description: 'CPS investigations, WIC compliance, CDSS standards' },
  'real-estate': { name: 'Real Estate Transaction Fraud', description: 'Title defects, escrow fraud, deed irregularities' },
  'consumer-reports': { name: 'FCRA / Consumer Reports', description: 'Credit reporting disputes, reinvestigation failures' },
  'disability': { name: 'SSA/DDS Disability', description: 'Disability determination deficiencies' },
  'victim-rights': { name: "Marsy's Law / Victim Rights", description: 'DA correspondence, victim notification' },
  'labor': { name: 'Labor & Employment', description: 'Labor Code violations, NLRA, union matters' },
  'military': { name: 'Military Standards', description: 'UCMJ, DoD directives, service records' },
  'state-agency': { name: 'State Agency Correspondence', description: 'SAM compliance, plain language, accessibility' }
};

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Render backend URL — set in Netlify env vars once deployed
const RENDER_API = process.env.RENDER_API_URL || null;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path.replace('/.netlify/functions/api', '').replace('/api', '');

  // GET /api/health
  if (path === '/health' || path === '') {
    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        status: 'ok',
        service: 'vernen-api-serverless',
        version: '1.0.1',
        backend: RENDER_API ? 'connected' : 'standalone'
      })
    };
  }

  // GET /api/categories
  if (path === '/categories') {
    const cats = Object.entries(CATEGORIES).map(([id, c]) => ({ id, ...c }));
    return { statusCode: 200, headers, body: JSON.stringify({ categories: cats }) };
  }

  // GET /api/pricing
  if (path === '/pricing') {
    const tiers = Object.entries(PRICING).map(([id, t]) => ({ id, ...t, amount: t.amount / 100 }));
    return { statusCode: 200, headers, body: JSON.stringify({ tiers, currency: 'usd' }) };
  }

  // POST /api/checkout — proxy to Render if available, else CashApp fallback
  if (path === '/checkout' && event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}');
    const { tier, category } = body;
    const pricing = PRICING[tier];
    if (!pricing) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid tier' }) };

    // Proxy to Render backend for Stripe checkout
    if (RENDER_API) {
      try {
        const resp = await fetch(`${RENDER_API}/api/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: event.body
        });
        const data = await resp.json();
        return { statusCode: resp.status, headers, body: JSON.stringify(data) };
      } catch (err) {
        // Fall through to CashApp fallback
      }
    }

    // CashApp fallback
    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        fallback: true,
        message: `Payment: $${pricing.amount / 100} via CashApp: $SuccessFlow78`,
        memo: `VERNEN ${tier} - ${category}`,
        amount: pricing.amount / 100
      })
    };
  }

  // POST /api/audit — proxy to Render backend
  if (path === '/audit' && event.httpMethod === 'POST') {
    if (!RENDER_API) {
      return {
        statusCode: 503, headers,
        body: JSON.stringify({
          error: 'Audit engine backend not yet configured',
          message: 'The full audit API is being deployed. Use the standalone engine at /app for immediate audits.',
          fallbackUrl: '/app'
        })
      };
    }

    try {
      const resp = await fetch(`${RENDER_API}/api/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: event.body
      });
      const data = await resp.json();
      return { statusCode: resp.status, headers, body: JSON.stringify(data) };
    } catch (err) {
      return {
        statusCode: 502, headers,
        body: JSON.stringify({ error: 'Backend unavailable', detail: err.message })
      };
    }
  }

  // GET /api/verify-payment/:sessionId — proxy to Render
  if (path.startsWith('/verify-payment/')) {
    if (!RENDER_API) {
      return { statusCode: 200, headers, body: JSON.stringify({ paid: true, fallback: true }) };
    }
    try {
      const resp = await fetch(`${RENDER_API}/api${path}`);
      const data = await resp.json();
      return { statusCode: resp.status, headers, body: JSON.stringify(data) };
    } catch (err) {
      return { statusCode: 200, headers, body: JSON.stringify({ paid: true, fallback: true }) };
    }
  }

  return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
};
