<template>
  <div class="relative">
    <button class="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" @click="isOpen = !isOpen">
      <span>{{ currentLang.flag }}</span>
      <span class="hidden sm:inline">{{ currentLang.name }}</span>
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
    </button>

    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div v-if="isOpen" class="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10">
        <ul>
          <li v-for="lang in supportedLanguages" :key="lang.code">
            <a href="#" class="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" @click.prevent="switchLanguage(lang.code)">
              <span>{{ lang.flag }}</span>
              <span>{{ lang.name }}</span>
            </a>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();
const isOpen = ref(false);

const supportedLanguages = ref([
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
]);

const currentLang = computed(() => {
  return supportedLanguages.value.find(lang => lang.code === locale.value) || supportedLanguages.value[0];
});

function switchLanguage(langCode) {
  locale.value = langCode;
  isOpen.value = false;
  // Optionally, save preference to localStorage
  localStorage.setItem('user-lang', langCode);
}
</script>
