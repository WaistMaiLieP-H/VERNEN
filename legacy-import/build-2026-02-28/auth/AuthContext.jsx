/**
 * VERNEN™ Auth Context
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * React context provider for authentication state.
 * Wraps AuthManager and provides hooks for components.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createAuthManager, TIERS, TIER_ACCESS } from './AuthManager.js';

const AuthContext = createContext(null);

// ─── PROVIDER ────────────────────────────────────────────────────────
export function AuthProvider({ children, config = {} }) {
  const authRef = useRef(null);
  const [state, setState] = useState({
    isAuthenticated: false,
    isGuest: true,
    user: null,
    tier: TIERS.GUEST,
    tierAccess: TIER_ACCESS[TIERS.GUEST],
    initialized: false,
    loading: true,
    error: null,
  });

  // Initialize auth manager
  useEffect(() => {
    if (!authRef.current) {
      authRef.current = createAuthManager(config);
    }
    const auth = authRef.current;

    const unsubscribe = auth.subscribe((event, data) => {
      setState((prev) => ({
        ...prev,
        ...auth.getState(),
        loading: false,
        error: event === 'error' ? data?.error : null,
      }));
    });

    auth.initialize()
      .then((s) => setState((prev) => ({ ...prev, ...s, loading: false })))
      .catch((err) => setState((prev) => ({ ...prev, loading: false, error: err.message })));

    return () => {
      unsubscribe();
    };
  }, []);

  // ─── ACTION WRAPPERS ─────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    return authRef.current.login(email, password);
  }, []);

  const register = useCallback(async (email, password, displayName) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    return authRef.current.register(email, password, displayName);
  }, []);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    return authRef.current.logout();
  }, []);

  const requestPasswordReset = useCallback(async (email) => {
    return authRef.current.requestPasswordReset(email);
  }, []);

  const upgradeTier = useCallback(async (targetTier) => {
    return authRef.current.upgradeTier(targetTier);
  }, []);

  const syncSubscription = useCallback(async () => {
    return authRef.current.syncSubscription();
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // ─── ACCESS CONTROL HELPERS ──────────────────────────────────────
  const canAccessFormTier = useCallback((tier) => {
    return authRef.current?.canAccessFormTier(tier) ?? false;
  }, [state.tier]);

  const canAccessFeature = useCallback((feature) => {
    return authRef.current?.canAccessFeature(feature) ?? false;
  }, [state.tier]);

  const canAccessLanguage = useCallback((langCode) => {
    return authRef.current?.canAccessLanguage(langCode) ?? false;
  }, [state.tier]);

  const canExport = useCallback(() => {
    return authRef.current?.canExport() ?? false;
  }, [state.tier]);

  // ─── CONTEXT VALUE ───────────────────────────────────────────────
  const value = {
    // State
    ...state,
    // Actions
    login,
    register,
    logout,
    requestPasswordReset,
    upgradeTier,
    syncSubscription,
    clearError,
    // Access control
    canAccessFormTier,
    canAccessFeature,
    canAccessLanguage,
    canExport,
    // Direct manager access (for advanced use)
    getAuthManager: () => authRef.current,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── HOOKS ───────────────────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAccessControl() {
  const { tier, tierAccess, canAccessFormTier, canAccessFeature, canAccessLanguage, canExport } = useAuth();
  return { tier, tierAccess, canAccessFormTier, canAccessFeature, canAccessLanguage, canExport };
}

export function useSubscription() {
  const { tier, tierAccess, upgradeTier, syncSubscription, isAuthenticated } = useAuth();
  return { tier, tierAccess, upgradeTier, syncSubscription, isAuthenticated };
}

// ─── GATE COMPONENT ──────────────────────────────────────────────────
export function RequireAuth({ children, fallback = null }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : (fallback || <AuthGatePrompt />);
}

export function RequireTier({ tier, children, fallback = null }) {
  const { canAccessFormTier, loading } = useAuth();
  if (loading) return null;
  return canAccessFormTier(tier) ? children : (fallback || <UpgradePrompt requiredTier={tier} />);
}

export function RequireFeature({ feature, children, fallback = null }) {
  const { canAccessFeature, loading } = useAuth();
  if (loading) return null;
  return canAccessFeature(feature) ? children : (fallback || <UpgradePrompt requiredFeature={feature} />);
}

// ─── PLACEHOLDER PROMPTS (to be styled later) ────────────────────────
function AuthGatePrompt() {
  return (
    <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-2">Sign in required</h3>
      <p className="text-slate-600 mb-4">Create a free account to access this feature.</p>
    </div>
  );
}

function UpgradePrompt({ requiredTier, requiredFeature }) {
  return (
    <div className="p-6 text-center bg-amber-50 rounded-xl border border-amber-200">
      <h3 className="text-lg font-semibold text-amber-800 mb-2">Upgrade required</h3>
      <p className="text-amber-700 mb-4">
        {requiredTier
          ? `This content requires ${requiredTier} tier access.`
          : `The ${requiredFeature} feature requires a higher subscription.`}
      </p>
    </div>
  );
}

// ─── RE-EXPORTS ──────────────────────────────────────────────────────
export { TIERS, TIER_ACCESS };
export default AuthContext;
