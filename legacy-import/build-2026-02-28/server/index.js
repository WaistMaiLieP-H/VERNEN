/**
 * VERNEN™ Backend Server
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Express server providing:
 *   - Auth endpoints (Supabase-backed)
 *   - Stripe payment webhooks + checkout
 *   - EFSP proxy for court e-filing
 *   - Subscription management
 *
 * Environment variables required:
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY
 *   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 *   STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_ANNUAL
 *   STRIPE_PRICE_ADVOCATE_MONTHLY, STRIPE_PRICE_ADVOCATE_ANNUAL
 *   EFSP_API_URL, EFSP_API_KEY
 *   JWT_SECRET, PORT
 */

import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { paymentsRouter } from './routes/payments.js';
import { efilingRouter } from './routes/efiling.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── MIDDLEWARE ───────────────────────────────────────────────────────
// Stripe webhook needs raw body — must be before express.json()
app.post('/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => { req.rawBody = req.body; next(); }
);

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ─── ROUTES ──────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/efiling', efilingRouter);

// ─── HEALTH CHECK ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0-beta',
    platform: 'VERNEN™',
    timestamp: new Date().toISOString(),
  });
});

// ─── ERROR HANDLER ───────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(`[${new Date().toISOString()}] ${err.message}`, err.stack);
  res.status(err.status || 500).json({
    error: true,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

// ─── START ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`VERNEN™ server running on port ${PORT}`);
});

export default app;
