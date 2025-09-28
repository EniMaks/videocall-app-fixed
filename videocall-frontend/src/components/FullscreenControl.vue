<template>
  <div class="fullscreen-control">
    <!-- Fullscreen toggle button -->
    <button
      v-if="!isAutoFullscreen"
      :class="[
        'control-button',
        isFullscreen ? 'control-button-active' : 'control-button-inactive'
      ]"
      :title="isFullscreen ? $t('fullscreen.exit') : $t('fullscreen.enter')"
      @click="toggleFullscreen"
    >
      <svg v-if="!isFullscreen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"/>
      </svg>
      <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0 0l5.5 5.5"/>
      </svg>
    </button>

    <!-- Auto fullscreen status indicator (small) -->
    <div 
      v-if="isAutoFullscreen" 
      class="fullscreen-indicator"
      :title="$t('fullscreen.autoMode')"
    >
      <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"/>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Props
const props = defineProps({
  autoMode: {
    type: Boolean,
    default: false
  },
  target: {
    type: [String, Object],
    default: 'body'
  }
})

// Emits
const emit = defineEmits(['fullscreen-change'])

// Reactive state
const isFullscreen = ref(false)
const isAutoFullscreen = ref(props.autoMode)

// Computed
const targetElement = computed(() => {
  if (typeof props.target === 'string') {
    return document.querySelector(props.target)
  }
  return props.target || document.body
})

// Methods
const enterFullscreen = async () => {
  try {
    const element = targetElement.value
    
    if (element.requestFullscreen) {
      await element.requestFullscreen()
    } else if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen()
    } else if (element.mozRequestFullScreen) {
      await element.mozRequestFullScreen()
    } else if (element.msRequestFullscreen) {
      await element.msRequestFullscreen()
    }
    
    isFullscreen.value = true
    emit('fullscreen-change', true)
  } catch (error) {
    console.warn('Failed to enter fullscreen:', error)
  }
}

const exitFullscreen = async () => {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      await document.webkitExitFullscreen()
    } else if (document.mozCancelFullScreen) {
      await document.mozCancelFullScreen()
    } else if (document.msExitFullscreen) {
      await document.msExitFullscreen()
    }
    
    isFullscreen.value = false
    emit('fullscreen-change', false)
  } catch (error) {
    console.warn('Failed to exit fullscreen:', error)
  }
}

const toggleFullscreen = async () => {
  if (isFullscreen.value) {
    await exitFullscreen()
  } else {
    await enterFullscreen()
  }
}

// Auto mode functionality
const enableAutoMode = async () => {
  isAutoFullscreen.value = true
  await enterFullscreen()
}

const disableAutoMode = async () => {
  isAutoFullscreen.value = false
  if (isFullscreen.value) {
    await exitFullscreen()
  }
}

// Fullscreen change listener
const handleFullscreenChange = () => {
  const isCurrentlyFullscreen = !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  )
  
  isFullscreen.value = isCurrentlyFullscreen
  emit('fullscreen-change', isCurrentlyFullscreen)
}

// Expose methods for parent component
defineExpose({
  enterFullscreen,
  exitFullscreen,
  toggleFullscreen,
  enableAutoMode,
  disableAutoMode,
  isFullscreen: computed(() => isFullscreen.value),
  isAutoMode: computed(() => isAutoFullscreen.value)
})

// Lifecycle
onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('mozfullscreenchange', handleFullscreenChange)
  document.addEventListener('MSFullscreenChange', handleFullscreenChange)
  
  // Check initial fullscreen state
  handleFullscreenChange()
  
  // Auto-enable fullscreen if in auto mode
  if (props.autoMode) {
    enableAutoMode()
  }
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
})
</script>

<style scoped>
.fullscreen-control {
  position: relative;
}

.fullscreen-indicator {
  @apply p-2 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center;
}
</style>