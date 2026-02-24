require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk').default;
const Stripe = require('stripe');

const app = express();
const PORT = process.env.PORT || 3001;
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

app.use(cors());
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'vernen-api',
    version: '1.0.0',
    stripe: !!stripe,
    anthropic: !!process.env.ANTHROPIC_API_KEY
  });
});

// Pricing tiers (in cents for Stripe)
const PRICING = {
  standard: { amount: 3500, name: 'Standard Audit', description: 'Single document, 6-pass S.o.C. analysis' },
  comprehensive: { amount: 9900, name: 'Comprehensive Audit', description: 'Multi-document, cross-reference, full compliance report' },
  litigation: { amount: 24900, name: 'Litigation Package', description: 'Full audit suite + filing-ready exhibits + timeline analysis' }
};

// Audit categories
const AUDIT_CATEGORIES = {
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

// GET /api/categories
app.get('/api/categories', (req, res) => {
  const categories = Object.entries(AUDIT_CATEGORIES).map(([id, cat]) => ({
    id, name: cat.name, description: cat.description
  }));
  res.json({ categories });
});

// GET /api/pricing
app.get('/api/pricing', (req, res) => {
  const tiers = Object.entries(PRICING).map(([id, tier]) => ({
    id, ...tier, amount: tier.amount / 100
  }));
  res.json({ tiers, currency: 'usd' });
});

// POST /api/checkout — create Stripe checkout session
app.post('/api/checkout', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payment processing not configured' });
  }
  try {
    const { tier, category, returnUrl } = req.body;
    const pricing = PRICING[tier];
    if (!pricing) return res.status(400).json({ error: 'Invalid tier' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `VERNEN™ ${pricing.name}`,
            description: `${AUDIT_CATEGORIES[category]?.name || 'General'} — ${pricing.description}`
          },
          unit_amount: pricing.amount
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${returnUrl || 'http://localhost:3000'}/audit/${category}?paid=true&session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl || 'http://localhost:3000'}/audit/${category}?cancelled=true`,
      metadata: { category, tier }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// In-memory paid sessions store (replace with DB in production)
const paidSessions = new Map();

// POST /api/webhook — Stripe webhook for payment confirmation
app.post('/api/webhook', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = JSON.parse(req.body);
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.payment_status === 'paid') {
      paidSessions.set(session.id, {
        category: session.metadata?.category,
        tier: session.metadata?.tier,
        paidAt: new Date().toISOString(),
        email: session.customer_details?.email,
      });
      console.log(`✓ Payment confirmed: ${session.id} — ${session.metadata?.tier} / ${session.metadata?.category}`);
    }
  }

  res.json({ received: true });
});

// GET /api/verify-payment/:sessionId — check if session is paid
app.get('/api/verify-payment/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  // Check in-memory store first
  if (paidSessions.has(sessionId)) {
    return res.json({ paid: true, ...paidSessions.get(sessionId) });
  }
  // Fallback: check Stripe directly
  if (stripe) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === 'paid') {
        return res.json({ paid: true, category: session.metadata?.category, tier: session.metadata?.tier });
      }
    } catch (err) {
      // Session not found
    }
  }
  res.json({ paid: false });
});


// POST /api/audit — run 6-pass S.o.C. audit
app.post('/api/audit', async (req, res) => {
  try {
    const { category, documentText, documentType, jurisdiction, sessionId } = req.body;
    if (!category || !documentText) {
      return res.status(400).json({ error: 'category and documentText required' });
    }
    const auditConfig = AUDIT_CATEGORIES[category];
    if (!auditConfig) return res.status(400).json({ error: 'Invalid category' });

    // Payment verification (skip if Stripe not configured — dev mode)
    if (stripe && sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== 'paid') {
        return res.status(402).json({ error: 'Payment required' });
      }
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const systemPrompt = buildAuditPrompt(auditConfig, jurisdiction || 'CA');

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Audit this ${documentType || 'document'} under ${auditConfig.name}:\n\n${documentText}` }]
    });

    res.json({
      auditId: `VRN-${Date.now()}`,
      category: auditConfig.name,
      jurisdiction: jurisdiction || 'CA',
      timestamp: new Date().toISOString(),
      result: message.content[0].text,
      disclaimer: 'VERNEN™ provides compliance analysis, not legal advice.'
    });
  } catch (err) {
    console.error('Audit error:', err.message);
    res.status(500).json({ error: 'Audit failed', detail: err.message });
  }
});


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

OUTPUT:
1. DOCUMENT IDENTIFICATION
2. GOVERNING S.o.C. (with citations)
3. COMPLIANCE FINDINGS — each with: deficiency, evidence, violated standard, severity (CRITICAL/MAJOR/MINOR/ADVISORY)
4. INTERNAL CONSISTENCY ISSUES
5. RISK ASSESSMENT
6. RECOMMENDED ACTIONS (prioritized)

Every finding must be traceable. No speculation. No legal advice. Flag items requiring attorney review.
© 2026 VERNEN™ — Michael Vernen Thomas Hartmann. IP Manifest filed Feb 2, 2026.`;
}

app.listen(PORT, () => {
  console.log(`VERNEN™ API running on port ${PORT}`);
  console.log(`Categories: ${Object.keys(AUDIT_CATEGORIES).length}`);
  console.log(`Stripe: ${stripe ? 'active' : 'not configured'}`);
  console.log(`Anthropic: ${process.env.ANTHROPIC_API_KEY ? 'active' : 'not configured'}`);
});
