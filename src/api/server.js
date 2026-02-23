const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk').default;

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check for Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'vernen-api', version: '1.0.0' });
});

// Audit categories and their skill mappings
const AUDIT_CATEGORIES = {
  'family-law': {
    name: 'California Family Law',
    skills: ['california-court-order-compliance-audit', 'fcs-child-custody-recommending-counselor-audit'],
    description: 'Custody orders, support calculations, DVRO compliance'
  },
  'civil-rights': {
    name: 'Constitutional & Civil Rights',
    skills: ['constitutional-and-civil-rights-audit'],
    description: '1983 claims, due process, equal protection'
  },
  'law-enforcement': {
    name: 'Law Enforcement Conduct',
    skills: ['ca-post-law-enforcement-audit', 'fbi-federal-law-enforcement-audit'],
    description: 'Police reports, use of force, POST standards'
  },
  'insurance': {
    name: 'Insurance Bad Faith',
    skills: ['california-insurance-bad-faith-audit'],
    description: 'Claims handling, settlement practices, denial analysis'
  },
  'medical': {
    name: 'Medical Billing & Conduct',
    skills: ['medical-billing-surgery-fraud-audit', 'abpn-psychiatry-and-neurology-standards-audit'],
    description: 'Billing fraud, upcoding, professional standards'
  },
  'attorney-conduct': {
    name: 'Attorney Ethics',
    skills: ['state-bar-of-california-attorney-conduct-audit'],
    description: 'Rules of Professional Conduct violations'
  },
  'cps': {
    name: 'Child Protective Services',
    skills: ['california-cps-child-welfare-audit'],
    description: 'CPS investigations, WIC compliance, CDSS standards'
  },
  'real-estate': {
    name: 'Real Estate Transaction Fraud',
    skills: ['california-real-estate-transaction-fraud-audit'],
    description: 'Title defects, escrow fraud, deed irregularities'
  },
  'consumer-reports': {
    name: 'FCRA / Consumer Reports',
    skills: ['fcra-chexsystems-consumer-report-audit'],
    description: 'Credit reporting disputes, reinvestigation failures'
  },
  'disability': {
    name: 'SSA/DDS Disability',
    skills: ['ssa-dds-disability-determination-audit'],
    description: 'Disability determination deficiencies'
  },
  'victim-rights': {
    name: "Marsy's Law / Victim Rights",
    skills: ['marsys-law-victim-rights-audit'],
    description: 'DA correspondence, victim notification'
  },
  'labor': {
    name: 'Labor & Employment',
    skills: ['california-labor-employment-audit'],
    description: 'Labor Code violations, NLRA, union matters'
  },
  'military': {
    name: 'Military Standards',
    skills: ['usmc-military-standards-audit', 'dod-federal-document-compliance-audit'],
    description: 'UCMJ, DoD directives, service records'
  },
  'state-agency': {
    name: 'State Agency Correspondence',
    skills: ['california-state-agency-correspondence-audit'],
    description: 'SAM compliance, plain language, accessibility'
  }
};

// GET /api/categories — list available audit types
app.get('/api/categories', (req, res) => {
  const categories = Object.entries(AUDIT_CATEGORIES).map(([id, cat]) => ({
    id,
    name: cat.name,
    description: cat.description
  }));
  res.json({ categories });
});

// POST /api/audit — submit document for audit
app.post('/api/audit', async (req, res) => {
  try {
    const { category, documentText, documentType, jurisdiction } = req.body;

    if (!category || !documentText) {
      return res.status(400).json({ error: 'category and documentText are required' });
    }

    const auditConfig = AUDIT_CATEGORIES[category];
    if (!auditConfig) {
      return res.status(400).json({ error: `Invalid category: ${category}` });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const systemPrompt = buildAuditSystemPrompt(auditConfig, jurisdiction || 'CA');

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Audit the following ${documentType || 'document'} under the ${auditConfig.name} standard:\n\n${documentText}`
      }]
    });

    const auditResult = message.content[0].text;

    res.json({
      auditId: `VRN-${Date.now()}`,
      category: auditConfig.name,
      jurisdiction: jurisdiction || 'CA',
      timestamp: new Date().toISOString(),
      result: auditResult,
      model: 'claude-sonnet-4-20250514',
      disclaimer: 'VERNEN™ provides compliance analysis, not legal advice. Consult a licensed attorney for legal decisions.'
    });

  } catch (err) {
    console.error('Audit error:', err.message);
    res.status(500).json({ error: 'Audit processing failed', detail: err.message });
  }
});

// Build S.o.C. audit system prompt
function buildAuditSystemPrompt(auditConfig, jurisdiction) {
  return `You are VERNEN™, an autonomous legal document audit engine.

METHODOLOGY: VERNEN™ S.o.C. Audit Protocol v1.0
You perform a 6-pass audit against the governing Standard of Creation (S.o.C.):
  Pass 1: Identify document type and governing S.o.C.
  Pass 2: Structural compliance check (format, required elements, signatures)
  Pass 3: Substantive compliance check (statutory requirements, procedural rules)
  Pass 4: Internal consistency analysis (contradictions, timeline gaps, missing evidence)
  Pass 5: Bias and fraud detection (one-sided language, omissions, misrepresentations)
  Pass 6: Cross-reference verification (citations, case numbers, statutory references)

AUDIT DOMAIN: ${auditConfig.name}
APPLICABLE SKILLS: ${auditConfig.skills.join(', ')}
JURISDICTION: ${jurisdiction}

OUTPUT FORMAT:
1. DOCUMENT IDENTIFICATION — type, date, parties, case numbers
2. GOVERNING S.o.C. — specific statutes, regulations, or professional codes
3. COMPLIANCE FINDINGS — each finding must cite:
   - The specific deficiency found
   - The exact text or omission in the document
   - The governing standard violated (with citation)
   - Severity: CRITICAL / MAJOR / MINOR / ADVISORY
4. INTERNAL CONSISTENCY ISSUES — contradictions, timeline problems
5. RISK ASSESSMENT — overall compliance grade and litigation impact
6. RECOMMENDED ACTIONS — prioritized by severity

Every finding must be traceable to evidence in the document AND a specific governing standard.
Do not speculate. Do not provide legal advice. Flag items requiring attorney review.

© 2026 VERNEN™ — Michael Vernen Thomas Hartmann. All rights reserved.
IP Manifest filed February 2, 2026.`;
}

app.listen(PORT, () => {
  console.log(`VERNEN™ API running on port ${PORT}`);
  console.log(`Categories: ${Object.keys(AUDIT_CATEGORIES).length}`);
  console.log(`Health: http://localhost:${PORT}/health`);
});
