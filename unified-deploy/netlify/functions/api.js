// VERNEN™ Netlify Serverless Functions — API endpoints
// All endpoints served directly. Audit calls Anthropic API inline.
// © 2026 VERNEN™ — Michael Vernen Thomas Hartmann. IP Manifest filed Feb 2, 2026.

const PRICING = {
  standard: { amount: 3500, name: 'Standard Audit', description: 'Single document, 6-pass S.o.C. analysis' },
  comprehensive: { amount: 9900, name: 'Comprehensive Audit', description: 'Multi-document, cross-reference, full compliance report' },
  litigation: { amount: 24900, name: 'Litigation Package', description: 'Full audit suite + filing-ready exhibits + timeline analysis' }
};

const CATEGORIES = {
  'family-law': { name: 'California Family Law', skills: ['california-court-order-compliance-audit', 'fcs-child-custody-recommending-counselor-audit'], description: 'Custody orders, support calculations, DVRO compliance' },
  'civil-rights': { name: 'Constitutional & Civil Rights', skills: ['constitutional-and-civil-rights-audit'], description: '1983 claims, due process, equal protection' },
  'law-enforcement': { name: 'Law Enforcement Conduct', skills: ['ca-post-law-enforcement-audit', 'fbi-federal-law-enforcement-audit'], description: 'Police reports, use of force, POST standards' },
  'insurance': { name: 'Insurance Bad Faith', skills: ['california-insurance-bad-faith-audit'], description: 'Claims handling, settlement practices, denial analysis' },
  'medical': { name: 'Medical Billing & Conduct', skills: ['medical-billing-surgery-fraud-audit', 'abpn-psychiatry-and-neurology-standards-audit'], description: 'Billing fraud, upcoding, professional standards' },
  'attorney-conduct': { name: 'Attorney Ethics', skills: ['state-bar-of-california-attorney-conduct-audit'], description: 'Rules of Professional Conduct violations' },
  'cps': { name: 'Child Protective Services', skills: ['california-cps-child-welfare-audit'], description: 'CPS investigations, WIC compliance, CDSS standards' },
  'real-estate': { name: 'Real Estate Transaction Fraud', skills: ['california-real-estate-transaction-fraud-audit'], description: 'Title defects, escrow fraud, deed irregularities' },
  'consumer-reports': { name: 'FCRA / Consumer Reports', skills: ['fcra-chexsystems-consumer-report-audit'], description: 'Credit reporting disputes, reinvestigation failures' },
  'disability': { name: 'SSA/DDS Disability', skills: ['ssa-dds-disability-determination-audit'], description: 'Disability determination deficiencies' },
  'victim-rights': { name: "Marsy's Law / Victim Rights", skills: ['marsys-law-victim-rights-audit'], description: 'DA correspondence, victim notification' },
  'labor': { name: 'Labor & Employment', skills: ['california-labor-employment-audit'], description: 'Labor Code violations, NLRA, union matters' },
  'military': { name: 'Military Standards', skills: ['usmc-military-standards-audit', 'dod-federal-document-compliance-audit'], description: 'UCMJ, DoD directives, service records' },
  'state-agency': { name: 'State Agency Correspondence', skills: ['california-state-agency-correspondence-audit'], description: 'SAM compliance, plain language, accessibility' }
};

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

