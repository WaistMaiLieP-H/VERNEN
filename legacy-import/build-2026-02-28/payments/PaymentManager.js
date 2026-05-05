/**
 * VERNEN™ Payment Manager (Stripe Integration)
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Client-side Stripe integration for subscription management.
 * Handles checkout sessions, portal access, webhook event
 * processing, and tier synchronization with AuthManager.
 *
 * Architecture:
 *   Client (this) → Backend API → Stripe API
 *   Stripe webhooks → Backend → tier updates → AuthManager sync
 *
 * Required backend endpoints:
 *   POST /api/payments/create-checkout   → Stripe Checkout Session
 *   POST /api/payments/create-portal     → Stripe Customer Portal
 *   GET  /api/payments/subscription      → Current subscription status
 *   POST /api/payments/webhook           → Stripe webhook handler
 */

import { getAuthManager, TIERS } from '../auth/AuthManager.js';

// ─── STRIPE PRICE CONFIGURATION ──────────────────────────────────────
// These map to Stripe Price IDs (set in env/backend config)
export const PLAN_CONFIG = {
  [TIERS.FREE]: {
    name: 'Free',
    priceMonthly: 0,
    priceAnnual: 0,
    stripePriceMonthly: null,
    stripePriceAnnual: null,
  },
  [TIERS.PRO]: {
    name: 'Pro',
    priceMonthly: 19.99,
    priceAnnual: 191.88,
    stripePriceMonthly: 'price_pro_monthly',
    stripePriceAnnual: 'price_pro_annual',
    features: [
      'All form tiers (A, B, C)',
      'All 13 languages',
      'Filing guides with county rules',
      'Compliance audit reports',
      'Document export (PDF, DOCX)',
    ],
  },
  [TIERS.ADVOCATE]: {
    name: 'Advocate',
    priceMonthly: 39.99,
    priceAnnual: 383.88,
    stripePriceMonthly: 'price_advocate_monthly',
    stripePriceAnnual: 'price_advocate_annual',
    features: [
      'Everything in Pro',
      'Document assembly engine',
      'Cross-form data propagation',
      'Filing package generation',
      'Priority support',
    ],
  },
};

// ─── PAYMENT MANAGER ─────────────────────────────────────────────────
export class PaymentManager {
  constructor(config = {}) {
    this.apiUrl = config.apiUrl || '/api/payments';
    this.stripePublicKey = config.stripePublicKey || null;
    this.stripe = null;
    this.listeners = new Set();
    this.subscription = null;
  }

