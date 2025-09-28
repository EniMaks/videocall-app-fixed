<template>
  <header class="relative bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 safe-area-inset-top">
    <div class="max-w-4xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <router-link to="/" class="flex items-center space-x-2 md:space-x-3">
          <div class="w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              ></path>
            </svg>
          </div>
          <h1 class="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Video Call</h1>
        </router-link>
      </div>

      <!-- Desktop Navigation -->
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

      <div class="hidden md:flex items-center space-x-4">
        <button @click="toggleTheme" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
          <svg v-if="!isDarkMode" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"></path>
          </svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v.01M6.31 6.31l.01.01M3 12h.01M6.31 17.69l.01.01M12 21v-.01M17.69 17.69l.01.01M21 12h-.01M17.69 6.31l.01.01M12 18a6 6 0 100-12 6 6 0 000 12z"></path>
          </svg>
        </button>
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

      <!-- Mobile Menu Button -->
      <div class="md:hidden flex items-center">
        <button @click="toggleMobileMenu" class="text-gray-500 dark:text-gray-400 focus:outline-none">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!isMobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Navigation Menu -->
    <div v-if="isMobileMenuOpen" class="md:hidden">
      <nav class="px-2 pt-2 pb-4 space-y-1 sm:px-3">
        <router-link
          v-for="item in navigationItems"
          :key="item.name"
          :to="item.path"
          @click="toggleMobileMenu"
          class="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          active-class="bg-gray-100 dark:bg-gray-700"
        >
          <div class="mr-3">
            <svg v-if="item.icon === 'home'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
            <svg v-if="item.icon === 'info'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <span>{{ item.title }}</span>
        </router-link>
      </nav>
      <div class="border-t border-gray-200 dark:border-gray-700 pt-4 pb-3">
        <div class="px-5 flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button @click="toggleTheme" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
              <svg v-if="!isDarkMode" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"></path>
              </svg>
              <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v.01M6.31 6.31l.01.01M3 12h.01M6.31 17.69l.01.01M12 21v-.01M17.69 17.69l.01.01M21 12h-.01M17.69 6.31l.01.01M12 18a6 6 0 100-12 6 6 0 000 12z"></path>
              </svg>
            </button>
            <LanguageSwitcher />
          </div>
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
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGlobalStore } from '../stores/global'
import { navigationHelpers } from '../router'
import LanguageSwitcher from './LanguageSwitcher.vue'

const router = useRouter()
const globalStore = useGlobalStore()

const isMobileMenuOpen = ref(false)

const isAuthenticated = computed(() => globalStore.isAuthenticated)
const isDarkMode = computed(() => globalStore.isDarkMode)
const navigationItems = computed(() => navigationHelpers.getNavigationItems(isAuthenticated.value))

const handleLogout = async () => {
  await globalStore.logout()
  isMobileMenuOpen.value = false
  router.push('/login')
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const toggleTheme = () => {
  globalStore.toggleTheme()
}
</script>

<style scoped>
.safe-area-inset-top {
  padding-top: env(safe-area-inset-top);
}

/* Mobile optimizations */
@media (max-width: 768px) {
  /* Ensure header is compact on mobile */
  .mobile-compact {
    min-height: 60px;
  }
  
  /* Hide some elements on very small screens */
  @media (max-width: 480px) {
    .hidden-xs {
      display: none;
    }
  }
}
</style>
