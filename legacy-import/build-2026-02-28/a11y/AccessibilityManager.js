/**
 * VERNEN™ Accessibility Manager
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * WCAG 2.1 AA compliance layer providing screen reader announcements,
 * focus management, keyboard navigation, high contrast mode, skip links,
 * and reduced motion support for the entire VERNEN platform.
 */

// ─── ARIA LIVE REGION MANAGER ──────────────────────────────────────
class LiveRegionManager {
  constructor() {
    this.regions = {};
    this._initialized = false;
  }

  init() {
    if (this._initialized || typeof document === 'undefined') return;
    ['polite', 'assertive'].forEach(priority => {
      const el = document.createElement('div');
      el.id = `vernen-live-${priority}`;
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', priority);
      el.setAttribute('aria-atomic', 'true');
      Object.assign(el.style, {
        position: 'absolute', width: '1px', height: '1px',
        padding: '0', margin: '-1px', overflow: 'hidden',
        clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: '0'
      });
      document.body.appendChild(el);
      this.regions[priority] = el;
    });
    this._initialized = true;
  }

  announce(message, priority = 'polite') {
    if (!this._initialized) this.init();
    const region = this.regions[priority];
    if (!region) return;
    // Clear then set to trigger screen reader re-announcement
    region.textContent = '';
    requestAnimationFrame(() => { region.textContent = message; });
  }

  announceError(message) { this.announce(message, 'assertive'); }
  announceStatus(message) { this.announce(message, 'polite'); }

  destroy() {
    Object.values(this.regions).forEach(el => el.remove());
    this.regions = {};
    this._initialized = false;
  }
}

// ─── FOCUS MANAGER ─────────────────────────────────────────────────
class FocusManager {
  constructor() {
    this.focusStack = [];
    this.trapActive = false;
    this._trapHandler = null;
  }