  // ─── STRIPE.JS LOADER ────────────────────────────────────────────
  async _ensureStripe() {
    if (this.stripe) return this.stripe;
    if (!this.stripePublicKey) {
      throw new Error('Stripe public key not configured');
    }
    // Load Stripe.js from CDN if not already present
    if (!window.Stripe) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Stripe.js'));
        document.head.appendChild(script);
      });
    }
    this.stripe = window.Stripe(this.stripePublicKey);
    return this.stripe;
  }

  // ─── CHECKOUT ────────────────────────────────────────────────────
  async createCheckout(tier, billingCycle = 'monthly') {
    const auth = getAuthManager();
    if (!auth?.isAuthenticated()) {
      throw new Error('Must be logged in to subscribe');
    }

    const plan = PLAN_CONFIG[tier];
    if (!plan) throw new Error(`Invalid tier: ${tier}`);

    const priceId = billingCycle === 'annual'
      ? plan.stripePriceAnnual
      : plan.stripePriceMonthly;

    if (!priceId) throw new Error(`No ${billingCycle} price for ${tier}`);

    const res = await fetch(`${this.apiUrl}/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth.getAuthHeaders(),
      },
      body: JSON.stringify({
        priceId,
        tier,
        billingCycle,
        successUrl: `${window.location.origin}/account?checkout=success`,
        cancelUrl: `${window.location.origin}/pricing?checkout=cancelled`,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Checkout creation failed');
    }

    const { sessionId, url } = await res.json();

    // Redirect to Stripe Checkout
    if (url) {
      window.location.href = url;
      return { redirected: true };
    }

    // Fallback: use Stripe.js redirect
    const stripe = await this._ensureStripe();
    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) throw new Error(error.message);
    return { redirected: true };
  }

  // ─── CUSTOMER PORTAL ─────────────────────────────────────────────
  async openCustomerPortal() {
    const auth = getAuthManager();
    if (!auth?.isAuthenticated()) {
      throw new Error('Must be logged in');
    }

    const res = await fetch(`${this.apiUrl}/create-portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth.getAuthHeaders(),
      },
      body: JSON.stringify({
        returnUrl: `${window.location.origin}/account`,
      }),
    });

    if (!res.ok) throw new Error('Portal session creation failed');
    const { url } = await res.json();
    window.location.href = url;
  }

  // ─── SUBSCRIPTION STATUS ─────────────────────────────────────────
  async getSubscription() {
    const auth = getAuthManager();
    if (!auth?.isAuthenticated()) return null;

    try {
      const res = await fetch(`${this.apiUrl}/subscription`, {
        headers: auth.getAuthHeaders(),
      });
      if (!res.ok) return null;
      const data = await res.json();
      this.subscription = {
        tier: data.tier || TIERS.FREE,
        status: data.status,          // active, past_due, canceled, trialing
        currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
        billingCycle: data.billingCycle || 'monthly',
        stripeCustomerId: data.stripeCustomerId || null,
        stripeSubscriptionId: data.stripeSubscriptionId || null,
      };

      // Sync tier with AuthManager
      await auth.syncSubscription();
      this._notify('subscription_loaded', this.subscription);
      return this.subscription;
    } catch (err) {
      console.error('Subscription fetch failed:', err);
      return null;
    }
  }

  // ─── CHECKOUT SUCCESS HANDLER ────────────────────────────────────
  async handleCheckoutSuccess() {
    // Called when user returns from Stripe Checkout with success URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') !== 'success') return false;

    // Poll for subscription update (webhook may take a moment)
    let attempts = 0;
    const maxAttempts = 10;
    while (attempts < maxAttempts) {
      const sub = await this.getSubscription();
      if (sub && sub.status === 'active') {
        this._notify('checkout_success', sub);
        // Clean URL
        const url = new URL(window.location);
        url.searchParams.delete('checkout');
        window.history.replaceState({}, '', url.toString());
        return true;
      }
      attempts++;
      await new Promise((r) => setTimeout(r, 2000));
    }
    this._notify('checkout_pending', { message: 'Subscription activation in progress' });
    return false;
  }

  // ─── PLAN COMPARISON ─────────────────────────────────────────────
  getPlans() {
    return Object.entries(PLAN_CONFIG).map(([tier, config]) => ({
      tier,
      ...config,
      isCurrent: this.subscription?.tier === tier || (!this.subscription && tier === TIERS.FREE),
      savingsPercent: config.priceMonthly > 0
        ? Math.round((1 - config.priceAnnual / (config.priceMonthly * 12)) * 100)
        : 0,
    }));
  }

  canUpgradeTo(tier) {
    const tierOrder = [TIERS.FREE, TIERS.PRO, TIERS.ADVOCATE];
    const currentIdx = tierOrder.indexOf(this.subscription?.tier || TIERS.FREE);
    const targetIdx = tierOrder.indexOf(tier);
    return targetIdx > currentIdx;
  }

  canDowngradeTo(tier) {
    const tierOrder = [TIERS.FREE, TIERS.PRO, TIERS.ADVOCATE];
    const currentIdx = tierOrder.indexOf(this.subscription?.tier || TIERS.FREE);
    const targetIdx = tierOrder.indexOf(tier);
    return targetIdx < currentIdx && targetIdx >= 0;
  }

  // ─── LISTENERS ───────────────────────────────────────────────────
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  _notify(event, data) {
    this.listeners.forEach((fn) => {
      try { fn(event, data); } catch (e) { console.error('Payment listener error:', e); }
    });
  }

  // ─── CLEANUP ─────────────────────────────────────────────────────
  destroy() {
    this.listeners.clear();
    this.subscription = null;
  }
}

// ─── FACTORY ─────────────────────────────────────────────────────────
let _instance = null;

export function createPaymentManager(config = {}) {
  if (_instance) return _instance;
  _instance = new PaymentManager(config);
  return _instance;
}

export function getPaymentManager() {
  return _instance;
}

export default {
  PaymentManager,
  createPaymentManager,
  getPaymentManager,
  PLAN_CONFIG,
};
