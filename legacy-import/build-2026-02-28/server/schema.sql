-- ─── VERNEN™ Supabase Schema ─────────────────────────────────────────
-- Run in Supabase SQL Editor to create required tables.
-- © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.

-- ─── User Profiles ───────────────────────────────────────────────────
-- Extends Supabase auth.users with VERNEN-specific fields
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT DEFAULT '',
  tier TEXT NOT NULL DEFAULT 'free'
    CHECK (tier IN ('guest', 'free', 'pro', 'advocate')),
  preferred_language TEXT DEFAULT 'en',
  -- Stripe
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_expires TIMESTAMPTZ,
  subscription_status TEXT DEFAULT 'none'
    CHECK (subscription_status IN (
      'none', 'active', 'trialing', 'past_due',
      'canceled', 'payment_failed', 'incomplete'
    )),
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Index for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer
  ON public.user_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription
  ON public.user_profiles(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tier
  ON public.user_profiles(tier);

-- ─── Filing Log ──────────────────────────────────────────────────────
-- Tracks all e-filing submissions
CREATE TABLE IF NOT EXISTS public.filing_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filing_id TEXT NOT NULL,
  county_code TEXT NOT NULL,
  case_number TEXT,
  filing_type TEXT NOT NULL,
  document_count INTEGER DEFAULT 0,
  fee_amount NUMERIC(10,2) DEFAULT 0,
  fee_waiver BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft', 'submitted', 'submitted_to_efsp', 'accepted',
      'rejected', 'filed', 'error'
    )),
  efsp_submission_id TEXT,
  efsp_confirmation TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_filing_user
  ON public.filing_log(user_id);
CREATE INDEX IF NOT EXISTS idx_filing_case
  ON public.filing_log(case_number);
CREATE INDEX IF NOT EXISTS idx_filing_efsp
  ON public.filing_log(efsp_submission_id);

-- ─── Audit Sessions ─────────────────────────────────────────────────
-- Tracks audit runs for traceability
CREATE TABLE IF NOT EXISTS public.audit_sessions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  form_id TEXT NOT NULL,
  form_title TEXT,
  language TEXT DEFAULT 'en',
  finding_count INTEGER DEFAULT 0,
  severity_critical INTEGER DEFAULT 0,
  severity_high INTEGER DEFAULT 0,
  severity_medium INTEGER DEFAULT 0,
  severity_low INTEGER DEFAULT 0,
  traceability_hash TEXT,  -- SHA-256 of finalized traceability log
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user
  ON public.audit_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_session
  ON public.audit_sessions(session_id);

-- ─── Row Level Security ──────────────────────────────────────────────
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filing_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own profile
CREATE POLICY "Users read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can only access their own filings
CREATE POLICY "Users read own filings" ON public.filing_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own filings" ON public.filing_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only access their own audit sessions
CREATE POLICY "Users read own audits" ON public.audit_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own audits" ON public.audit_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role bypasses RLS (used by server-side operations)
-- This is handled automatically by Supabase service key
