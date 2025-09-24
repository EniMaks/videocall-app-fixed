// src/services/settings.js - Settings management using localStorage
import storage from './storage';

const SETTINGS_KEY = 'user_settings';

// Default settings
const defaultSettings = {
  selectedVideoDeviceId: null,
  selectedAudioDeviceId: null,
  selectedQuality: '720p',
  shouldMirror: true,
  userName: null,
};

export const settingsService = {
  /**
   * Get all settings
   */
  getSettings() {
    const settings = storage.get(SETTINGS_KEY, {});
    return { ...defaultSettings, ...settings };
  },

  /**
   * Save all settings
   */
  saveSettings(settings) {
    storage.set(SETTINGS_KEY, settings);
  },

  /**
   * Get a specific setting value
   */
  get(key) {
    const settings = this.getSettings();
    return settings[key];
  },

  /**
   * Set a specific setting value
   */
  set(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    this.saveSettings(settings);
  },
};