function buildAuditPrompt(auditConfig, jurisdiction) {
  return `You are VERNEN™, an autonomous legal document audit engine.

METHODOLOGY: VERNEN™ S.o.C. Audit Protocol v1.0
6-pass audit against the governing Standard of Creation:
  Pass 1: Document type identification and governing S.o.C.
  Pass 2: Structural compliance (format, required elements, signatures)
  Pass 3: Substantive compliance (statutory requirements, procedural rules)
  Pass 4: Internal consistency (contradictions, timeline gaps, missing evidence)
  Pass 5: Bias and fraud detection (one-sided language, omissions, misrepresentations)
  Pass 6: Cross-reference verification (citations, case numbers, statutory references)

DOMAIN: ${auditConfig.name}
SKILLS: ${auditConfig.skills.join(', ')}
JURISDICTION: ${jurisdiction}

OUTPUT FORMAT:
1. DOCUMENT IDENTIFICATION — type, parties, date, jurisdiction
2. GOVERNING S.o.C. — applicable statutes/rules with citations
3. COMPLIANCE FINDINGS — each: deficiency | evidence | violated standard | severity (CRITICAL/MAJOR/MINOR/ADVISORY)
4. INTERNAL CONSISTENCY ISSUES
5. RISK ASSESSMENT — overall compliance score, litigation exposure
6. RECOMMENDED ACTIONS — prioritized

Every finding traceable. No speculation. No legal advice. Flag items requiring attorney review.
Be concise and direct. Prioritize the most significant findings.
© 2026 VERNEN™ — Michael Vernen Thomas Hartmann. IP Manifest filed Feb 2, 2026.`;
}

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
        service: 'vernen-api',
        version: '1.1.0',
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        stripe: !!process.env.STRIPE_SECRET_KEY
      })
    };
  }

  // GET /api/categories
  if (path === '/categories') {
    const cats = Object.entries(CATEGORIES).map(([id, c]) => ({ id, name: c.name, description: c.description }));
    return { statusCode: 200, headers, body: JSON.stringify({ categories: cats }) };
  }

  // GET /api/pricing
  if (path === '/pricing') {
    const tiers = Object.entries(PRICING).map(([id, t]) => ({ id, ...t, amount: t.amount / 100 }));
    return { statusCode: 200, headers, body: JSON.stringify({ tiers, currency: 'usd' }) };
  }

  // POST /api/checkout
  if (path === '/checkout' && event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}');
    const { tier, category } = body;
    const pricing = PRICING[tier];
    if (!pricing) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid tier' }) };

    // Stripe checkout if configured
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: `VERNEN™ ${pricing.name}`,
                description: `${CATEGORIES[category]?.name || 'General'} — ${pricing.description}`
              },
              unit_amount: pricing.amount
            },
            quantity: 1
          }],
          mode: 'payment',
          success_url: `${body.returnUrl || 'https://vernen-legal.netlify.app'}/marketplace/audit/${category}?paid=true&session={CHECKOUT_SESSION_ID}`,
          cancel_url: `${body.returnUrl || 'https://vernen-legal.netlify.app'}/marketplace/audit/${category}?cancelled=true`,
          metadata: { category, tier }
        });
        return { statusCode: 200, headers, body: JSON.stringify({ sessionId: session.id, url: session.url }) };
      } catch (err) {
        // Fall through to CashApp
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

  // POST /api/audit — direct Anthropic call
  if (path === '/audit' && event.httpMethod === 'POST') {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 503, headers,
        body: JSON.stringify({ error: 'Audit engine not configured. Set ANTHROPIC_API_KEY in Netlify env vars.' })
      };
    }

    try {
      const body = JSON.parse(event.body || '{}');
      const { category, documentText, documentType, jurisdiction, sessionId } = body;

      if (!category || !documentText) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'category and documentText required' }) };
      }

      const auditConfig = CATEGORIES[category];
      if (!auditConfig) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid category' }) };
      }

      // Stripe payment verification if configured
      if (process.env.STRIPE_SECRET_KEY && sessionId) {
        try {
          const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
          const session = await stripe.checkout.sessions.retrieve(sessionId);
          if (session.payment_status !== 'paid') {
            return { statusCode: 402, headers, body: JSON.stringify({ error: 'Payment required' }) };
          }
        } catch (e) {
          // Allow through if session check fails (CashApp flow)
        }
      }

      const systemPrompt = buildAuditPrompt(auditConfig, jurisdiction || 'CA');

      // Truncate document to stay within token budget for fast response
      const truncatedDoc = documentText.substring(0, 12000);

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: 'user', content: `Audit this ${documentType || 'document'} under ${auditConfig.name}:\n\n${truncatedDoc}` }]
        })
      });

      const data = await resp.json();

      if (!resp.ok) {
        return { statusCode: 502, headers, body: JSON.stringify({ error: 'Anthropic API error', detail: data.error?.message || 'Unknown' }) };
      }

      return {
        statusCode: 200, headers,
        body: JSON.stringify({
          auditId: `VRN-${Date.now()}`,
          category: auditConfig.name,
          jurisdiction: jurisdiction || 'CA',
          timestamp: new Date().toISOString(),
          result: data.content[0].text,
          disclaimer: 'VERNEN™ provides compliance analysis, not legal advice. © 2026 Michael Vernen Thomas Hartmann.'
        })
      };
    } catch (err) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Audit failed', detail: err.message }) };
    }
  }

  // GET /api/verify-payment/:sessionId
  if (path.startsWith('/verify-payment/')) {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { statusCode: 200, headers, body: JSON.stringify({ paid: true, fallback: true }) };
    }
    try {
      const sessionId = path.replace('/verify-payment/', '');
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return {
        statusCode: 200, headers,
        body: JSON.stringify({ paid: session.payment_status === 'paid', category: session.metadata?.category, tier: session.metadata?.tier })
      };
    } catch (err) {
      return { statusCode: 200, headers, body: JSON.stringify({ paid: false }) };
    }
  }

  return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
};
