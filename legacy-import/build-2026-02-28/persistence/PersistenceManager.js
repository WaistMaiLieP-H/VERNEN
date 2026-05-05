/**
 * VERNEN™ Persistence Manager
 * © 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
 * VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
 *
 * Handles all client-side data persistence with encryption for PII fields,
 * auto-save, snapshot management, and import/export capabilities.
 */

// ─── PII ENCRYPTION ────────────────────────────────────────────────
const PII_FIELDS = new Set([
  'petitioner_name', 'respondent_name', 'child_name', 'child_dob',
  'ssn', 'date_of_birth', 'address', 'phone', 'email',
  'employer_name', 'income', 'bank_account', 'case_number',
  'attorney_bar_number', 'driver_license'
]);

class SimpleEncryption {
  constructor(passphrase = 'vernen-local-default') {
    this.passphrase = passphrase;
  }

  async deriveKey(salt) {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      return null; // Fallback: no encryption in non-secure contexts
    }
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(this.passphrase), 'PBKDF2', false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(plaintext) {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      return btoa(unescape(encodeURIComponent(plaintext))); // Base64 fallback
    }
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(salt);
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, key, enc.encode(plaintext)
    );
    const combined = new Uint8Array(salt.length + iv.length + new Uint8Array(ciphertext).length);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
    return btoa(String.fromCharCode(...combined));
  }

  async decrypt(encoded) {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      return decodeURIComponent(escape(atob(encoded))); // Base64 fallback
    }
    const combined = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28);
    const key = await this.deriveKey(salt);
    const dec = new TextDecoder();
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv }, key, ciphertext
    );
    return dec.decode(plaintext);
  }
}

// ─── STORAGE ADAPTER ───────────────────────────────────────────────
class StorageAdapter {
  constructor(storageType = 'local') {
    this.storage = storageType === 'session' ? sessionStorage : localStorage;
    this.prefix = 'vernen_';
  }

  _key(key) { return `${this.prefix}${key}`; }

  get(key) {
    try {
      const raw = this.storage.getItem(this._key(key));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  set(key, value) {
    try {
      this.storage.setItem(this._key(key), JSON.stringify(value));
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('[VERNEN] Storage quota exceeded — attempting cleanup');
        this._evictOldest();
        try {
          this.storage.setItem(this._key(key), JSON.stringify(value));
          return true;
        } catch { return false; }
      }
      return false;
    }
  }

  remove(key) { this.storage.removeItem(this._key(key)); }

  keys() {
    const result = [];
    for (let i = 0; i < this.storage.length; i++) {
      const k = this.storage.key(i);
      if (k.startsWith(this.prefix)) result.push(k.slice(this.prefix.length));
    }
    return result;
  }

  clear() {
    this.keys().forEach(k => this.remove(k));
  }

  _evictOldest() {
    const snapshots = this.keys()
      .filter(k => k.startsWith('snapshot_'))
      .map(k => ({ key: k, ts: this.get(k)?.timestamp || 0 }))
      .sort((a, b) => a.ts - b.ts);
    if (snapshots.length > 3) {
      snapshots.slice(0, snapshots.length - 3).forEach(s => this.remove(s.key));
    }
  }

  getUsage() {
    let total = 0;
    this.keys().forEach(k => {
      const raw = this.storage.getItem(this._key(k));
      if (raw) total += raw.length * 2; // UTF-16
    });
    return { bytes: total, kb: (total / 1024).toFixed(2), keys: this.keys().length };
  }
}

// ─── PERSISTENCE MANAGER ───────────────────────────────────────────
class PersistenceManager {
  constructor(config = {}) {
    this.config = {
      storageType: config.storageType || 'local',
      encryptPII: config.encryptPII !== false,
      autoSaveInterval: config.autoSaveInterval || 30000, // 30s
      maxSnapshots: config.maxSnapshots || 10,
      snapshotInterval: config.snapshotInterval || 300000, // 5 min
      ...config
    };

    this.storage = new StorageAdapter(this.config.storageType);
    this.encryption = new SimpleEncryption(config.passphrase);
    this.autoSaveTimer = null;
    this.snapshotTimer = null;
    this.dirty = false;
    this.currentSession = null;
    this.listeners = [];
  }

