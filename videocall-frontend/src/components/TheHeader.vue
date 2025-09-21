<template>
  <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <router-link to="/" class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              ></path>
            </svg>
          </div>
          <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Video Call</h1>
        </router-link>
      </div>
      <nav class="hidden md:flex items-center space-x-4">
        <router-link
          v-for="item in navigationItems"
          :key="item.name"
          :to="item.path"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          active-class="text-green-500 dark:text-green-400"
        >
          {{ item.title }}
        </router-link>
      </nav>
      <div class="flex items-center space-x-4">
        <LanguageSwitcher />
        <button
          v-if="isAuthenticated"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          @click="handleLogout"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGlobalStore } from '../stores/global'
import { navigationHelpers } from '../router'
import LanguageSwitcher from './LanguageSwitcher.vue'

const router = useRouter()
const globalStore = useGlobalStore()

const isAuthenticated = computed(() => globalStore.isAuthenticated)
const navigationItems = computed(() => navigationHelpers.getNavigationItems(isAuthenticated.value))

const handleLogout = async () => {
  await globalStore.logout()
  router.push('/login')
}
</script>
