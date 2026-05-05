/**
 * VERNEN™ E-Filing Routes (EFSP Proxy)
 * Proxies filing submissions to approved California EFSPs.
 * Handles document upload, submission, and status tracking.
 */

import { Router } from 'express';
import { requireAuth, supabase } from './auth.js';

const router = Router();

const EFSP_API_URL = process.env.EFSP_API_URL || '';
const EFSP_API_KEY = process.env.EFSP_API_KEY || '';

// ─── SUBMIT FILING ───────────────────────────────────────────────────
router.post('/submit', requireAuth, async (req, res) => {
  try {
    const {
      filingId, court, filingType, documentCount,
      feeAmount, feeWaiverGranted, signatureCertificates,
    } = req.body;

    if (!court?.countyCode) {
      return res.status(400).json({ message: 'County code required' });
    }
    if (!documentCount) {
      return res.status(400).json({ message: 'No documents to file' });
    }

    // Log filing attempt
    await supabase.from('filing_log').insert({
      user_id: req.user.id,
      filing_id: filingId,
      county_code: court.countyCode,
      case_number: court.caseNumber || null,
      filing_type: filingType,
      document_count: documentCount,
      fee_amount: feeAmount,
      fee_waiver: feeWaiverGranted,
      status: 'submitted',
      created_at: new Date().toISOString(),
    });

    // Forward to EFSP API (when configured)
    if (EFSP_API_URL && EFSP_API_KEY) {
      const efspRes = await fetch(`${EFSP_API_URL}/filings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${EFSP_API_KEY}`,
        },
        body: JSON.stringify({
          courtCode: court.countyCode,
          caseNumber: court.caseNumber,
          filingType,
          feeAmount: feeWaiverGranted ? 0 : feeAmount,
          feeWaiver: feeWaiverGranted,
          documentCount,
          submittedBy: req.user.email,
        }),
      });

      if (!efspRes.ok) {
        const err = await efspRes.json().catch(() => ({}));
        return res.status(502).json({
          message: err.message || 'EFSP submission failed',
        });
      }

      const efspData = await efspRes.json();

      // Update filing log
      await supabase.from('filing_log')
        .update({
          efsp_submission_id: efspData.submissionId || efspData.envelopeId,
          efsp_confirmation: efspData.confirmationNumber,
          status: 'submitted_to_efsp',
        })
        .eq('filing_id', filingId)
        .eq('user_id', req.user.id);

      return res.json({
        submissionId: efspData.submissionId || efspData.envelopeId,
        confirmationNumber: efspData.confirmationNumber,
        status: 'submitted',
      });
    }

    // No EFSP configured — return mock submission for development
    const mockId = `mock_${Date.now()}`;
    res.json({
      submissionId: mockId,
      confirmationNumber: `VERNEN-${mockId.slice(-8).toUpperCase()}`,
      status: 'submitted',
      note: 'EFSP not configured — mock submission for development',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── CHECK FILING STATUS ─────────────────────────────────────────────
router.get('/status/:submissionId', requireAuth, async (req, res) => {
  try {
    const { submissionId } = req.params;

    // Check EFSP if configured
    if (EFSP_API_URL && EFSP_API_KEY) {
      try {
        const efspRes = await fetch(`${EFSP_API_URL}/filings/${submissionId}/status`, {
          headers: { 'Authorization': `Bearer ${EFSP_API_KEY}` },
        });
        if (efspRes.ok) {
          const data = await efspRes.json();
          return res.json({
            status: data.status,
            filedStampedUrl: data.filedStampedDocumentUrl || null,
            rejectionReason: data.rejectionReason || null,
            lastUpdated: data.lastUpdated || new Date().toISOString(),
          });
        }
      } catch {}
    }

    // Fallback to local log
    const { data: filing } = await supabase
      .from('filing_log')
      .select('status, efsp_submission_id, created_at')
      .eq('efsp_submission_id', submissionId)
      .single();

    res.json({
      status: filing?.status || 'unknown',
      submissionId,
      lastUpdated: filing?.created_at || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── FILING HISTORY ──────────────────────────────────────────────────
router.get('/history', requireAuth, async (req, res) => {
  try {
    const { data: filings } = await supabase
      .from('filing_log')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    res.json({ filings: filings || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── AVAILABLE COURTS ────────────────────────────────────────────────
router.get('/courts', (req, res) => {
  // Static list — no auth required
  res.json({
    courts: [
      { code: 'alameda', name: 'Alameda County Superior Court', efiling: true },
      { code: 'contra_costa', name: 'Contra Costa County Superior Court', efiling: true },
      { code: 'los_angeles', name: 'Los Angeles County Superior Court', efiling: true },
      { code: 'marin', name: 'Marin County Superior Court', efiling: true },
      { code: 'orange', name: 'Orange County Superior Court', efiling: true },
      { code: 'sacramento', name: 'Sacramento County Superior Court', efiling: true },
      { code: 'san_diego', name: 'San Diego County Superior Court', efiling: true },
      { code: 'san_francisco', name: 'San Francisco County Superior Court', efiling: true },
      { code: 'santa_clara', name: 'Santa Clara County Superior Court', efiling: true },
      { code: 'solano', name: 'Solano County Superior Court', efiling: true },
      { code: 'sonoma', name: 'Sonoma County Superior Court', efiling: true },
    ],
  });
});

export { router as efilingRouter };
