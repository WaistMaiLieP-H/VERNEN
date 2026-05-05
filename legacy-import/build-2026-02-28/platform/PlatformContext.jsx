/**
 * VERNEN™ Platform Context — React Integration Layer
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Wraps PlatformRouter in React context so all components share:
 * - Event bus (pub/sub between modules)
 * - State manager (centralized form data, validation, settings)
 * - Dispatch (action routing through middleware pipeline)
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { createPlatform } from './PlatformIntegrationRouter.js';

// ─── CONTEXT ──────────────────────────────────────────────────
const PlatformContext = createContext(null);

// ─── PROVIDER ─────────────────────────────────────────────────
export function PlatformProvider({ children, config = {} }) {
  const platformRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [state, setState] = useState({});
  const [error, setError] = useState(null);

  // Create platform instance once
  useEffect(() => {
    if (platformRef.current) return;

    const platform = createPlatform({
      debug: config.debug || false,
      rateLimit: config.rateLimit || 20,
    });
    platformRef.current = platform;

    // Subscribe to all state changes to trigger React re-renders
    platform.state.subscribe('*', (newValue, oldValue, path) => {
      setState(platform.state.export());
    });

    // Initialize with config
    platform.initialize({
      language: config.language || 'en',
      county: config.county || null,
      preferences: config.preferences || {},
    })
      .then(() => {
        setState(platform.state.export());
        setReady(true);
        console.log('[PlatformContext] Platform initialized');
      })
      .catch((err) => {
        console.error('[PlatformContext] Init failed:', err);
        setError(err.message);
      });

    return () => {
      platform.destroy();
      platformRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Dispatch wrapper that triggers state sync
  const dispatch = useCallback(async (action) => {
    if (!platformRef.current) {
      console.warn('[PlatformContext] dispatch called before init');
      return null;
    }
    try {
      const result = await platformRef.current.dispatch(action);
      // Force state sync after dispatch
      setState(platformRef.current.state.export());
      return result;
    } catch (err) {
      console.error('[PlatformContext] Dispatch error:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // Direct state getter for non-reactive reads
  const getState = useCallback((path) => {
    return platformRef.current?.state.get(path);
  }, []);

  // Event bus access
  const on = useCallback((event, callback) => {
    return platformRef.current?.bus.on(event, callback);
  }, []);

  const off = useCallback((event, listenerId) => {
    platformRef.current?.bus.off(event, listenerId);
  }, []);

  const emit = useCallback((event, payload) => {
    platformRef.current?.bus.emit(event, payload);
  }, []);

  const value = {
    platform: platformRef.current,
    ready,
    error,
    state,
    dispatch,
    getState,
    on,
    off,
    emit,
  };

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
}

// ─── HOOK ─────────────────────────────────────────────────────
export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) {
    throw new Error('usePlatform must be used inside <PlatformProvider>');
  }
  return ctx;
}

export default PlatformContext;
