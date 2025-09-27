// src/services/storage.js - Local and session storage utilities

const GUEST_TOKEN_KEY = 'guest_token'
const THEME_PREFERENCE_KEY = 'theme_preference'

export const storage = {
  /**
   * Safely get item from localStorage
   */
  getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.warn(`Failed to get item from localStorage: ${key}`, error)
      return defaultValue
    }
  },

  /**
   * Safely set item in localStorage
   */
  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.warn(`Failed to set item in localStorage: ${key}`, error)
      return false
    }
  },

  /**
   * Safely remove item from localStorage
   */
  removeItem(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn(`Failed to remove item from localStorage: ${key}`, error)
      return false
    }
  },

  /**
   * Clear all items from localStorage
   */
  clear() {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.warn('Failed to clear localStorage', error)
      return false
    }
  },

  // --- Guest Token Specific --- (uses sessionStorage)

  getGuestToken() {
    try {
      return sessionStorage.getItem(GUEST_TOKEN_KEY)
    } catch (error) {
      console.warn('Failed to get guest token from sessionStorage', error)
      return null
    }
  },

  setGuestToken(token) {
    try {
      sessionStorage.setItem(GUEST_TOKEN_KEY, token)
      return true
    } catch (error) {
      console.warn('Failed to set guest token in sessionStorage', error)
      return false
    }
  },

  clearGuestToken() {
    try {
      sessionStorage.removeItem(GUEST_TOKEN_KEY)
      return true
    } catch (error) {
      console.warn('Failed to clear guest token from sessionStorage', error)
      return false
    }
  },

  // --- Theme Preferences --- (uses localStorage)

  getThemePreference() {
    try {
      const preference = localStorage.getItem(THEME_PREFERENCE_KEY)
      return preference ? JSON.parse(preference) : null
    } catch (error) {
      console.warn('Failed to get theme preference from localStorage', error)
      return null
    }
  },

  setThemePreference(preference) {
    try {
      localStorage.setItem(THEME_PREFERENCE_KEY, JSON.stringify(preference))
      return true
    } catch (error) {
      console.warn('Failed to set theme preference in localStorage', error)
      return false
    }
  },

  clearThemePreference() {
    try {
      localStorage.removeItem(THEME_PREFERENCE_KEY)
      return true
    } catch (error) {
      console.warn('Failed to clear theme preference from localStorage', error)
      return false
    }
  },

  // --- Utility --- 

  /**
   * Get storage usage information
   */
  getStorageInfo() {
    try {
      const used = new Blob(Object.values(localStorage)).size
      return {
        used: used,
        usedFormatted: this.formatBytes(used),
        available: 5 * 1024 * 1024 - used, // Assuming 5MB limit
        availableFormatted: this.formatBytes(5 * 1024 * 1024 - used),
      }
    } catch (error) {
      console.warn('Failed to get storage info', error)
      return null
    }
  },

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },
}
