<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4"
  >
    <div class="card w-full max-w-md p-8 animate-fade-in">
      <div class="text-center mb-8">
        <div
          class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            ></path>
          </svg>
        </div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Video Call</h1>
        <p class="text-gray-600 dark:text-gray-300">{{ $t('loginForm.title') }}</p>
      </div>

      <form class="space-y-6" @submit.prevent="handleLogin">
        <div>
          <label
            for="username"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {{ $t('loginForm.usernameLabel') }}
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            :placeholder="$t('loginForm.usernamePlaceholder')"
            class="input-field"
            :disabled="isLoading"
            required
          />
        </div>

        <div>
          <label
            for="password"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {{ $t('loginForm.passwordLabel') }}
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            :placeholder="$t('loginForm.passwordPlaceholder')"
            class="input-field"
            :disabled="isLoading"
            required
          />
        </div>

        <div>
          <button
            type="submit"
            :disabled="!password.trim() || isLoading"
            class="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading" class="flex items-center justify-center">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              {{ $t('loginForm.loggingIn') }}
            </span>
            <span v-else>{{ $t('loginForm.loginButton') }}</span>
          </button>
        </div>
      </form>

      <div class="mt-6 text-center">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ $t('loginForm.footer') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGlobalStore } from '../stores/global'

const router = useRouter()
const globalStore = useGlobalStore()

const username = ref('')
const password = ref('')
const isLoading = ref(false)

const isDarkMode = computed(() => globalStore.isDarkMode)

const handleLogin = async () => {
  if (!username.value.trim() || !password.value.trim()) return

  try {
    isLoading.value = true
    const result = await globalStore.login(username.value, password.value)

    if (result.success) {
      const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/'
      router.push(redirectTo)
    }
  } catch (error) {
    console.error('Login failed:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Ensure dark theme styles are applied properly */
:deep(.card) {
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

:global(.dark) :deep(.card) {
  background-color: rgb(31 41 55) !important; /* gray-800 */
  border-color: rgb(55 65 81) !important; /* gray-700 */
}
</style>
