# Перетаскиваемое видео

## Обзор
Документация по функциональности перетаскивания и изменения размера локального видео окна.

## Основные функции

### 1. Перетаскивание (Drag)
Пользователи могут перемещать окно локального видео по экрану для оптимального позиционирования.

### 2. Изменение размера (Resize)
Возможность изменять размер видео окна с сохранением пропорций 4:3.

### 3. Ограничения границ
Умная система предотвращает перекрытие важных UI элементов.

## Техническая реализация

### Reactive состояния
```javascript
const localVideoPosition = ref({ x: 20, y: 20 })
const localVideoSize = ref({ width: 200, height: 150 })
const isDragging = ref(false)
const isResizing = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
```

### Обработчики событий

#### Начало перетаскивания
```javascript
const startDragging = (event) => {
  if (event.target.closest('.resize-handle')) return
  
  isDragging.value = true
  const rect = event.currentTarget.getBoundingClientRect()
  
  dragOffset.value = {
    x: (event.clientX || event.touches[0].clientX) - rect.left,
    y: (event.clientY || event.touches[0].clientY) - rect.top
  }
  
  event.preventDefault()
}
```

#### Процесс перетаскивания
```javascript
const handleDragging = (event) => {
  if (!isDragging.value) return
  
  const clientX = event.clientX || (event.touches && event.touches[0].clientX)
  const clientY = event.clientY || (event.touches && event.touches[0].clientY)
  
  if (!clientX || !clientY) return
  
  // Расчет новой позиции
  let newX = clientX - dragOffset.value.x
  let newY = clientY - dragOffset.value.y
  
  // Применение ограничений границ
  const bounds = calculateBounds()
  newX = Math.max(bounds.minX, Math.min(bounds.maxX, newX))
  newY = Math.max(bounds.minY, Math.min(bounds.maxY, newY))
  
  localVideoPosition.value = { x: newX, y: newY }
  event.preventDefault()
}
```

#### Завершение перетаскивания
```javascript
const stopDragging = () => {
  isDragging.value = false
  isResizing.value = false
}
```

## Система ограничений границ

### Расчет границ
```javascript
const calculateBounds = () => {
  const headerHeight = isFullscreenMode.value ? 60 : 0
  const controlsHeight = 70
  const padding = 10
  
  return {
    minX: padding,
    maxX: window.innerWidth - localVideoSize.value.width - padding,
    minY: headerHeight + padding,
    maxY: window.innerHeight - localVideoSize.value.height - controlsHeight - padding
  }
}
```

### Автоматическая коррекция позиции
```javascript
const constrainPosition = () => {
  const bounds = calculateBounds()
  
  localVideoPosition.value = {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, localVideoPosition.value.x)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, localVideoPosition.value.y))
  }
}
```

## Изменение размера

### Обработчик изменения размера
```javascript
const startResizing = (event) => {
  isResizing.value = true
  event.stopPropagation()
  event.preventDefault()
}

const handleResizing = (event) => {
  if (!isResizing.value) return
  
  const clientX = event.clientX || (event.touches && event.touches[0].clientX)
  const clientY = event.clientY || (event.touches && event.touches[0].clientY)
  
  const rect = event.currentTarget.getBoundingClientRect()
  const newWidth = Math.max(120, clientX - rect.left + 10)
  const newHeight = (newWidth * 3) / 4 // Сохранение пропорций 4:3
  
  localVideoSize.value = { width: newWidth, height: newHeight }
  event.preventDefault()
}
```

### UI элемент для изменения размера
```vue
<div
  class="resize-handle absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-tl-lg cursor-se-resize opacity-70 hover:opacity-100"
  @mousedown="startResizing"
  @touchstart="startResizing"
>
  <div class="w-full h-full flex items-end justify-end p-1">
    <div class="w-0 h-0 border-l-2 border-b-2 border-white"></div>
  </div>
</div>
```

## Touch события

### Поддержка мобильных устройств
```javascript
// Mouse события
@mousedown="startDragging"
@mousemove="handleDragging"
@mouseup="stopDragging"

// Touch события
@touchstart="startDragging"
@touchmove="handleDragging"
@touchend="stopDragging"
```

### Предотвращение конфликтов
```javascript
const startDragging = (event) => {
  // Предотвращение изменения размера при перетаскивании
  if (event.target.closest('.resize-handle')) return
  
  // Предотвращение дефолтного поведения
  event.preventDefault()
}
```

## Стилизация

### CSS для перетаскиваемого элемента
```css
.draggable-video {
  position: fixed;
  z-index: 1000;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  cursor: move;
  transition: box-shadow 0.2s ease;
}

.draggable-video:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.dragging {
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.4);
  transform: scale(1.02);
}
```

### Анимации
```css
.video-transition {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.resize-handle {
  transition: opacity 0.2s ease;
}
```

## Адаптивность

### Различные размеры экрана
```javascript
const getInitialSize = () => {
  const baseWidth = window.innerWidth < 768 ? 160 : 200
  return {
    width: baseWidth,
    height: (baseWidth * 3) / 4
  }
}

const getInitialPosition = () => {
  const padding = window.innerWidth < 768 ? 10 : 20
  return { x: padding, y: padding }
}
```

### Реакция на изменение ориентации
```javascript
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    constrainPosition()
  }, 100)
})

window.addEventListener('resize', () => {
  constrainPosition()
})
```

## Производительность

### Оптимизация перерисовки
```javascript
// Использование transform вместо top/left
const videoStyle = computed(() => ({
  transform: `translate(${localVideoPosition.value.x}px, ${localVideoPosition.value.y}px)`,
  width: `${localVideoSize.value.width}px`,
  height: `${localVideoSize.value.height}px`
}))
```

### Throttling событий
```javascript
import { throttle } from 'lodash'

const throttledDragging = throttle(handleDragging, 16) // ~60fps
const throttledResizing = throttle(handleResizing, 16)
```

## Доступность

### Клавиатурная навигация
```javascript
const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    stopDragging()
  }
  
  // Стрелки для точного позиционирования
  const step = event.shiftKey ? 10 : 1
  switch (event.key) {
    case 'ArrowLeft':
      localVideoPosition.value.x -= step
      break
    case 'ArrowRight':
      localVideoPosition.value.x += step
      break
    case 'ArrowUp':
      localVideoPosition.value.y -= step
      break
    case 'ArrowDown':
      localVideoPosition.value.y += step
      break
  }
  
  constrainPosition()
}
```

### Индикаторы состояния
```vue
<div v-if="isDragging" class="fixed top-4 left-4 bg-blue-500 text-white px-2 py-1 rounded">
  Перемещение видео
</div>

<div v-if="isResizing" class="fixed top-4 left-4 bg-green-500 text-white px-2 py-1 rounded">
  Изменение размера
</div>
```

## Устранение неисправностей

### Проблема: Видео выходит за границы экрана
**Решение:** Проверить работу `constrainPosition()` и `calculateBounds()`

### Проблема: Конфликт с другими элементами
**Решение:** Убедиться в правильности z-index и event.stopPropagation()

### Проблема: Производительность при перетаскивании
**Решение:** Использовать throttling и transform вместо top/left

### Проблема: Не работает на мобильных устройствах
**Решение:** Добавить touch события и event.preventDefault()