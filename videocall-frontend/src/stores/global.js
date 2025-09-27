// src/stores/global.js - Global application state management
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '../services/api'
import { storage } from '../services/storage'
import i18n from '../i18n' // Import i18n instance

export const useGlobalStore = defineStore('global', () => {
  // State
  const isAuthenticated = ref(false)
  const isGuest = ref(false)
  const guestToken = ref(storage.getGuestToken())
  const isLoading = ref(false)
  const loadingMessage = ref('')
  const notifications = ref([])
  const isDarkMode = ref(false)
  const isOnline = ref(navigator.onLine)
  const redirect = ref(null)

  // Computed
  const canUseApp = computed(() => isAuthenticated.value && isOnline.value)

  // Actions
  const clearAuth = () => {
    isAuthenticated.value = false
    isGuest.value = false
    guestToken.value = null
    storage.clearGuestToken()
    apiService.setGuestToken(null)
    // Note: We don't clear the main auth token here as it's handled by http-only cookies
  }

  const setAuthenticated = (value) => {
    if (!value) {
      clearAuth()
    } else {
      isAuthenticated.value = value
    }
  }

  const setLoading = (loading, message = '') => {
    isLoading.value = loading
    loadingMessage.value = message ? i18n.global.t(message) : ''
  }

  const addNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random()
    const notification = { id, message: i18n.global.t(message), type }

    notifications.value.push(notification)

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }

    return id
  }

  const removeNotification = (id) => {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  const setDarkMode = (dark, userTriggered = false) => {
    isDarkMode.value = dark
    
    // Apply theme class to both html and body elements for better coverage
    if (dark) {
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark')
      console.log('[Store] Applied dark theme classes')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
      console.log('[Store] Removed dark theme classes')
    }
    
    // Force a style recalculation
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
    
    // Save to localStorage if user manually triggered the change
    if (userTriggered) {
      storage.setThemePreference({
        isDarkMode: dark,
        userOverride: true,
        lastUpdated: Date.now()
      })
    }
  }

  const setNetworkStatus = (online) => {
    isOnline.value = online
    if (online) {
      addNotification('notifications.connectionRestored', 'success', 3000)
    } else {
      addNotification('notifications.connectionLost', 'error', 0)
    }
  }

  const setRedirect = (path) => {
    redirect.value = path
  }

  const clearRedirect = () => {
    redirect.value = null
  }

  const initializeTheme = () => {
    // Check for saved user preference first
    const savedTheme = storage.getThemePreference()
    
    if (savedTheme && savedTheme.userOverride) {
      // User has manually set a preference, use it
      console.log('[Store] Using saved user theme preference:', savedTheme.isDarkMode)
      setDarkMode(savedTheme.isDarkMode, false)
      return
    }
    
    // No user preference, use system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    console.log('[Store] Using system theme preference:', mediaQuery.matches)
    setDarkMode(mediaQuery.matches, false)
    
    // Listen for system preference changes only if user hasn't overridden
    mediaQuery.addEventListener('change', (e) => {
      const currentSavedTheme = storage.getThemePreference()
      if (!currentSavedTheme || !currentSavedTheme.userOverride) {
        console.log('[Store] System theme changed:', e.matches)
        setDarkMode(e.matches, false)
      }
    })
    
    // Force re-render to ensure theme is applied
    requestAnimationFrame(() => {
      document.documentElement.style.colorScheme = isDarkMode.value ? 'dark' : 'light'
    })
  }

  const toggleTheme = () => {
    const newMode = !isDarkMode.value
    console.log('[Store] User toggled theme to:', newMode)
    setDarkMode(newMode, true)
  }

  const checkAuthentication = async () => {
    console.log('[Store] checkAuthentication: Starting auth check.');
    try {
      setLoading(true, 'loading.checkingAuth')
      // First, check for a guest token in storage
      if (guestToken.value) {
        console.log('[Store] checkAuthentication: Found guest token in storage. Authenticating as guest.');
        await authenticateGuest(guestToken.value)
        if (isAuthenticated.value) {
          console.log('[Store] checkAuthentication: Guest auth from storage successful.');
          return // Guest auth successful
        }
      }
      // If not a guest, check for regular auth
      console.log('[Store] checkAuthentication: No valid guest token. Checking for regular auth session.');
      const response = await apiService.checkAuth()
      setAuthenticated(response.data.authenticated)
      console.log(`[Store] checkAuthentication: Regular auth check returned: ${response.data.authenticated}`);
    } catch (error) {
      console.error('[Store] checkAuthentication: Auth check failed:', error)
      clearAuth()
    } finally {
      setLoading(false)
    }
  }

  const authenticateGuest = async (token) => {
    console.log('[Store] authenticateGuest: Attempting to validate guest token...', token);
    try {
      setLoading(true, 'loading.authenticatingGuest')
      const response = await apiService.validateGuestToken(token)
      
      // If validation is successful
      isAuthenticated.value = true
      isGuest.value = true
      guestToken.value = token
      storage.setGuestToken(token)
      apiService.setGuestToken(token) // Set the token in the api service
      console.log('[Store] authenticateGuest: Token validation successful.');
      addNotification('notifications.guestLoginSuccess', 'success', 3000)
      return { success: true, room: response.data.room }
    } catch (error) {
      console.error('[Store] authenticateGuest: Guest authentication failed:', error)
      clearAuth()
      addNotification('notifications.guestLoginFailed', 'error', 5000)
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      setLoading(true, 'loading.authenticating')
      const response = await apiService.login(username, password)

      if (response.data.success) {
        setAuthenticated(true)
        addNotification('notifications.loginSuccess', 'success', 3000)
        return { success: true }
      } else {
        return { success: false, error: i18n.global.t('notifications.loginFailed') }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || i18n.global.t('notifications.authFailed')
      addNotification(errorMessage, 'error', 5000)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await apiService.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      // Always clear auth on frontend regardless of API result
      clearAuth()
      addNotification('notifications.logoutSuccess', 'info', 3000)
    }
  }

  return {
    // State
    isAuthenticated,
    isGuest,
    guestToken,
    isLoading,
    loadingMessage,
    notifications,
    isDarkMode,
    isOnline,
    redirect,

    // Computed
    canUseApp,

    // Actions
    setAuthenticated,
    setLoading,
    addNotification,
    removeNotification,
    clearNotifications,
    setDarkMode,
    initializeTheme,
    toggleTheme,
    setNetworkStatus,
    setRedirect,
    clearRedirect,
    checkAuthentication,
    authenticateGuest,
    login,
    logout,
  }
})