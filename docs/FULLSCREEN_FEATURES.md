# Полноэкранные функции

## Обзор
Документация по функциям полноэкранного режима в приложении видеозвонков.

## Компонент FullscreenControl

### Описание
Переиспользуемый Vue.js компонент для управления полноэкранным режимом с поддержкой автоматического и ручного режимов.

### Использование
```vue
<FullscreenControl
  :autoEnter="true"
  :showButton="true"
  @fullscreen-change="handleFullscreenChange"
/>
```

### Props
- `autoEnter` (Boolean): Автоматический переход в полноэкранный режим на мобильных устройствах
- `showButton` (Boolean): Показывать кнопку переключения полноэкранного режима

### События
- `fullscreen-change`: Испускается при изменении состояния полноэкранного режима

## API полноэкранного режима

### Основные методы

#### enterFullscreen()
```javascript
const enterFullscreen = async () => {
  const element = document.documentElement
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen()
    } else if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen()
    } else if (element.msRequestFullscreen) {
      await element.msRequestFullscreen()
    }
  } catch (error) {
    console.error('Ошибка входа в полноэкранный режим:', error)
  }
}
```

#### exitFullscreen()
```javascript
const exitFullscreen = async () => {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      await document.webkitExitFullscreen()
    } else if (document.msExitFullscreen) {
      await document.msExitFullscreen()
    }
  } catch (error) {
    console.error('Ошибка выхода из полноэкранного режима:', error)
  }
}
```

#### Проверка состояния
```javascript
const isFullscreen = computed(() => {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
  )
})
```

## Автоматический режим

### Определение мобильных устройств
```javascript
const isMobileDevice = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone']
  
  return mobileKeywords.some(keyword => userAgent.includes(keyword)) ||
         (window.innerWidth <= 768 && 'ontouchstart' in window)
}
```

### Логика автоматического перехода
```
