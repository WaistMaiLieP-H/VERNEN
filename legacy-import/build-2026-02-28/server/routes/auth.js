/**
 * VERNEN™ Auth Routes (Supabase)
 * Handles registration, login, logout, token refresh, password reset.
 */

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// ─── MIDDLEWARE: Extract token ────────────────────────────────────────
function extractToken(req) {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ message: 'Invalid token' });
    req.user = user;
    req.token = token;
    next();
  } catch {
    res.status(401).json({ message: 'Authentication failed' });
  }
}

// ─── REGISTER ────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || '', tier: 'free' },
      },
    });

    if (error) return res.status(400).json({ message: error.message });

    // Insert user profile in custom table
    await supabase.from('user_profiles').insert({
      id: data.user.id,
      email,
      display_name: displayName || '',
      tier: 'free',
      created_at: new Date().toISOString(),
    }).single();

    res.json({
      token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        displayName: displayName || '',
        tier: 'free',
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── LOGIN ───────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email, password,
    });

    if (error) return res.status(401).json({ message: error.message });

    // Get profile for tier info
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tier, display_name, preferred_language, subscription_expires')
      .eq('id', data.user.id)
      .single();

    res.json({
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        displayName: profile?.display_name || '',
        tier: profile?.tier || 'free',
        preferredLanguage: profile?.preferred_language || 'en',
        subscriptionExpires: profile?.subscription_expires || null,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── LOGOUT ──────────────────────────────────────────────────────────
router.post('/logout', requireAuth, async (req, res) => {
  try {
    await supabase.auth.admin.signOut(req.token);
    res.json({ success: true });
  } catch {
    res.json({ success: true }); // Best effort
  }
});

// ─── REFRESH TOKEN ───────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) return res.status(401).json({ message: 'Refresh failed' });

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tier, display_name, preferred_language, subscription_expires')
      .eq('id', data.user.id)
      .single();

    res.json({
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        displayName: profile?.display_name || '',
        tier: profile?.tier || 'free',
        preferredLanguage: profile?.preferred_language || 'en',
        subscriptionExpires: profile?.subscription_expires || null,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PASSWORD RESET ──────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.APP_URL || 'http://localhost:5173'}/reset-password`,
    });

    if (error) return res.status(400).json({ message: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── SUBSCRIPTION STATUS ─────────────────────────────────────────────
router.get('/subscription', requireAuth, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tier, subscription_expires, stripe_customer_id, stripe_subscription_id')
      .eq('id', req.user.id)
      .single();

    res.json({
      tier: profile?.tier || 'free',
      expiresAt: profile?.subscription_expires || null,
      stripeCustomerId: profile?.stripe_customer_id || null,
      stripeSubscriptionId: profile?.stripe_subscription_id || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export { router as authRouter, requireAuth, supabase };
