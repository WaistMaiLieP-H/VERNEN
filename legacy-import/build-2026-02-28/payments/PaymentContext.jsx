/**
 * VERNEN™ Payment Context & Pricing View
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * React context for payment state + pricing page component.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createPaymentManager, PLAN_CONFIG } from './PaymentManager.js';
import { useAuth, TIERS } from '../auth/AuthContext.jsx';

const PaymentContext = createContext(null);

// ─── PROVIDER ────────────────────────────────────────────────────────
export function PaymentProvider({ children, config = {} }) {
  const payRef = useRef(null);
  const { isAuthenticated, tier } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!payRef.current) {
      payRef.current = createPaymentManager(config);
    }
  }, []);

  // Load subscription on auth change
  useEffect(() => {
    if (isAuthenticated && payRef.current) {
      setLoading(true);
      payRef.current.getSubscription()
        .then((sub) => setSubscription(sub))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  // Handle checkout return
  useEffect(() => {
    if (isAuthenticated && payRef.current) {
      payRef.current.handleCheckoutSuccess().catch(() => {});
    }
  }, [isAuthenticated]);

  const checkout = useCallback(async (targetTier, billingCycle = 'monthly') => {
    setLoading(true);
    setError(null);
    try {
      return await payRef.current.createCheckout(targetTier, billingCycle);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const openPortal = useCallback(async () => {
    try {
      await payRef.current.openCustomerPortal();
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (!payRef.current) return;
    const sub = await payRef.current.getSubscription();
    setSubscription(sub);
  }, []);

  const value = {
    subscription,
    loading,
    error,
    plans: payRef.current?.getPlans() || [],
    checkout,
    openPortal,
    refreshSubscription,
    canUpgradeTo: (t) => payRef.current?.canUpgradeTo(t) ?? false,
    canDowngradeTo: (t) => payRef.current?.canDowngradeTo(t) ?? false,
    clearError: () => setError(null),
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayments() {
  const ctx = useContext(PaymentContext);
  if (!ctx) throw new Error('usePayments must be used within PaymentProvider');
  return ctx;
}

// ─── PRICING PAGE COMPONENT ──────────────────────────────────────────
export function PricingPage() {
  const { isAuthenticated, tier } = useAuth();
  const { checkout, loading, error, canUpgradeTo } = usePayments();
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = [
    { tier: TIERS.FREE, ...PLAN_CONFIG[TIERS.FREE] },
    { tier: TIERS.PRO, ...PLAN_CONFIG[TIERS.PRO], popular: true },
    { tier: TIERS.ADVOCATE, ...PLAN_CONFIG[TIERS.ADVOCATE] },
  ];

  const handleSelect = async (targetTier) => {
    if (targetTier === TIERS.FREE) return;
    if (!isAuthenticated) {
      // Redirect to login/register with return URL
      window.location.href = `/login?redirect=/pricing&tier=${targetTier}`;
      return;
    }
    try {
      await checkout(targetTier, billingCycle);
    } catch {}
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          VERNEN™ Plans
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Legal document guidance in 13 languages. Choose the plan that fits your needs.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>
          Monthly
        </span>
        <button
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            billingCycle === 'annual' ? 'bg-blue-600' : 'bg-slate-300'
          }`}
          aria-label="Toggle billing cycle"
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            billingCycle === 'annual' ? 'translate-x-6' : ''
          }`} />
        </button>
        <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-slate-900' : 'text-slate-400'}`}>
          Annual
        </span>
        {billingCycle === 'annual' && (
          <span className="ml-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            Save 20%
          </span>
        )}
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
          {error}
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const price = billingCycle === 'annual'
            ? (plan.priceAnnual / 12).toFixed(2)
            : plan.priceMonthly.toFixed(2);
          const isCurrent = tier === plan.tier;
          const canUpgrade = canUpgradeTo(plan.tier);

          return (
            <div
              key={plan.tier}
              className={`relative rounded-xl border-2 p-6 transition-shadow ${
                plan.popular
                  ? 'border-blue-500 shadow-lg shadow-blue-100'
                  : 'border-slate-200 hover:shadow-md'
              } ${isCurrent ? 'ring-2 ring-emerald-400 ring-offset-2' : ''}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Current
                </span>
              )}

              <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
              <div className="mb-4">
                {plan.priceMonthly === 0 ? (
                  <span className="text-3xl font-bold text-slate-900">Free</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-slate-900">${price}</span>
                    <span className="text-slate-500 text-sm">/month</span>
                    {billingCycle === 'annual' && (
                      <div className="text-xs text-slate-400 mt-1">
                        Billed ${plan.priceAnnual.toFixed(2)}/year
                      </div>
                    )}
                  </>
                )}
              </div>

              <ul className="space-y-2 mb-6">
                {(plan.features || []).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelect(plan.tier)}
                disabled={isCurrent || loading || (!canUpgrade && plan.tier !== TIERS.FREE)}
                className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors ${
                  isCurrent
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                } ${loading ? 'opacity-50' : ''}`}
              >
                {isCurrent ? 'Current Plan'
                  : plan.tier === TIERS.FREE ? 'Get Started'
                  : canUpgrade ? `Upgrade to ${plan.name}`
                  : 'Contact Support'}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-400 mt-8">
        All plans include 256-bit encryption and UETA-compliant document handling.
        Cancel anytime from your account settings.
      </p>
    </div>
  );
}

export default PaymentContext;
