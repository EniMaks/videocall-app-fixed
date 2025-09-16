
import { createI18n } from 'vue-i18n';

// Функция для ленивой загрузки модулей перевода
function loadLocaleMessages() {
  const locales = import.meta.glob('./locales/*.json', { eager: true });
  const messages = {};
  for (const path in locales) {
    const matched = path.match(/([A-Za-z0-9-_]+)\.json$/i);
    if (matched && matched.length > 1) {
      const locale = matched[1];
      messages[locale] = locales[path].default;
    }
  }
  return messages;
}

// Функция для определения стартового языка
function getStartingLocale(availableLocales) {
  const savedLocale = localStorage.getItem('user-lang');

  // 1. Проверяем сохраненный язык
  if (savedLocale && availableLocales.includes(savedLocale)) {
    return savedLocale;
  }

  // 2. Если нет, проверяем язык браузера
  const browserLocale = (navigator.language || navigator.userLanguage).split('-')[0];
  if (availableLocales.includes(browserLocale)) {
    return browserLocale;
  }

  // 3. В крайнем случае, используем английский
  return 'en';
}

const messages = loadLocaleMessages();
const availableLocales = Object.keys(messages);

const i18n = createI18n({
  legacy: false, // Используем Composition API
  locale: getStartingLocale(availableLocales),
  fallbackLocale: 'en',
  messages: messages,
});

export default i18n;
