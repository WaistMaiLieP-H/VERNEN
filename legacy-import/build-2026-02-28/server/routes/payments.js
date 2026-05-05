/**
 * VERNEN™ Payment Routes (Stripe)
 * Handles checkout sessions, customer portal, subscription sync,
 * and webhook processing for subscription lifecycle events.
 */

import { Router } from 'express';
import Stripe from 'stripe';
import { requireAuth, supabase } from './auth.js';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

// ─── PRICE ID MAPPING ────────────────────────────────────────────────
const PRICE_MAP = {
  price_pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
  price_pro_annual: process.env.STRIPE_PRICE_PRO_ANNUAL,
  price_advocate_monthly: process.env.STRIPE_PRICE_ADVOCATE_MONTHLY,
  price_advocate_annual: process.env.STRIPE_PRICE_ADVOCATE_ANNUAL,
};

const PRICE_TO_TIER = {};
// Build reverse map at startup
Object.entries(PRICE_MAP).forEach(([key, priceId]) => {
  if (!priceId) return;
  if (key.includes('pro')) PRICE_TO_TIER[priceId] = 'pro';
  if (key.includes('advocate')) PRICE_TO_TIER[priceId] = 'advocate';
});

// ─── CREATE CHECKOUT SESSION ─────────────────────────────────────────
router.post('/create-checkout', requireAuth, async (req, res) => {
  try {
    const { priceId, tier, billingCycle, successUrl, cancelUrl } = req.body;
    const realPriceId = PRICE_MAP[priceId];
    if (!realPriceId) {
      return res.status(400).json({ message: `Invalid price: ${priceId}` });
    }

    // Get or create Stripe customer
    let customerId;
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', req.user.id)
      .single();

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: { supabase_uid: req.user.id, tier },
      });
      customerId = customer.id;
      await supabase.from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', req.user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: realPriceId, quantity: 1 }],
      success_url: successUrl || `${process.env.APP_URL}/account?checkout=success`,
      cancel_url: cancelUrl || `${process.env.APP_URL}/pricing?checkout=cancelled`,
      subscription_data: {
        metadata: { supabase_uid: req.user.id, tier, billingCycle },
      },
      allow_promotion_codes: true,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── CUSTOMER PORTAL ─────────────────────────────────────────────────
router.post('/create-portal', requireAuth, async (req, res) => {
  try {
    const { returnUrl } = req.body;
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', req.user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return res.status(400).json({ message: 'No billing account found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl || `${process.env.APP_URL}/account`,
    });

    res.json({ url: session.url });
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

    if (!profile) return res.json({ tier: 'free', status: 'none' });

    // If Stripe subscription exists, get live status
    let status = 'active';
    let currentPeriodEnd = profile.subscription_expires;
    let cancelAtPeriodEnd = false;
    let billingCycle = 'monthly';

    if (profile.stripe_subscription_id) {
      try {
        const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
        status = sub.status;
        currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
        cancelAtPeriodEnd = sub.cancel_at_period_end;
        const interval = sub.items?.data?.[0]?.price?.recurring?.interval;
        billingCycle = interval === 'year' ? 'annual' : 'monthly';
      } catch {}
    }

    res.json({
      tier: profile.tier || 'free',
      status,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      billingCycle,
      stripeCustomerId: profile.stripe_customer_id,
      stripeSubscriptionId: profile.stripe_subscription_id,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── STRIPE WEBHOOK HANDLER ──────────────────────────────────────────
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ message: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutComplete(session);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdate(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionCanceled(subscription);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await handlePaymentFailed(invoice);
        break;
      }
      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }
    res.json({ received: true });
  } catch (err) {
    console.error(`Webhook handler error (${event.type}):`, err);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

// ─── WEBHOOK HANDLERS ────────────────────────────────────────────────
async function handleCheckoutComplete(session) {
  const subscriptionId = session.subscription;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price?.id;
  const tier = PRICE_TO_TIER[priceId] || subscription.metadata?.tier || 'pro';
  const uid = subscription.metadata?.supabase_uid;

  if (!uid) {
    // Find by customer ID
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('stripe_customer_id', session.customer)
      .limit(1);
    if (!profiles?.length) return;
    await updateUserTier(profiles[0].id, tier, subscription);
  } else {
    await updateUserTier(uid, tier, subscription);
  }
}

async function handleSubscriptionUpdate(subscription) {
  const priceId = subscription.items.data[0]?.price?.id;
  const tier = PRICE_TO_TIER[priceId] || 'pro';
  const uid = subscription.metadata?.supabase_uid;

  if (uid) {
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      await updateUserTier(uid, tier, subscription);
    } else if (subscription.status === 'past_due') {
      // Keep tier but flag — grace period
      await supabase.from('user_profiles')
        .update({ subscription_status: 'past_due' })
        .eq('id', uid);
    }
  }
}

async function handleSubscriptionCanceled(subscription) {
  const uid = subscription.metadata?.supabase_uid;
  if (!uid) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .limit(1);
    if (profiles?.length) {
      await downgradeUser(profiles[0].id);
    }
    return;
  }
  await downgradeUser(uid);
}

async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .limit(1);

  if (profiles?.length) {
    await supabase.from('user_profiles')
      .update({ subscription_status: 'payment_failed' })
      .eq('id', profiles[0].id);
  }
}

// ─── TIER UPDATE HELPERS ─────────────────────────────────────────────
async function updateUserTier(userId, tier, subscription) {
  await supabase.from('user_profiles').update({
    tier,
    stripe_subscription_id: subscription.id,
    subscription_expires: new Date(subscription.current_period_end * 1000).toISOString(),
    subscription_status: subscription.status,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);
}

async function downgradeUser(userId) {
  await supabase.from('user_profiles').update({
    tier: 'free',
    stripe_subscription_id: null,
    subscription_expires: null,
    subscription_status: 'canceled',
    updated_at: new Date().toISOString(),
  }).eq('id', userId);
}

export { router as paymentsRouter };
