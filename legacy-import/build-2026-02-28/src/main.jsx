/**
 * VERNEN™ Application Entry Point
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider, detectBrowserLanguage } from './i18n/i18n.jsx';
import { ErrorBoundary, installGlobalErrorHandler } from './errors/ErrorBoundary.jsx';
import App from './App.jsx';
import './styles/vernen-tokens.css';

// Install global error handlers
installGlobalErrorHandler();

// Detect initial language
const initialLang = localStorage.getItem('vernen_language') || detectBrowserLanguage();

// Mount
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ErrorBoundary name="VERNEN-Root" maxRetries={3}>
      <I18nProvider initialLanguage={initialLang}>
        <App />
      </I18nProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
