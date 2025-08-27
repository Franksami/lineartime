/**
 * Settings Storage Adapter
 * Handles LocalStorage persistence with migration support
 */

import { type UserSettings, createDefaultSettings } from './types';

const STORAGE_KEY = 'lineartime-settings';
const CURRENT_VERSION = 1;

/**
 * Migration functions for handling schema changes
 */
const migrations: Record<number, (settings: any) => any> = {
  // Version 0 to 1: Initial migration from old high contrast toggle
  1: (settings: any) => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      // Check for legacy high contrast setting
      const legacyHighContrast = localStorage.getItem('highContrastMode');
      if (legacyHighContrast && !settings.appearance) {
        settings.appearance = settings.appearance || {};
        settings.appearance.highContrast = legacyHighContrast === 'true';
        // Clean up legacy storage
        localStorage.removeItem('highContrastMode');
      }
    }
    return settings;
  },
};

/**
 * Apply migrations to bring settings up to current version
 */
function migrateSettings(settings: any): UserSettings {
  let currentSettings = settings;
  const startVersion = settings.version || 0;

  // Apply each migration in sequence
  for (let version = startVersion + 1; version <= CURRENT_VERSION; version++) {
    if (migrations[version]) {
      currentSettings = migrations[version](currentSettings);
    }
  }

  // Merge with defaults to ensure all fields exist
  const defaults = createDefaultSettings();
  currentSettings = {
    ...defaults,
    ...currentSettings,
    version: CURRENT_VERSION,
    lastUpdated: new Date().toISOString(),
  };

  // Deep merge nested objects
  Object.keys(defaults).forEach((key) => {
    if (
      typeof defaults[key as keyof UserSettings] === 'object' &&
      defaults[key as keyof UserSettings] !== null &&
      !Array.isArray(defaults[key as keyof UserSettings])
    ) {
      currentSettings[key] = {
        ...defaults[key as keyof UserSettings],
        ...(currentSettings[key] || {}),
      };
    }
  });

  return currentSettings;
}

/**
 * Settings Storage Class
 */
export class SettingsStorage {
  private static instance: SettingsStorage;
  private settings: UserSettings;
  private listeners: Set<(settings: UserSettings) => void> = new Set();

  private constructor() {
    this.settings = this.load();
    this.setupStorageListener();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SettingsStorage {
    if (!SettingsStorage.instance) {
      SettingsStorage.instance = new SettingsStorage();
    }
    return SettingsStorage.instance;
  }

  /**
   * Load settings from localStorage
   */
  private load(): UserSettings {
    if (typeof window === 'undefined') {
      return createDefaultSettings();
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return migrateSettings(parsed);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }

    // Check for legacy settings to migrate
    const defaults = createDefaultSettings();
    const migrated = migrateSettings(defaults);
    this.save(migrated);
    return migrated;
  }

  /**
   * Save settings to localStorage
   */
  private save(settings: UserSettings): void {
    if (typeof window === 'undefined') return;

    try {
      settings.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      this.notifyListeners(settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('LocalStorage quota exceeded. Consider clearing old data.');
      }
    }
  }

  /**
   * Listen for storage changes from other tabs
   */
  private setupStorageListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newSettings = JSON.parse(e.newValue);
          this.settings = migrateSettings(newSettings);
          this.notifyListeners(this.settings);
        } catch (error) {
          console.error('Failed to sync settings from storage:', error);
        }
      }
    });
  }

  /**
   * Notify all listeners of settings changes
   */
  private notifyListeners(settings: UserSettings): void {
    this.listeners.forEach((listener) => listener(settings));
  }

  /**
   * Get current settings
   */
  getSettings(): UserSettings {
    return this.settings;
  }

  /**
   * Update settings (partial update supported)
   */
  updateSettings(updates: Partial<UserSettings>): void {
    this.settings = {
      ...this.settings,
      ...updates,
    };
    this.save(this.settings);
  }

  /**
   * Update nested settings
   */
  updateNestedSettings<K extends keyof UserSettings>(
    category: K,
    updates: Partial<UserSettings[K]>
  ): void {
    this.settings = {
      ...this.settings,
      [category]: {
        ...this.settings[category],
        ...updates,
      },
    };
    this.save(this.settings);
  }

  /**
   * Reset settings to defaults
   */
  resetSettings(): void {
    this.settings = createDefaultSettings();
    this.save(this.settings);
  }

  /**
   * Reset specific category to defaults
   */
  resetCategory<K extends keyof UserSettings>(category: K): void {
    const defaults = createDefaultSettings();
    this.settings = {
      ...this.settings,
      [category]: defaults[category],
    };
    this.save(this.settings);
  }

  /**
   * Subscribe to settings changes
   */
  subscribe(listener: (settings: UserSettings) => void): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Export settings as JSON
   */
  exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * Import settings from JSON
   */
  importSettings(json: string): boolean {
    try {
      const imported = JSON.parse(json);
      const migrated = migrateSettings(imported);
      this.settings = migrated;
      this.save(this.settings);
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }

  /**
   * Check if settings exist in storage
   */
  hasStoredSettings(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  /**
   * Clear all settings from storage
   */
  clearStorage(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    this.settings = createDefaultSettings();
    this.notifyListeners(this.settings);
  }
}

// Export singleton instance
export const settingsStorage = SettingsStorage.getInstance();
