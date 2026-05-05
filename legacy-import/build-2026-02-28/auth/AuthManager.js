/**
 * VERNEN™ Authentication Manager
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Handles user identity, JWT lifecycle, subscription tiers,
 * and access control. Designed for Supabase Auth backend with
 * Stripe subscription integration.
 */

// ─── SUBSCRIPTION TIERS ──────────────────────────────────────────────
export const TIERS = {
  GUEST: 'guest',
  FREE: 'free',
  PRO: 'pro',
  ADVOCATE: 'advocate',
};

const TIER_ACCESS = {
  [TIERS.GUEST]: {
    formTiers: ['A'],
    maxForms: 3,
    features: ['gdn', 'validation'],
    languages: ['en', 'es'],
    sessionPersistence: false,
    exportEnabled: false,
  },
  [TIERS.FREE]: {
    formTiers: ['A'],
    maxForms: 10,
    features: ['gdn', 'validation', 'filing_guide'],
    languages: ['en', 'es', 'zh', 'vi', 'ko', 'tl'],
    sessionPersistence: true,
    exportEnabled: false,
  },
  [TIERS.PRO]: {
    formTiers: ['A', 'B', 'C'],
    maxForms: Infinity,
    features: ['gdn', 'validation', 'filing_guide', 'audit'],
    languages: 'all',
    sessionPersistence: true,
    exportEnabled: true,
  },
  [TIERS.ADVOCATE]: {
    formTiers: ['A', 'B', 'C'],
    maxForms: Infinity,
    features: ['gdn', 'validation', 'filing_guide', 'audit', 'assembly'],
    languages: 'all',
    sessionPersistence: true,
    exportEnabled: true,
  },
};

// ─── TOKEN STORAGE ───────────────────────────────────────────────────
const TOKEN_KEY = 'vernen_auth_token';
const REFRESH_KEY = 'vernen_refresh_token';
const USER_KEY = 'vernen_user';

function getStoredToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
function setStoredToken(token) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch {}
}
function getStoredRefresh() {
  try { return localStorage.getItem(REFRESH_KEY); } catch { return null; }
}
function setStoredRefresh(token) {
  try { localStorage.setItem(REFRESH_KEY, token); } catch {}
}
function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function setStoredUser(user) {
  try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch {}
}
function clearStored() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}

// ─── JWT HELPERS ─────────────────────────────────────────────────────
function decodeJWT(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch { return null; }
}

