// src/components/RoomCreatedModal.vue - Room creation success modal
<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="card w-full max-w-lg p-6 animate-slide-up">
      <div class="text-center mb-6">
        <div
          class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">{{ $t('roomCreatedModal.title') }}</h3>
        <p class="text-gray-600 dark:text-gray-300 mt-2">{{ $t('roomCreatedModal.subtitle') }}</p>
      </div>

      <!-- Guest Mode Toggle -->
      <div class="flex items-center justify-center mb-6">
        <label for="guest-toggle" class="mr-3 text-sm font-medium text-gray-900 dark:text-gray-300">{{ $t('roomCreatedModal.forRegularUsers') }}</label>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" id="guest-toggle" class="sr-only peer" v-model="isGuestMode">
          <div class="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
        <span class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">{{ $t('roomCreatedModal.forGuests') }}</span>
      </div>

      <!-- Room Info Display -->
      <div v-if="!isGuestMode">
        <!-- Room Code -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >{{ $t('roomCreatedModal.roomCode') }}</label
          >
          <div class="flex items-center space-x-2">
            <input
              :value="room.short_code"
              readonly
              class="input-field flex-1 font-mono text-lg text-center tracking-wider"
            />
            <button class="btn-secondary px-4 py-3 min-w-[80px]" @click="copyCode">
              {{ codeCopied ? $t('roomCreatedModal.copied') : $t('roomCreatedModal.copy') }}
            </button>
          </div>
        </div>

        <!-- Room Link -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >{{ $t('roomCreatedModal.roomLink') }}</label
          >
          <div class="flex items-center space-x-2">
            <input :value="room.room_url" readonly class="input-field flex-1 text-sm" />
            <button class="btn-secondary px-4 py-3 min-w-[80px]" @click="copyLink">
              {{ linkCopied ? $t('roomCreatedModal.copied') : $t('roomCreatedModal.copy') }}
            </button>
          </div>
        </div>

        <!-- QR Code -->
        <div class="mb-6 text-center">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{{ $t('roomCreatedModal.qrCode') }}</p>
          <div class="inline-block p-4 bg-white rounded-xl shadow-sm">
            <img :src="room.qr_code" alt="QR Code" class="w-32 h-32" />
          </div>
        </div>
      </div>

      <!-- Guest Info Display -->
      <div v-else>
        <div v-if="isLoadingGuestLink" class="text-center p-8">
            <p>{{ $t('roomCreatedModal.generatingLink') }}</p>
        </div>
        <div v-else-if="guestLinkData">
          <!-- Guest Link -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >{{ $t('roomCreatedModal.guestLink') }}</label
            >
            <div class="flex items-center space-x-2">
              <input :value="guestLinkData.guest_url" readonly class="input-field flex-1 text-sm" />
              <button class="btn-secondary px-4 py-3 min-w-[80px]" @click="copyGuestLink">
                {{ guestLinkCopied ? $t('roomCreatedModal.copied') : $t('roomCreatedModal.copy') }}
              </button>
            </div>
          </div>

          <!-- Guest QR Code -->
          <div class="mb-6 text-center">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{{ $t('roomCreatedModal.guestQrCode') }}</p>
            <div class="inline-block p-4 bg-white rounded-xl shadow-sm">
              <img :src="guestLinkData.guest_qr_code" alt="Guest QR Code" class="w-32 h-32" />
            </div>
          </div>
        </div>
         <div v-else class="text-center p-8">
            <p class="text-red-500">{{ $t('roomCreatedModal.generationFailed') }}</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex space-x-3">
        <button class="btn-secondary flex-1" @click="emit('close')">{{ $t('roomCreatedModal.close') }}</button>
        <button class="btn-primary flex-1" @click="joinRoom">{{ $t('roomCreatedModal.joinRoom') }}</button>
      </div>

      <!-- Room Info -->
      <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ $t('roomCreatedModal.expiresIn', { time: formatExpiryTime(room.expires_at) }) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { utils } from '../services/utils'
import { apiService } from '../services/api'

const router = useRouter()
const { t } = useI18n()

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['close'])

// Reactive state
const codeCopied = ref(false)
const linkCopied = ref(false)
const isGuestMode = ref(false)
const guestLinkData = ref(null)
const isLoadingGuestLink = ref(false)
const guestLinkCopied = ref(false)

// Methods
const copyToClipboard = async (text, copiedRef) => {
  const result = await utils.copyToClipboard(text)
  if (result.success) {
    copiedRef.value = true
    setTimeout(() => {
      copiedRef.value = false
    }, 2000)
  }
}

const copyCode = () => copyToClipboard(props.room.short_code, codeCopied)
const copyLink = () => copyToClipboard(props.room.room_url, linkCopied)
const copyGuestLink = () => {
    if(guestLinkData.value) {
        copyToClipboard(guestLinkData.value.guest_url, guestLinkCopied)
    }
}

const joinRoom = () => {
  emit('close')
  router.push(`/call/${props.room.room_id}`)
}

const formatExpiryTime = (expiryDate) => {
  const expiry = new Date(expiryDate)
  const now = new Date()
  const diffHours = Math.ceil((expiry - now) / (1000 * 60 * 60))

  if (diffHours <= 1) {
    return t('roomCreatedModal.lessThanHour')
  } else if (diffHours < 24) {
    return t('roomCreatedModal.hours', diffHours)
  } else {
    const diffDays = Math.ceil(diffHours / 24)
    return t('roomCreatedModal.days', diffDays)
  }
}

const fetchGuestLink = async () => {
    if (!props.room.room_id) return;
    isLoadingGuestLink.value = true;
    guestLinkData.value = null;
    try {
        const response = await apiService.generateGuestLink(props.room.room_id);
        guestLinkData.value = response.data;
    } catch (error) {
        console.error("Failed to generate guest link:", error);
    } finally {
        isLoadingGuestLink.value = false;
    }
}

watch(isGuestMode, (newValue) => {
    if (newValue && !guestLinkData.value) {
        fetchGuestLink();
    }
});

</script>