  static FOCUSABLE_SELECTOR = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])',
    'select:not([disabled])', 'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])', '[contenteditable="true"]',
    'details > summary', 'audio[controls]', 'video[controls]'
  ].join(', ');

  getFocusableElements(container) {
    if (!container) return [];
    return Array.from(container.querySelectorAll(FocusManager.FOCUSABLE_SELECTOR))
      .filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden'
          && !el.hasAttribute('aria-hidden');
      });
  }

  pushFocus(element) {
    if (typeof document === 'undefined') return;
    this.focusStack.push(document.activeElement);
    if (element) {
      requestAnimationFrame(() => element.focus());
    }
  }

  popFocus() {
    const previous = this.focusStack.pop();
    if (previous && typeof previous.focus === 'function') {
      requestAnimationFrame(() => previous.focus());
    }
  }

  trapFocus(container) {
    if (!container || typeof document === 'undefined') return;
    this.pushFocus();
    this.trapActive = true;

    const focusables = this.getFocusableElements(container);
    if (focusables.length === 0) return;

    focusables[0].focus();

    this._trapHandler = (e) => {
      if (e.key !== 'Tab') return;
      const current = this.getFocusableElements(container);
      if (current.length === 0) return;

      const first = current[0];
      const last = current[current.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', this._trapHandler);
  }

  releaseTrap() {
    if (this._trapHandler) {
      document.removeEventListener('keydown', this._trapHandler);
      this._trapHandler = null;
    }
    this.trapActive = false;
    this.popFocus();
  }

  moveFocusToId(id) {
    const el = document.getElementById(id);
    if (el) {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      el.focus();
    }
  }

  moveFocusToFirst(container) {
    const focusables = this.getFocusableElements(container);
    if (focusables.length > 0) focusables[0].focus();
  }
}

// ─── KEYBOARD NAVIGATION ──────────────────────────────────────────
class KeyboardNavigator {
  constructor() {
    this.shortcuts = new Map();
    this._handler = null;
    this._active = false;
  }

  registerShortcut(key, callback, description = '') {
    this.shortcuts.set(key.toLowerCase(), { callback, description });
  }

  unregisterShortcut(key) {
    this.shortcuts.delete(key.toLowerCase());
  }

  activate() {
    if (this._active || typeof document === 'undefined') return;
    this._handler = (e) => {
      const parts = [];
      if (e.ctrlKey || e.metaKey) parts.push('ctrl');
      if (e.altKey) parts.push('alt');
      if (e.shiftKey) parts.push('shift');
      parts.push(e.key.toLowerCase());
      const combo = parts.join('+');

      const shortcut = this.shortcuts.get(combo);
      if (shortcut) {
        e.preventDefault();
        e.stopPropagation();
        shortcut.callback(e);
      }
    };
    document.addEventListener('keydown', this._handler);
    this._active = true;
  }

  deactivate() {
    if (this._handler) {
      document.removeEventListener('keydown', this._handler);
      this._handler = null;
    }
    this._active = false;
  }

  getShortcutList() {
    const list = [];
    this.shortcuts.forEach((val, key) => {
      list.push({ key, description: val.description });
    });
    return list;
  }
}

// ─── SKIP LINKS ────────────────────────────────────────────────────
class SkipLinksManager {
  constructor() {
    this.links = [];
    this._container = null;
  }

  init(links = []) {
    if (typeof document === 'undefined') return;
    this.links = links.length ? links : [
      { target: 'main-content', label: 'Skip to main content' },
      { target: 'form-section', label: 'Skip to form' },
      { target: 'navigation', label: 'Skip to navigation' },
      { target: 'results-section', label: 'Skip to results' }
    ];

    this._container = document.createElement('nav');
    this._container.id = 'vernen-skip-links';
    this._container.setAttribute('aria-label', 'Skip navigation');
    Object.assign(this._container.style, {
      position: 'absolute', top: '0', left: '0', zIndex: '10000',
      padding: '4px', background: '#1a3a5c'
    });

    this.links.forEach(link => {
      const a = document.createElement('a');
      a.href = `#${link.target}`;
      a.textContent = link.label;
      Object.assign(a.style, {
        position: 'absolute', left: '-9999px', top: 'auto',
        width: '1px', height: '1px', overflow: 'hidden',
        color: '#fff', background: '#1a3a5c', padding: '8px 16px',
        textDecoration: 'none', fontWeight: '600', fontSize: '14px',
        borderRadius: '0 0 4px 4px', zIndex: '10001'
      });
      a.addEventListener('focus', () => {
        Object.assign(a.style, {
          position: 'static', width: 'auto', height: 'auto', overflow: 'visible'
        });
      });
      a.addEventListener('blur', () => {
        Object.assign(a.style, {
          position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden'
        });
      });
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(link.target);
        if (target) {
          if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
          target.focus();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
      this._container.appendChild(a);
    });

    document.body.insertBefore(this._container, document.body.firstChild);
  }

  destroy() {
    if (this._container) this._container.remove();
  }
}

// ─── HIGH CONTRAST / VISUAL PREFERENCES ───────────────────────────
class VisualPreferences {
  constructor() {
    this._styleEl = null;
    this.preferences = {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      focusIndicators: true
    };
  }

  init() {
    if (typeof window === 'undefined') return;
    // Detect system preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.preferences.reducedMotion = true;
    }
    if (window.matchMedia('(prefers-contrast: more)').matches) {
      this.preferences.highContrast = true;
    }
    // Load saved preferences
    try {
      const saved = localStorage.getItem('vernen_a11y_prefs');
      if (saved) Object.assign(this.preferences, JSON.parse(saved));
    } catch {}
    this._applyStyles();
  }

  toggle(preference) {
    if (preference in this.preferences) {
      this.preferences[preference] = !this.preferences[preference];
      this._save();
      this._applyStyles();
    }
  }

  set(preference, value) {
    if (preference in this.preferences) {
      this.preferences[preference] = value;
      this._save();
      this._applyStyles();
    }
  }

  _save() {
    try { localStorage.setItem('vernen_a11y_prefs', JSON.stringify(this.preferences)); } catch {}
  }

  _applyStyles() {
    if (typeof document === 'undefined') return;
    if (this._styleEl) this._styleEl.remove();

    let css = '';

    if (this.preferences.highContrast) {
      css += `
        body { background: #000 !important; color: #fff !important; }
        a, a:visited { color: #ffff00 !important; }
        button, input, select, textarea { border: 2px solid #fff !important; background: #000 !important; color: #fff !important; }
        .badge, .badge-critical, .badge-high, .badge-medium, .badge-low {
          border: 2px solid currentColor !important;
        }
        table, th, td { border-color: #fff !important; }
        th { background: #333 !important; color: #fff !important; }
      `;
    }

    if (this.preferences.largeText) {
      css += `
        body { font-size: 16pt !important; }
        h1 { font-size: 28pt !important; }
        h2 { font-size: 22pt !important; }
        h3 { font-size: 18pt !important; }
        button, input, select { font-size: 16pt !important; padding: 12px !important; }
      `;
    }

    if (this.preferences.reducedMotion) {
      css += `
        *, *::before, *::after {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
        }
      `;
    }

    if (this.preferences.focusIndicators) {
      css += `
        *:focus-visible {
          outline: 3px solid #2563eb !important;
          outline-offset: 2px !important;
        }
        ${this.preferences.highContrast ? '*:focus-visible { outline-color: #ffff00 !important; }' : ''}
      `;
    }

    if (css) {
      this._styleEl = document.createElement('style');
      this._styleEl.id = 'vernen-a11y-styles';
      this._styleEl.textContent = css;
      document.head.appendChild(this._styleEl);
    }

    // Set data attributes for component-level adaptation
    document.documentElement.setAttribute('data-a11y-contrast', this.preferences.highContrast);
    document.documentElement.setAttribute('data-a11y-motion', this.preferences.reducedMotion);
    document.documentElement.setAttribute('data-a11y-large', this.preferences.largeText);
  }

  destroy() {
    if (this._styleEl) this._styleEl.remove();
  }
}

// ─── ACCESSIBILITY MANAGER (UNIFIED) ──────────────────────────────
class AccessibilityManager {
  constructor(config = {}) {
    this.config = config;
    this.liveRegion = new LiveRegionManager();
    this.focus = new FocusManager();
    this.keyboard = new KeyboardNavigator();
    this.skipLinks = new SkipLinksManager();
    this.visual = new VisualPreferences();
    this._initialized = false;
  }

  init() {
    if (this._initialized || typeof document === 'undefined') return;
    this.liveRegion.init();
    this.visual.init();
    this.skipLinks.init(this.config.skipLinks);
    this._registerDefaultShortcuts();
    this.keyboard.activate();
    document.documentElement.setAttribute('lang', this.config.language || 'en');
    this._initialized = true;
  }

  _registerDefaultShortcuts() {
    this.keyboard.registerShortcut('alt+1', () => this.focus.moveFocusToId('main-content'), 'Go to main content');
    this.keyboard.registerShortcut('alt+2', () => this.focus.moveFocusToId('form-section'), 'Go to form');
    this.keyboard.registerShortcut('alt+3', () => this.focus.moveFocusToId('results-section'), 'Go to results');
    this.keyboard.registerShortcut('alt+h', () => this.visual.toggle('highContrast'), 'Toggle high contrast');
    this.keyboard.registerShortcut('alt+t', () => this.visual.toggle('largeText'), 'Toggle large text');
    this.keyboard.registerShortcut('alt+m', () => this.visual.toggle('reducedMotion'), 'Toggle reduced motion');
    this.keyboard.registerShortcut('escape', () => {
      if (this.focus.trapActive) this.focus.releaseTrap();
    }, 'Close modal / release focus trap');
  }

  // ── Convenience API ─────────────────────────────────────────────
  announce(msg, priority) { this.liveRegion.announce(msg, priority); }
  announceError(msg) { this.liveRegion.announceError(msg); }
  announceStatus(msg) { this.liveRegion.announceStatus(msg); }
  trapFocus(container) { this.focus.trapFocus(container); }
  releaseTrap() { this.focus.releaseTrap(); }
  setLanguage(lang) { document.documentElement.setAttribute('lang', lang); }

  getPreferences() { return { ...this.visual.preferences }; }
  setPreference(key, value) { this.visual.set(key, value); }

  getShortcuts() { return this.keyboard.getShortcutList(); }
  registerShortcut(key, cb, desc) { this.keyboard.registerShortcut(key, cb, desc); }

  // ── Form Accessibility Helpers ──────────────────────────────────
  setFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    const errorId = `${fieldId}-error`;
    let errorEl = document.getElementById(errorId);
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.id = errorId;
      errorEl.setAttribute('role', 'alert');
      errorEl.style.color = '#dc2626';
      errorEl.style.fontSize = '0.875rem';
      errorEl.style.marginTop = '4px';
      field.parentNode.insertBefore(errorEl, field.nextSibling);
    }
    errorEl.textContent = message;
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', errorId);
  }

  clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (errorEl) errorEl.remove();
  }

  setFormProgress(current, total, label) {
    this.announceStatus(`${label || 'Progress'}: step ${current} of ${total}`);
  }

  destroy() {
    this.liveRegion.destroy();
    this.keyboard.deactivate();
    this.skipLinks.destroy();
    this.visual.destroy();
    this._initialized = false;
  }
}

// ─── FACTORY ───────────────────────────────────────────────────────
function createAccessibilityManager(config = {}) {
  return new AccessibilityManager(config);
}

export {
  AccessibilityManager, createAccessibilityManager,
  LiveRegionManager, FocusManager, KeyboardNavigator,
  SkipLinksManager, VisualPreferences
};
export default createAccessibilityManager;
