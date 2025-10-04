// src/stores/webrtc.js - WebRTC and media state management (Refactored for Multi-Peer)
import { defineStore } from 'pinia';
import { ref, computed, reactive } from 'vue';
import { useGlobalStore } from './global';
import i18n from '../i18n';
import { settingsService } from '../services/settings';
import { webrtcService } from '../services/webrtc';

export const useWebRTCStore = defineStore('webrtc', () => {
  const globalStore = useGlobalStore();

  // --- State ---
  const savedSettings = settingsService.getSettings();
  const localStream = ref(null);
  const isVideoEnabled = ref(true);
  const isAudioEnabled = ref(true);
  const shouldMirror = ref(savedSettings.shouldMirror);
  const selectedQuality = ref(savedSettings.selectedQuality);
  const selectedVideoDeviceId = ref(savedSettings.selectedVideoDeviceId);
  const selectedAudioDeviceId = ref(savedSettings.selectedAudioDeviceId);

  // Multi-peer state
  const peerConnections = reactive({});
  const remoteStreams = reactive({});
  const connectionStates = reactive({});
  
  const websocket = ref(null);
  const roomId = ref(null);

  // Quality presets
  const qualityPresets = {
    '1080p': { width: { ideal: 1920 }, height: { ideal: 1080 } },
    '720p': { width: { ideal: 1280 }, height: { ideal: 720 } },
    '480p': { width: { ideal: 640 }, height: { ideal: 480 } },
    '360p': { width: { ideal: 480 }, height: { ideal: 360 } },
  };

  // --- Computed Properties ---
  const isConnected = computed(() => Object.values(connectionStates).some(s => s === 'connected'));
  const hasLocalVideo = computed(() => localStream.value !== null);
  const mainRemoteStream = computed(() => {
    const firstParticipantId = Object.keys(remoteStreams)[0];
    return firstParticipantId ? remoteStreams[firstParticipantId] : null;
  });
  const hasRemoteVideo = computed(() => mainRemoteStream.value !== null);


  // --- Private Helper Functions ---
  const sendWebSocketMessage = (message) => {
    if (websocket.value && websocket.value.readyState === WebSocket.OPEN) {
      console.log('%c[WS SEND]', 'color: #f43f5e', message.type, message);
      websocket.value.send(JSON.stringify(message));
    }
  };

  const _createPeerConnection = (participantId) => {
    if (peerConnections[participantId]) {
      console.warn(`[WebRTC] Peer connection for ${participantId} already exists.`);
      return peerConnections[participantId];
    }

    console.log(`%c[WebRTC] Creating new peer connection for participant: ${participantId}`, 'color: #22c55e');
    const config = webrtcService.getIceServerConfig();
    console.log('[WebRTC] Using ICE Server Config:', config);
    const pc = new RTCPeerConnection(config);

    if (localStream.value) {
      localStream.value.getTracks().forEach(track => {
        pc.addTrack(track, localStream.value);
      });
      console.log('[WebRTC] Added local stream tracks.');
    }

    pc.ontrack = (event) => {
      console.log(`%c[WebRTC] Received remote track from ${participantId}`, 'color: #3b82f6');
      remoteStreams[participantId] = event.streams[0];
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendWebSocketMessage({
          type: 'ice_candidate',
          candidate: event.candidate,
          target: participantId,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      connectionStates[participantId] = state;
      console.log(`%c[WebRTC] Connection state for ${participantId} changed to: ${state}`, 'color: #eab308');
      if (state === 'failed') {
         console.error(`[WebRTC] ICE connection failed for participant ${participantId}.`);
      }
    };
    
    peerConnections[participantId] = pc;
    return pc;
  };

  const _closePeerConnection = (participantId) => {
    if (peerConnections[participantId]) {
      peerConnections[participantId].close();
      delete peerConnections[participantId];
      delete remoteStreams[participantId];
      delete connectionStates[participantId];
      console.log(`%c[WebRTC] Closed peer connection for participant: ${participantId}`, 'color: #ef4444');
    }
  };


  // --- WebSocket Message Handlers ---
  const handleWebSocketMessage = async (data) => {
    const { type, sender } = data;
    console.log('%c[WS RECV]', 'color: #8b5cf6', type, data);

    switch (type) {
      case 'user_joined':
        console.log(`[Signal] User ${data.participant_id} joined. Creating offer...`);
        const pc = _createPeerConnection(data.participant_id);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendWebSocketMessage({ type: 'offer', offer, target: data.participant_id });
        break;

      case 'user_left':
        console.log(`[Signal] User ${data.participant_id} left.`);
        _closePeerConnection(data.participant_id);
        break;

      case 'webrtc_offer':
        console.log(`[Signal] Received offer from ${sender}. Creating answer...`);
        const offerPc = _createPeerConnection(sender);
        await offerPc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await offerPc.createAnswer();
        await offerPc.setLocalDescription(answer);
        sendWebSocketMessage({ type: 'answer', answer, target: sender });
        break;

      case 'webrtc_answer':
        console.log(`[Signal] Received answer from ${sender}.`);
        const answerPc = peerConnections[sender];
        if (answerPc) {
          await answerPc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } else {
          console.error(`[Signal] Received answer from unknown peer: ${sender}`);
        }
        break;

      case 'ice_candidate':
        const candidatePc = peerConnections[sender];
        if (candidatePc) {
          try {
            await candidatePc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) {
            console.error('[WebRTC] Error adding received ICE candidate', e);
          }
        } else {
          console.error(`[Signal] Received ICE candidate from unknown peer: ${sender}`);
        }
        break;

      case 'error':
        globalStore.addNotification(data.message, 'error', 5000);
        break;
    }
  };


  // --- Public Actions ---
  const initializeLocalMedia = async (force = false) => {
    if (localStream.value && !force) return { success: true };
    try {
      const constraints = {
        video: { ...(qualityPresets[selectedQuality.value] || {}), frameRate: { ideal: 30 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      };
      if (selectedVideoDeviceId.value) constraints.video.deviceId = { exact: selectedVideoDeviceId.value };
      if (selectedAudioDeviceId.value) constraints.audio.deviceId = { exact: selectedAudioDeviceId.value };
      
      localStream.value = await navigator.mediaDevices.getUserMedia(constraints);
      isVideoEnabled.value = localStream.value.getVideoTracks()[0]?.enabled ?? false;
      isAudioEnabled.value = localStream.value.getAudioTracks()[0]?.enabled ?? false;
      return { success: true };
    } catch (error) {
      console.error("Failed to get user media", error);
      globalStore.addNotification(i18n.global.t('webrtc.mediaAccessFailed'), 'error');
      return { success: false, error };
    }
  };

  const connectWebSocket = (currentRoomId) => {
    roomId.value = currentRoomId;
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsHost = import.meta.env.VITE_WS_BASE_URL || window.location.host;
      const wsUrl = `${protocol}://${wsHost}/ws/room/${roomId.value}/`;
      console.log(`%c[WS] Connecting to ${wsUrl}`, 'color: #0ea5e9');

      websocket.value = new WebSocket(wsUrl);
      websocket.value.onopen = () => {
        console.log('%c[WS] Connection established.', 'color: #22c55e');
        resolve();
      };
      websocket.value.onmessage = (event) => handleWebSocketMessage(JSON.parse(event.data));
      websocket.value.onclose = (event) => {
        console.log(`%c[WS] Connection closed. Code: ${event.code}`, 'color: #ef4444');
      };
      websocket.value.onerror = (err) => {
        console.error('[WS] Connection error:', err);
        reject(err);
      };
    });
  };

  const toggleMedia = (type, forceState) => {
    if (!localStream.value) return;
    const track = type === 'video' ? localStream.value.getVideoTracks()[0] : localStream.value.getAudioTracks()[0];
    if (track) {
      const newState = forceState ?? !track.enabled;
      track.enabled = newState;
      if (type === 'video') isVideoEnabled.value = newState;
      if (type === 'audio') isAudioEnabled.value = newState;
    }
  };
  
  const toggleVideo = (forceState) => toggleMedia('video', forceState);
  const toggleAudio = (forceState) => toggleMedia('audio', forceState);

  const endCall = () => {
    console.log("Ending call, cleaning up all connections.");
    for (const participantId in peerConnections) {
      _closePeerConnection(participantId);
    }
    
    if (localStream.value) {
      localStream.value.getTracks().forEach(track => track.stop());
      localStream.value = null;
    }

    if (websocket.value) {
      websocket.value.close(1000, 'Call ended by user');
      websocket.value = null;
    }
    
    roomId.value = null;
  };

  // Deprecated placeholders
  const createPeerConnection = () => ({ success: true });
  const createOffer = () => ({ success: true });

  return {
    localStream,
    remoteStreams,
    peerConnections,
    websocket,
    isConnected,
    isVideoEnabled,
    isAudioEnabled,
    connectionStates,
    hasLocalVideo,
    hasRemoteVideo,
    mainRemoteStream,
    initializeLocalMedia,
    connectWebSocket,
    toggleVideo,
    toggleAudio,
    endCall,
    createPeerConnection, // Deprecated
    createOffer, // Deprecated
    remoteStream: mainRemoteStream,
    connectionState: computed(() => {
      const states = Object.values(connectionStates);
      if (states.some(s => s === 'connected')) return 'connected';
      if (states.some(s => s === 'connecting')) return 'connecting';
      if (states.some(s => s === 'failed')) return 'failed';
      return 'disconnected';
    }),
  };
});