function isTokenExpired(token) {
  const payload = decodeJWT(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

function tokenExpiresIn(token) {
  const payload = decodeJWT(token);
  if (!payload?.exp) return 0;
  return Math.max(0, payload.exp * 1000 - Date.now());
}

// ─── AUTH MANAGER CLASS ──────────────────────────────────────────────
export class AuthManager {
  constructor(config = {}) {
    this.apiUrl = config.apiUrl || '/api/auth';
    this.supabaseUrl = config.supabaseUrl || null;
    this.supabaseKey = config.supabaseKey || null;
    this.listeners = new Set();
    this.refreshTimer = null;
    this.user = getStoredUser();
    this.token = getStoredToken();
    this.initialized = false;
  }

  // ─── INITIALIZATION ──────────────────────────────────────────────
  async initialize() {
    if (this.initialized) return this.getState();
    if (this.token && !isTokenExpired(this.token)) {
      this._scheduleRefresh();
      this.initialized = true;
      this._notify('initialized', this.getState());
      return this.getState();
    }
    // Try refresh token
    const refreshToken = getStoredRefresh();
    if (refreshToken) {
      try {
        await this.refreshSession();
        this.initialized = true;
        this._notify('initialized', this.getState());
        return this.getState();
      } catch {
        clearStored();
        this.user = null;
        this.token = null;
      }
    }
    // Fall through to guest
    this.initialized = true;
    this._notify('initialized', this.getState());
    return this.getState();
  }

  // ─── REGISTRATION ────────────────────────────────────────────────
  async register(email, password, displayName = '') {
    try {
      const res = await fetch(`${this.apiUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Registration failed (${res.status})`);
      }
      const data = await res.json();
      this._setSession(data);
      this._notify('registered', this.getState());
      return this.getState();
    } catch (err) {
      this._notify('error', { action: 'register', error: err.message });
      throw err;
    }
  }

  // ─── LOGIN ───────────────────────────────────────────────────────
  async login(email, password) {
    try {
      const res = await fetch(`${this.apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Login failed (${res.status})`);
      }
      const data = await res.json();
      this._setSession(data);
      this._notify('logged_in', this.getState());
      return this.getState();
    } catch (err) {
      this._notify('error', { action: 'login', error: err.message });
      throw err;
    }
  }

  // ─── LOGOUT ──────────────────────────────────────────────────────
  async logout() {
    try {
      if (this.token) {
        await fetch(`${this.apiUrl}/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.token}` },
        }).catch(() => {});
      }
    } finally {
      this._clearSession();
      this._notify('logged_out', this.getState());
    }
  }

  // ─── TOKEN REFRESH ───────────────────────────────────────────────
  async refreshSession() {
    const refreshToken = getStoredRefresh();
    if (!refreshToken) throw new Error('No refresh token available');
    const res = await fetch(`${this.apiUrl}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      this._clearSession();
      throw new Error('Session refresh failed');
    }
    const data = await res.json();
    this._setSession(data);
    this._notify('token_refreshed', this.getState());
    return this.getState();
  }

  // ─── PASSWORD RESET ──────────────────────────────────────────────
  async requestPasswordReset(email) {
    const res = await fetch(`${this.apiUrl}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error('Password reset request failed');
    return true;
  }

  // ─── ACCESS CONTROL ──────────────────────────────────────────────
  getTier() {
    return this.user?.tier || TIERS.GUEST;
  }

  getTierAccess() {
    return TIER_ACCESS[this.getTier()] || TIER_ACCESS[TIERS.GUEST];
  }

  canAccessFormTier(tier) {
    return this.getTierAccess().formTiers.includes(tier);
  }

  canAccessFeature(feature) {
    return this.getTierAccess().features.includes(feature);
  }

  canAccessLanguage(langCode) {
    const access = this.getTierAccess();
    return access.languages === 'all' || access.languages.includes(langCode);
  }

  canExport() {
    return this.getTierAccess().exportEnabled;
  }

  getMaxForms() {
    return this.getTierAccess().maxForms;
  }

  isAuthenticated() {
    return !!this.token && !isTokenExpired(this.token);
  }

  isGuest() {
    return this.getTier() === TIERS.GUEST;
  }

  // ─── SUBSCRIPTION UPGRADE (Stripe integration point) ─────────────
  async upgradeTier(targetTier) {
    if (!this.isAuthenticated()) {
      throw new Error('Must be logged in to upgrade');
    }
    // This will be replaced with Stripe Checkout redirect
    const res = await fetch(`${this.apiUrl}/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ tier: targetTier }),
    });
    if (!res.ok) throw new Error('Checkout creation failed');
    const { checkoutUrl } = await res.json();
    return checkoutUrl;
  }

  async syncSubscription() {
    if (!this.isAuthenticated()) return;
    const res = await fetch(`${this.apiUrl}/subscription`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (res.ok) {
      const { tier, expiresAt } = await res.json();
      this.user = { ...this.user, tier, subscriptionExpires: expiresAt };
      setStoredUser(this.user);
      this._notify('subscription_synced', this.getState());
    }
  }

  // ─── STATE ───────────────────────────────────────────────────────
  getState() {
    return {
      isAuthenticated: this.isAuthenticated(),
      isGuest: this.isGuest(),
      user: this.user ? { ...this.user } : null,
      tier: this.getTier(),
      tierAccess: this.getTierAccess(),
      initialized: this.initialized,
    };
  }

  getAuthHeaders() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  // ─── LISTENERS ───────────────────────────────────────────────────
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  _notify(event, data) {
    this.listeners.forEach((fn) => {
      try { fn(event, data); } catch (e) { console.error('Auth listener error:', e); }
    });
  }

  // ─── INTERNAL SESSION MANAGEMENT ─────────────────────────────────
  _setSession(data) {
    this.token = data.access_token || data.token;
    this.user = {
      id: data.user?.id || data.userId,
      email: data.user?.email || data.email,
      displayName: data.user?.displayName || data.displayName || '',
      tier: data.user?.tier || data.tier || TIERS.FREE,
      createdAt: data.user?.createdAt || null,
      subscriptionExpires: data.user?.subscriptionExpires || null,
      preferredLanguage: data.user?.preferredLanguage || 'en',
    };
    setStoredToken(this.token);
    setStoredUser(this.user);
    if (data.refresh_token || data.refreshToken) {
      setStoredRefresh(data.refresh_token || data.refreshToken);
    }
    this._scheduleRefresh();
  }

  _clearSession() {
    this.token = null;
    this.user = null;
    clearStored();
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  _scheduleRefresh() {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    if (!this.token) return;
    const expiresIn = tokenExpiresIn(this.token);
    // Refresh 2 minutes before expiry, minimum 10 seconds
    const refreshIn = Math.max(10000, expiresIn - 120000);
    this.refreshTimer = setTimeout(() => {
      this.refreshSession().catch((err) => {
        console.warn('Auto-refresh failed:', err.message);
        this._notify('refresh_failed', { error: err.message });
      });
    }, refreshIn);
  }

  // ─── CLEANUP ─────────────────────────────────────────────────────
  destroy() {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.listeners.clear();
  }
}

// ─── FACTORY ─────────────────────────────────────────────────────────
let _instance = null;

export function createAuthManager(config = {}) {
  if (_instance) return _instance;
  _instance = new AuthManager(config);
  return _instance;
}

export function getAuthManager() {
  return _instance;
}

// ─── CONVENIENCE EXPORTS ─────────────────────────────────────────────
export { TIER_ACCESS };

export default {
  AuthManager,
  createAuthManager,
  getAuthManager,
  TIERS,
  TIER_ACCESS,
};
