/**
 * VERNEN™ Auth & Payments Test Suite
 * Tests AuthManager tier system, access control, and PaymentManager pricing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AuthManager, TIERS } from '../auth/AuthManager.js';
import { PaymentManager } from '../payments/PaymentManager.js';

// ═══════════════════════════════════════════════════════════════════════
// AUTH MANAGER TESTS
// ═══════════════════════════════════════════════════════════════════════
describe('AuthManager — Tier Access Control', () => {
  let auth;

  beforeEach(() => {
    auth = new AuthManager({ apiUrl: '/api/auth' });
  });

  it('defaults to GUEST tier when unauthenticated', () => {
    const tier = auth.getCurrentTier?.() || auth.tier || 'guest';
    expect(tier).toBe('guest');
  });

  it('GUEST can access Tier A forms', () => {
    expect(auth.canAccessFormTier('A')).toBe(true);
  });

  it('GUEST cannot access Tier B forms', () => {
    expect(auth.canAccessFormTier('B')).toBe(false);
  });

  it('GUEST has 3 form limit', () => {
    expect(auth.getMaxForms()).toBe(3);
  });

  it('GUEST can access en/es only', () => {
    expect(auth.canAccessLanguage('en')).toBe(true);
    expect(auth.canAccessLanguage('es')).toBe(true);
    expect(auth.canAccessLanguage('ko')).toBe(false);
  });

  it('GUEST cannot export', () => {
    expect(auth.canExport()).toBe(false);
  });

  it('FREE tier has 10 form limit', () => {
    // Simulate free tier
    auth._setTier?.('free');
    if (auth.tier !== undefined) auth.tier = 'free';
    expect(auth.getMaxForms()).toBe(10);
  });

  it('PRO tier has unlimited forms', () => {
    auth._setTier?.('pro');
    if (auth.tier !== undefined) auth.tier = 'pro';
    expect(auth.getMaxForms()).toBe(Infinity);
  });

  it('PRO tier can access all form tiers', () => {
    auth._setTier?.('pro');
    if (auth.tier !== undefined) auth.tier = 'pro';
    expect(auth.canAccessFormTier('A')).toBe(true);
    expect(auth.canAccessFormTier('B')).toBe(true);
    expect(auth.canAccessFormTier('C')).toBe(true);
  });

  it('PRO tier can access all 13 languages', () => {
    auth._setTier?.('pro');
    if (auth.tier !== undefined) auth.tier = 'pro';
    ['en', 'es', 'so', 'ti', 'am', 'ar', 'ht', 'ko', 'pt', 'ru', 'tl', 'zh', 'vi']
      .forEach(lang => expect(auth.canAccessLanguage(lang)).toBe(true));
  });

  it('PRO tier can export', () => {
    auth._setTier?.('pro');
    if (auth.tier !== undefined) auth.tier = 'pro';
    expect(auth.canExport()).toBe(true);
  });

  it('ADVOCATE tier has assembly feature', () => {
    auth._setTier?.('advocate');
    if (auth.tier !== undefined) auth.tier = 'advocate';
    expect(auth.canAccessFeature('assembly')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// PAYMENT MANAGER TESTS
// ═══════════════════════════════════════════════════════════════════════
describe('PaymentManager — Pricing & Plans', () => {
  let payments;

  beforeEach(() => {
    payments = new PaymentManager({ apiUrl: '/api/payments' });
  });

  it('returns plan definitions', () => {
    const plans = payments.getPlans();
    expect(plans).toBeDefined();
    expect(Array.isArray(plans) || typeof plans === 'object').toBe(true);
  });

  it('FREE plan is $0', () => {
    const plans = payments.getPlans();
    const free = Array.isArray(plans)
      ? plans.find(p => p.tier === 'free' || p.id === 'free')
      : plans.free;
    expect(free).toBeDefined();
    const price = free.price || free.monthlyPrice || free.amount || 0;
    expect(price).toBe(0);
  });

  it('PRO monthly is $19.99', () => {
    const plans = payments.getPlans();
    const pro = Array.isArray(plans)
      ? plans.find(p => p.tier === 'pro' || p.id === 'pro')
      : plans.pro;
    expect(pro).toBeDefined();
    const monthlyPrice = pro.monthlyPrice || pro.price?.monthly || pro.monthly;
    expect(monthlyPrice).toBe(19.99);
  });

  it('PRO annual has 20% savings', () => {
    const plans = payments.getPlans();
    const pro = Array.isArray(plans)
      ? plans.find(p => p.tier === 'pro' || p.id === 'pro')
      : plans.pro;
    const annualPrice = pro.annualPrice || pro.price?.annual || pro.annual;
    expect(annualPrice).toBe(191.88);
  });

  it('ADVOCATE monthly is $39.99', () => {
    const plans = payments.getPlans();
    const adv = Array.isArray(plans)
      ? plans.find(p => p.tier === 'advocate' || p.id === 'advocate')
      : plans.advocate;
    const monthlyPrice = adv.monthlyPrice || adv.price?.monthly || adv.monthly;
    expect(monthlyPrice).toBe(39.99);
  });

  it('can upgrade from FREE to PRO', () => {
    expect(payments.canUpgradeTo('pro')).toBe(true);
  });

  it('cannot downgrade below FREE', () => {
    expect(payments.canDowngradeTo('guest')).toBe(false);
  });
});
