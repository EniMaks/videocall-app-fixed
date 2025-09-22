// src/stores/webrtc.js - WebRTC and media state management
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useGlobalStore } from './global';
import i18n from '../i18n';
import { settingsService } from '../services/settings';

export const useWebRTCStore = defineStore('webrtc', () => {
  const globalStore = useGlobalStore();

  // State from settings
  const savedSettings = settingsService.getSettings();
  const selectedVideoDeviceId = ref(savedSettings.selectedVideoDeviceId);
  const selectedAudioDeviceId = ref(savedSettings.selectedAudioDeviceId);
  const selectedQuality = ref(savedSettings.selectedQuality);
  const shouldMirror = ref(savedSettings.shouldMirror);

  // Ephemeral state
  const localStream = ref(null);
  const remoteStream = ref(null);
  const peerConnection = ref(null);
  const websocket = ref(null);
  const isConnected = ref(false);
  const isVideoEnabled = ref(true);
  const isAudioEnabled = ref(true);
  const connectionState = ref('new');
  const remoteParticipants = ref([]);
  const localParticipantId = ref(null);

  // Quality presets
  const qualityPresets = {
    '1080p': { width: { ideal: 1920 }, height: { ideal: 1080 } },
    '720p': { width: { ideal: 1280 }, height: { ideal: 720 } },
    '480p': { width: { ideal: 640 }, height: { ideal: 480 } },
    '360p': { width: { ideal: 480 }, height: { ideal: 360 } },
  };

  // Computed
  const hasLocalVideo = computed(() => localStream.value !== null);
  const hasRemoteVideo = computed(() => remoteStream.value !== null);
  const isCallActive = computed(
    () => isConnected.value && (hasLocalVideo.value || hasRemoteVideo.value),
  );

  // WebRTC configuration
  const rtcConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
    iceCandidatePoolSize: 10,
  };

  // Actions
  const selectVideoDevice = (deviceId) => {
    selectedVideoDeviceId.value = deviceId;
    settingsService.set('selectedVideoDeviceId', deviceId);
  };

  const selectAudioDevice = (deviceId) => {
    selectedAudioDeviceId.value = deviceId;
    settingsService.set('selectedAudioDeviceId', deviceId);
  };

  const setVideoQuality = (quality) => {
    selectedQuality.value = quality;
    settingsService.set('selectedQuality', quality);
  };

  const setShouldMirror = (value) => {
    shouldMirror.value = value;
    settingsService.set('shouldMirror', value);
  };

  const initializeLocalMedia = async (force = false) => {
    if (localStream.value && !force) {
      return { success: true };
    }

    try {
      globalStore.setLoading(true, 'loading.accessingMedia');

      const constraints = {
        video: {
          ...(qualityPresets[selectedQuality.value] || qualityPresets['720p']),
          frameRate: { ideal: 30, max: 60 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      if (selectedVideoDeviceId.value) {
        constraints.video.deviceId = { exact: selectedVideoDeviceId.value };
      }
      if (selectedAudioDeviceId.value) {
        constraints.audio.deviceId = { exact: selectedAudioDeviceId.value };
      }

      localStream.value = await navigator.mediaDevices.getUserMedia(constraints);

      const videoTrack = localStream.value.getVideoTracks()[0];
      const audioTrack = localStream.value.getAudioTracks()[0];

      if (videoTrack) isVideoEnabled.value = videoTrack.enabled;
      if (audioTrack) isAudioEnabled.value = audioTrack.enabled;

      return { success: true };
    } catch (error) {
      let errorKey = 'webrtc.mediaAccessFailed';
      if (error.name === 'NotAllowedError') errorKey = 'webrtc.mediaAccessDenied';
      else if (error.name === 'NotFoundError') errorKey = 'webrtc.noMediaDevice';
      else if (error.name === 'NotReadableError') errorKey = 'webrtc.mediaInUse';

      globalStore.addNotification(errorKey, 'error', 8000);
      return { success: false, error: i18n.global.t(errorKey) };
    } finally {
      globalStore.setLoading(false);
    }
  };

  const createPeerConnection = () => {
    try {
      peerConnection.value = new RTCPeerConnection(rtcConfiguration);

      if (localStream.value) {
        localStream.value.getTracks().forEach((track) => {
          peerConnection.value.addTrack(track, localStream.value);
        });
      }

      peerConnection.value.ontrack = (event) => {
        remoteStream.value = event.streams[0];
      };

      peerConnection.value.onicecandidate = (event) => {
        if (event.candidate && websocket.value) {
          sendWebSocketMessage({
            type: 'ice_candidate',
            candidate: event.candidate,
          });
        }
      };

      peerConnection.value.onconnectionstatechange = () => {
        connectionState.value = peerConnection.value.connectionState;
        if (connectionState.value === 'connected') {
          isConnected.value = true;
          globalStore.addNotification('webrtc.callConnected', 'success', 3000);
        } else if (['disconnected', 'failed'].includes(connectionState.value)) {
          isConnected.value = false;
          if (connectionState.value === 'failed') {
            globalStore.addNotification('webrtc.callFailed', 'error', 5000);
          }
        }
      };

      return { success: true };
    } catch (error) {
      console.error('Failed to create peer connection:', error);
      return { success: false, error: error.message };
    }
  };

  const connectWebSocket = (roomId) => {
    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = import.meta.env.VITE_WS_HOST || window.location.host;
        const wsUrl = `${protocol}//${wsHost}/ws/room/${roomId}/`;

        websocket.value = new WebSocket(wsUrl);

        websocket.value.onopen = () => resolve();
        websocket.value.onmessage = (event) => handleWebSocketMessage(JSON.parse(event.data));
        websocket.value.onclose = (event) => {
          isConnected.value = false;
          if (event.code !== 1000) {
            globalStore.addNotification('webrtc.wsConnectionLost', 'error', 5000);
          }
        };
        websocket.value.onerror = (error) => reject(error);

        setTimeout(() => {
          if (websocket.value && websocket.value.readyState !== WebSocket.OPEN) {
            websocket.value.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleWebSocketMessage = async (data) => {
    switch (data.type) {
      case 'user_joined':
        if (!remoteParticipants.value.find((p) => p.id === data.participant_id)) {
          remoteParticipants.value.push({ id: data.participant_id, joined_at: data.timestamp });
        }
        globalStore.addNotification('webrtc.userJoined', 'info', 3000);
        if (peerConnection.value && localStream.value) createOffer();
        break;

      case 'user_left':
        remoteParticipants.value = remoteParticipants.value.filter((p) => p.id !== data.participant_id);
        globalStore.addNotification('webrtc.userLeft', 'info', 3000);
        if (remoteStream.value) remoteStream.value = null;
        break;

      case 'webrtc_offer':
        if (!peerConnection.value) createPeerConnection();
        await peerConnection.value.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.value.createAnswer();
        await peerConnection.value.setLocalDescription(answer);
        sendWebSocketMessage({ type: 'answer', answer: answer, target: data.sender });
        break;

      case 'webrtc_answer':
        await peerConnection.value.setRemoteDescription(new RTCSessionDescription(data.answer));
        break;

      case 'ice_candidate':
        await peerConnection.value.addIceCandidate(new RTCIceCandidate(data.candidate));
        break;

      case 'error':
        globalStore.addNotification(data.message, 'error', 5000);
        break;
    }
  };

  const createOffer = async () => {
    if (!peerConnection.value) createPeerConnection();
    const offer = await peerConnection.value.createOffer();
    await peerConnection.value.setLocalDescription(offer);
    sendWebSocketMessage({ type: 'offer', offer: offer });
  };

  const sendWebSocketMessage = (message) => {
    if (websocket.value && websocket.value.readyState === WebSocket.OPEN) {
      websocket.value.send(JSON.stringify(message));
    }
  };

  const toggleMedia = (type, enabled) => {
    if (localStream.value) {
      const track = type === 'video' ? localStream.value.getVideoTracks()[0] : localStream.value.getAudioTracks()[0];
      if (track) {
        track.enabled = enabled;
        if (type === 'video') isVideoEnabled.value = enabled;
        if (type === 'audio') isAudioEnabled.value = enabled;

        sendWebSocketMessage({
          type: 'media_state',
          state: { video: isVideoEnabled.value, audio: isAudioEnabled.value },
        });

        const status = enabled ? (type === 'video' ? 'cameraOn' : 'micOn') : (type === 'video' ? 'cameraOff' : 'micOff');
        globalStore.addNotification(`webrtc.${status}`, 'info', 2000);
      }
    }
  };

  const toggleVideo = () => toggleMedia('video', !isVideoEnabled.value);
  const toggleAudio = () => toggleMedia('audio', !isAudioEnabled.value);

  const endCall = async () => {
    if (peerConnection.value) peerConnection.value.close();
    if (websocket.value) websocket.value.close(1000, 'Call ended');
    if (localStream.value) localStream.value.getTracks().forEach((track) => track.stop());

    localStream.value = null;
    remoteStream.value = null;
    peerConnection.value = null;
    websocket.value = null;
    isConnected.value = false;
    connectionState.value = 'new';
    remoteParticipants.value = [];
  };

  return {
    // State
    localStream,
    remoteStream,
    peerConnection,
    websocket,
    isConnected,
    isVideoEnabled,
    isAudioEnabled,
    connectionState,
    remoteParticipants,
    localParticipantId,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    selectedQuality,
    shouldMirror,

    // Computed
    hasLocalVideo,
    hasRemoteVideo,
    isCallActive,

    // Actions
    selectVideoDevice,
    selectAudioDevice,
    setVideoQuality,
    setShouldMirror,
    initializeLocalMedia,
    createPeerConnection,
    connectWebSocket,
    createOffer,
    sendWebSocketMessage,
    toggleVideo,
    toggleAudio,
    endCall,
  };
});