  // ── Session Management ──────────────────────────────────────────
  startSession(sessionId = null) {
    this.currentSession = sessionId || `session_${Date.now()}`;
    const existing = this.storage.get(`session_${this.currentSession}`);
    if (existing) {
      this._notify('session_resumed', { sessionId: this.currentSession });
      return existing;
    }
    const session = {
      id: this.currentSession,
      created: Date.now(),
      lastModified: Date.now(),
      formData: {},
      validationState: {},
      navigationHistory: [],
      preferences: {}
    };
    this.storage.set(`session_${this.currentSession}`, session);
    this._startAutoSave();
    this._startSnapshotTimer();
    this._notify('session_started', { sessionId: this.currentSession });
    return session;
  }

  endSession() {
    this._stopAutoSave();
    this._stopSnapshotTimer();
    this.saveNow();
    this._notify('session_ended', { sessionId: this.currentSession });
    this.currentSession = null;
  }

  // ── Form Data ───────────────────────────────────────────────────
  async saveFormData(formId, fieldData) {
    const session = this._getSession();
    if (!session) return false;

    const processed = {};
    for (const [key, value] of Object.entries(fieldData)) {
      if (this.config.encryptPII && PII_FIELDS.has(key) && value) {
        processed[key] = { __encrypted: true, value: await this.encryption.encrypt(String(value)) };
      } else {
        processed[key] = value;
      }
    }

    session.formData[formId] = {
      ...session.formData[formId],
      ...processed,
      __lastModified: Date.now()
    };
    session.lastModified = Date.now();
    this.dirty = true;
    this._notify('form_saved', { formId, fieldCount: Object.keys(fieldData).length });
    return true;
  }

  async loadFormData(formId) {
    const session = this._getSession();
    if (!session || !session.formData[formId]) return null;

    const raw = session.formData[formId];
    const decrypted = {};
    for (const [key, value] of Object.entries(raw)) {
      if (key === '__lastModified') continue;
      if (value && value.__encrypted) {
        try {
          decrypted[key] = await this.encryption.decrypt(value.value);
        } catch {
          decrypted[key] = '[decryption_failed]';
        }
      } else {
        decrypted[key] = value;
      }
    }
    return decrypted;
  }

  clearFormData(formId) {
    const session = this._getSession();
    if (!session) return;
    delete session.formData[formId];
    session.lastModified = Date.now();
    this.dirty = true;
    this._notify('form_cleared', { formId });
  }

  // ── Validation State ────────────────────────────────────────────
  saveValidationState(formId, validationResult) {
    const session = this._getSession();
    if (!session) return;
    session.validationState[formId] = {
      ...validationResult,
      timestamp: Date.now()
    };
    this.dirty = true;
  }

  getValidationState(formId) {
    const session = this._getSession();
    return session?.validationState?.[formId] || null;
  }

  // ── Navigation History ──────────────────────────────────────────
  pushNavigation(entry) {
    const session = this._getSession();
    if (!session) return;
    session.navigationHistory.push({ ...entry, timestamp: Date.now() });
    if (session.navigationHistory.length > 100) {
      session.navigationHistory = session.navigationHistory.slice(-50);
    }
    this.dirty = true;
  }

  getNavigationHistory() {
    const session = this._getSession();
    return session?.navigationHistory || [];
  }

  // ── Preferences ─────────────────────────────────────────────────
  savePreference(key, value) {
    this.storage.set(`pref_${key}`, { value, updated: Date.now() });
    this._notify('preference_saved', { key });
  }

  getPreference(key, defaultValue = null) {
    const pref = this.storage.get(`pref_${key}`);
    return pref ? pref.value : defaultValue;
  }

