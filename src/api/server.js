import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── Health ──
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'vernen-api', version: '1.0.0', ts: new Date().toISOString() });
});

// ── Service Catalog ──
const SERVICES = [
  { id: 'doc-audit', name: 'Document Audit', desc: 'S.o.C. compliance audit', price: 3500, tier: 'standard' },
  { id: 'form-guidance', name: 'Form Guidance', desc: 'Field-level annotation + completion', price: 3500, tier: 'standard' },
  { id: 'case-analysis', name: 'Case Analysis', desc: 'Multi-document case audit with timeline', price: 9900, tier: 'professional' },
  { id: 'full-litigation', name: 'Litigation Package', desc: 'Complete filing-ready audit package', price: 24900, tier: 'enterprise' }
];
app.get('/api/services', (req, res) => res.json({ services: SERVICES }));

// ── Jurisdictions ──
const JURISDICTIONS = {
  CA: { name: 'California', codes: ['FAM','PEN','WIC','CCP','CIV','EVID','GOV','BPC','LAB','HSC','INS','PROB'], status: 'full' },
  TX: { name: 'Texas', codes: [], status: 'planned' },
  NY: { name: 'New York', codes: [], status: 'planned' },
  FL: { name: 'Florida', codes: [], status: 'planned' }
};
app.get('/api/jurisdictions', (req, res) => res.json({ jurisdictions: JURISDICTIONS }));

// ── Supported Case Types ──
const CASE_TYPES = [
  { id: 'family-custody', name: 'Family Law — Custody', jurisdiction: 'CA', skills: ['fcs-child-custody','california-court-order-compliance','california-cps-child-welfare','marsys-law-victim-rights'] },
  { id: 'family-dv', name: 'Family Law — DV/Restraining Orders', jurisdiction: 'CA', skills: ['california-court-order-compliance','ca-post-law-enforcement','marsys-law-victim-rights'] },
  { id: 'civil-rights', name: 'Civil Rights / §1983', jurisdiction: 'FEDERAL', skills: ['constitutional-and-civil-rights','fbi-federal-law-enforcement'] },
  { id: 'insurance-bad-faith', name: 'Insurance Bad Faith', jurisdiction: 'CA', skills: ['california-insurance-bad-faith'] },
  { id: 'real-estate-fraud', name: 'Real Estate Fraud', jurisdiction: 'CA', skills: ['california-real-estate-transaction-fraud'] },
  { id: 'medical-billing', name: 'Medical Billing Fraud', jurisdiction: 'CA', skills: ['medical-billing-surgery-fraud'] },
  { id: 'employment', name: 'Employment / Labor', jurisdiction: 'CA', skills: ['california-labor-employment'] },
  { id: 'disability', name: 'SSA/DDS Disability', jurisdiction: 'FEDERAL', skills: ['ssa-dds-disability-determination'] },
  { id: 'consumer-reports', name: 'FCRA / Consumer Reports', jurisdiction: 'FEDERAL', skills: ['fcra-chexsystems-consumer-report'] },
  { id: 'attorney-conduct', name: 'Attorney Misconduct', jurisdiction: 'CA', skills: ['state-bar-of-california-attorney-conduct'] },
  { id: 'law-enforcement', name: 'Law Enforcement Misconduct', jurisdiction: 'CA', skills: ['ca-post-law-enforcement'] },
  { id: 'military', name: 'USMC / Military', jurisdiction: 'FEDERAL', skills: ['usmc-military-standards','dod-federal-document-compliance'] }
];
app.get('/api/case-types', (req, res) => res.json({ case_types: CASE_TYPES }));

// ── Audit Submission ──
app.post('/api/audit', async (req, res) => {
  const { document_text, case_type, jurisdiction, language } = req.body;
  if (!document_text || !case_type) {
    return res.status(400).json({ error: 'document_text and case_type required' });
  }
  const caseConfig = CASE_TYPES.find(c => c.id === case_type);
  if (!caseConfig) return res.status(400).json({ error: 'Invalid case_type' });

  const auditId = `VAUD-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const submission = {
    audit_id: auditId,
    status: 'queued',
    case_type: caseConfig,
    jurisdiction: jurisdiction || caseConfig.jurisdiction,
    language: language || 'en',
    submitted_at: new Date().toISOString(),
    document_length: document_text.length,
    skills_applied: caseConfig.skills,
    estimated_passes: 6
  };
  // In production: queue to Claude API with skill system prompts
  // For now: return submission receipt
  res.json({ submission, message: 'Audit queued. S.o.C. 6-pass analysis will be delivered.' });
});

// ── Languages ──
const LANGUAGES = ['en','es','zh','tl','vi','ko','ar','hy','fa','ru','ja','hi','fr'];
app.get('/api/languages', (req, res) => res.json({ supported: LANGUAGES, default: 'en' }));

// ── Serve static frontend in production ──
if (process.env.NODE_ENV === 'production') {
  const { join } = await import('path');
  app.use(express.static(join(__dirname, '../../dist')));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(__dirname, '../../dist/index.html'));
    }
  });
}

// ── Start ──
app.listen(PORT, () => {
  console.log(`VERNEN™ API running on port ${PORT}`);
  console.log(`Services: ${SERVICES.length} | Case Types: ${CASE_TYPES.length} | Languages: ${LANGUAGES.length}`);
});

export default app;
