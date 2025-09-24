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

  // Computed
  const canUseApp = computed(() => isAuthenticated.value && isOnline.value)

  // Actions
  const clearAuth = () => {
    isAuthenticated.value = false
    isGuest.value = false
    guestToken.value = null
    storage.clearGuestToken()
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

  const setDarkMode = (dark) => {
    isDarkMode.value = dark
    document.documentElement.classList.toggle('dark', dark)
  }

  const setNetworkStatus = (online) => {
    isOnline.value = online
    if (online) {
      addNotification('notifications.connectionRestored', 'success', 3000)
    } else {
      addNotification('notifications.connectionLost', 'error', 0)
    }
  }

  const checkAuthentication = async () => {
    try {
      setLoading(true, 'loading.checkingAuth')
      // First, check for a guest token in storage
      if (guestToken.value) {
        await authenticateGuest(guestToken.value)
        if (isAuthenticated.value) {
          return // Guest auth successful
        }
      }
      // If not a guest, check for regular auth
      const response = await apiService.checkAuth()
      setAuthenticated(response.data.authenticated)
    } catch (error) {
      console.error('Auth check failed:', error)
      clearAuth()
    } finally {
      setLoading(false)
    }
  }

  const authenticateGuest = async (token) => {
    try {
      setLoading(true, 'loading.authenticatingGuest')
      await apiService.validateGuestToken(token)
      
      // If validation is successful
      isAuthenticated.value = true
      isGuest.value = true
      guestToken.value = token
      storage.setGuestToken(token)
      addNotification('notifications.guestLoginSuccess', 'success', 3000)
      return true
    } catch (error) {
      console.error('Guest authentication failed:', error)
      clearAuth()
      addNotification('notifications.guestLoginFailed', 'error', 5000)
      return false
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

    // Computed
    canUseApp,

    // Actions
    setAuthenticated,
    setLoading,
    addNotification,
    removeNotification,
    clearNotifications,
    setDarkMode,
    setNetworkStatus,
    checkAuthentication,
    authenticateGuest,
    login,
    logout,
  }
})
