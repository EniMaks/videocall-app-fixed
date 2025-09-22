<!-- src/components/SettingsPanel.vue - Reusable settings panel -->
<template>
  <div class="card p-4 animate-slide-up">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Settings</h3>

    <!-- Video Devices -->
    <div v-if="videoDevices.length > 0" class="mb-4">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Camera</label>
      <select
        :value="webrtcStore.selectedVideoDeviceId"
        class="input-field"
        @change="switchVideoDevice($event.target.value)"
      >
        <option v-for="device in videoDevices" :key="device.deviceId" :value="device.deviceId">
          {{ device.label || `Camera ${videoDevices.indexOf(device) + 1}` }}
        </option>
      </select>
    </div>

    <!-- Audio Devices -->
    <div v-if="audioDevices.length > 0" class="mb-4">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Microphone</label>
      <select
        :value="webrtcStore.selectedAudioDeviceId"
        class="input-field"
        @change="switchAudioDevice($event.target.value)"
      >
        <option v-for="device in audioDevices" :key="device.deviceId" :value="device.deviceId">
          {{ device.label || `Microphone ${audioDevices.indexOf(device) + 1}` }}
        </option>
      </select>
    </div>

    <!-- Video Quality Settings -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Video Quality</label>
      <select
        :value="webrtcStore.selectedQuality"
        class="input-field"
        @change="changeVideoQuality($event.target.value)"
      >
        <option value="1080p">Full HD (1080p)</option>
        <option value="720p">HD (720p)</option>
        <option value="480p">SD (480p)</option>
        <option value="360p">Low (360p)</option>
      </select>
    </div>

    <!-- Mirror Video -->
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Mirror video</label>
      <button
        :class="[
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
          webrtcStore.shouldMirror ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600',
        ]"
        @click="webrtcStore.setShouldMirror(!webrtcStore.shouldMirror)"
      >
        <span
          :class="[
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            webrtcStore.shouldMirror ? 'translate-x-6' : 'translate-x-1',
          ]"
        ></span>
      </button>
    </div>

    <!-- Close Settings -->
    <div class="mt-4 flex justify-end">
      <button class="btn-secondary px-4 py-2" @click="$emit('close')">Done</button>
    </div>
  </div>
</template>

<script setup>
import { useWebRTCStore } from '../stores/webrtc';
import { useMediaDevices } from '../composables/useMediaDevices';

defineEmits(['close']);

const webrtcStore = useWebRTCStore();
const { videoDevices, audioDevices } = useMediaDevices();

const switchVideoDevice = async (deviceId) => {
  webrtcStore.selectVideoDevice(deviceId);
  await webrtcStore.initializeLocalMedia(true);
};

const switchAudioDevice = async (deviceId) => {
  webrtcStore.selectAudioDevice(deviceId);
  await webrtcStore.initializeLocalMedia(true);
};

const changeVideoQuality = async (quality) => {
  webrtcStore.setVideoQuality(quality);
  if (webrtcStore.localStream) {
    await webrtcStore.initializeLocalMedia(true);
  }
};
</script>
