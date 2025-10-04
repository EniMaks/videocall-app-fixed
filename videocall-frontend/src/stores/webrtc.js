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
  const remoteParticipants = ref([]);
  
  const websocket = ref(null);
  const roomId = ref(null);

  // --- Computed Properties ---
  const isConnected = computed(() => Object.values(connectionStates).some(s => s === 'connected'));
  const hasLocalVideo = computed(() => localStream.value !== null);
  const mainRemoteStream = computed(() => {
    // Simple logic: return the first available remote stream
    const firstParticipantId = Object.keys(remoteStreams)[0];
    return firstParticipantId ? remoteStreams[firstParticipantId] : null;
  });
  const hasRemoteVideo = computed(() => mainRemoteStream.value !== null);


  // --- Private Helper Functions ---
  const sendWebSocketMessage = (message) => {
    if (websocket.value && websocket.value.readyState === WebSocket.OPEN) {
      websocket.value.send(JSON.stringify(message));
    }
  };

  const _createPeerConnection = (participantId) => {
    if (peerConnections[participantId]) {
      console.warn(`Peer connection for ${participantId} already exists.`);
      return peerConnections[participantId];
    }

    console.log(`Creating new peer connection for participant: ${participantId}`);
    const pc = new RTCPeerConnection(webrtcService.getIceServerConfig());

    // Add local stream tracks
    if (localStream.value) {
      localStream.value.getTracks().forEach(track => {
        pc.addTrack(track, localStream.value);
      });
    }

    pc.ontrack = (event) => {
      console.log(`Received remote track from ${participantId}`);
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
      console.log(`Connection state for ${participantId} changed to: ${state}`);
      if (state === 'failed') {
         console.error(`ICE connection failed for participant ${participantId}. Restarting...`);
         // Implement ICE restart logic if needed, for now just log
         pc.createOffer({ iceRestart: true })
           .then(offer => pc.setLocalDescription(offer))
           .then(() => {
             sendWebSocketMessage({ type: 'offer', offer: pc.localDescription, target: participantId });
           });
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
      console.log(`Closed peer connection for participant: ${participantId}`);
    }
  };


  // --- WebSocket Message Handlers ---
  const handleWebSocketMessage = async (data) => {
    const { type, sender, target } = data;
    
    // Ignore messages not intended for us (if target is specified)
    // Note: Backend doesn't currently set a local participant ID, so we accept all targeted messages for now.
    
    console.log('Received WebSocket message:', data.type, 'from', sender);

    switch (type) {
      case 'user_joined':
        // A new user has joined the room. Let's create an offer for them.
        console.log(`User ${data.participant_id} joined. Creating offer.`);
        const pc = _createPeerConnection(data.participant_id);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendWebSocketMessage({ type: 'offer', offer, target: data.participant_id });
        break;

      case 'user_left':
        console.log(`User ${data.participant_id} left.`);
        _closePeerConnection(data.participant_id);
        break;

      case 'webrtc_offer':
        // We received an offer from a peer, create an answer.
        console.log(`Received offer from ${sender}. Creating answer.`);
        const offerPc = _createPeerConnection(sender);
        await offerPc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await offerPc.createAnswer();
        await offerPc.setLocalDescription(answer);
        sendWebSocketMessage({ type: 'answer', answer, target: sender });
        break;

      case 'webrtc_answer':
        // We received an answer to our offer.
        console.log(`Received answer from ${sender}.`);
        const answerPc = peerConnections[sender];
        if (answerPc) {
          await answerPc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } else {
          console.error(`Received answer from unknown peer: ${sender}`);
        }
        break;

      case 'ice_candidate':
        console.log(`Received ICE candidate from ${sender}.`);
        const candidatePc = peerConnections[sender];
        if (candidatePc) {
          try {
            await candidatePc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) {
            console.error('Error adding received ICE candidate', e);
          }
        } else {
          console.error(`Received ICE candidate from unknown peer: ${sender}`);
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
        video: { ...(settingsService.getQualityPresets()[selectedQuality.value] || {}), frameRate: { ideal: 30 } },
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

      websocket.value = new WebSocket(wsUrl);
      websocket.value.onopen = () => resolve();
      websocket.value.onmessage = (event) => handleWebSocketMessage(JSON.parse(event.data));
      websocket.value.onclose = () => console.log('WebSocket disconnected');
      websocket.value.onerror = (err) => reject(err);
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
    // Close all peer connections
    for (const participantId in peerConnections) {
      _closePeerConnection(participantId);
    }
    
    // Stop local media tracks
    if (localStream.value) {
      localStream.value.getTracks().forEach(track => track.stop());
      localStream.value = null;
    }

    // Close WebSocket
    if (websocket.value) {
      websocket.value.close(1000, 'Call ended by user');
      websocket.value = null;
    }
    
    // Reset state
    remoteParticipants.value = [];
    roomId.value = null;
  };

  // This is a placeholder, as the original file had these and they might be used elsewhere
  const createPeerConnection = () => ({ success: true });
  const createOffer = () => ({ success: true });

  return {
    // State
    localStream,
    remoteStreams, // Changed
    peerConnections, // Changed
    websocket,
    isConnected,
    isVideoEnabled,
    isAudioEnabled,
    connectionStates, // Changed
    remoteParticipants,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    selectedQuality,
    shouldMirror,

    // Computed
    hasLocalVideo,
    hasRemoteVideo, // Changed
    mainRemoteStream, // New

    // Actions
    initializeLocalMedia,
    connectWebSocket,
    toggleVideo,
    toggleAudio,
    endCall,
    
    // Deprecated placeholders, should be removed after refactoring components
    createPeerConnection,
    createOffer,
    remoteStream: mainRemoteStream, // backward compatibility for components
    connectionState: computed(() => isConnected.value ? 'connected' : 'disconnected'), // simplified
  };
});