  // ── Snapshots ───────────────────────────────────────────────────
  createSnapshot(label = null) {
    const session = this._getSession();
    if (!session) return null;

    const snapshotId = `snap_${Date.now()}`;
    const snapshot = {
      id: snapshotId,
      label: label || `Auto-snapshot ${new Date().toLocaleString()}`,
      timestamp: Date.now(),
      sessionId: this.currentSession,
      data: JSON.parse(JSON.stringify(session))
    };
    this.storage.set(`snapshot_${snapshotId}`, snapshot);
    this._pruneSnapshots();
    this._notify('snapshot_created', { snapshotId, label: snapshot.label });
    return snapshotId;
  }

  listSnapshots() {
    return this.storage.keys()
      .filter(k => k.startsWith('snapshot_'))
      .map(k => {
        const snap = this.storage.get(k);
        return snap ? {
          id: snap.id, label: snap.label,
          timestamp: snap.timestamp, sessionId: snap.sessionId
        } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  restoreSnapshot(snapshotId) {
    const snapshot = this.storage.get(`snapshot_${snapshotId}`);
    if (!snapshot) return false;
    this.storage.set(`session_${this.currentSession}`, snapshot.data);
    this._notify('snapshot_restored', { snapshotId });
    return true;
  }

  deleteSnapshot(snapshotId) {
    this.storage.remove(`snapshot_${snapshotId}`);
  }

  _pruneSnapshots() {
    const snapshots = this.listSnapshots();
    if (snapshots.length > this.config.maxSnapshots) {
      snapshots.slice(this.config.maxSnapshots).forEach(s => this.deleteSnapshot(s.id));
    }
  }

  // ── Auto-Save ───────────────────────────────────────────────────
  _startAutoSave() {
    this._stopAutoSave();
    this.autoSaveTimer = setInterval(() => {
      if (this.dirty) this.saveNow();
    }, this.config.autoSaveInterval);
  }

  _stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  _startSnapshotTimer() {
    this._stopSnapshotTimer();
    this.snapshotTimer = setInterval(() => {
      if (this.dirty) this.createSnapshot();
    }, this.config.snapshotInterval);
  }

  _stopSnapshotTimer() {
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
      this.snapshotTimer = null;
    }
  }

  saveNow() {
    const session = this._getSession();
    if (!session) return;
    session.lastModified = Date.now();
    this.storage.set(`session_${this.currentSession}`, session);
    this.dirty = false;
    this._notify('auto_saved', { sessionId: this.currentSession });
  }

  // ── Import / Export ─────────────────────────────────────────────
  async exportAll() {
    const allData = {};
    for (const key of this.storage.keys()) {
      allData[key] = this.storage.get(key);
    }
    return {
      version: '1.0.0',
      platform: 'VERNEN',
      exportedAt: new Date().toISOString(),
      dataKeys: Object.keys(allData).length,
      data: allData
    };
  }

  async importAll(exportedData) {
    if (!exportedData?.platform === 'VERNEN') {
      throw new Error('Invalid VERNEN export file');
    }
    for (const [key, value] of Object.entries(exportedData.data)) {
      this.storage.set(key, value);
    }
    this._notify('data_imported', { keys: Object.keys(exportedData.data).length });
    return true;
  }

  // ── Utilities ───────────────────────────────────────────────────
  _getSession() {
    if (!this.currentSession) return null;
    return this.storage.get(`session_${this.currentSession}`);
  }

  _notify(event, data) {
    this.listeners.forEach(fn => {
      try { fn({ event, ...data, timestamp: Date.now() }); } catch {}
    });
  }

  onEvent(listener) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  getStorageUsage() { return this.storage.getUsage(); }

  clearAll() {
    this._stopAutoSave();
    this._stopSnapshotTimer();
    this.storage.clear();
    this.currentSession = null;
    this._notify('all_cleared', {});
  }
}

// ─── FACTORY ───────────────────────────────────────────────────────
function createPersistenceManager(config = {}) {
  return new PersistenceManager(config);
}

export { PersistenceManager, createPersistenceManager, PII_FIELDS, StorageAdapter, SimpleEncryption };
export default createPersistenceManager;
