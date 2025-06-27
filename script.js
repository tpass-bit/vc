// DOM Elements
const precallScreen = document.getElementById('precallScreen');
const callScreen = document.getElementById('callScreen');
const startCallBtn = document.getElementById('startCallBtn');
const joinCallBtn = document.getElementById('joinCallBtn');
const endCallBtn = document.getElementById('endCallBtn');
const micBtn = document.getElementById('micBtn');
const videoBtn = document.getElementById('videoBtn');
const flipCameraBtn = document.getElementById('flipCameraBtn');
const copyRoomIdBtn = document.getElementById('copyRoomId');
const remoteVideo = document.getElementById('remoteVideo');
const localVideo = document.getElementById('localVideo');
const callTimer = document.getElementById('callTimer');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const roomIdElement = document.getElementById('roomId');
const notification = document.getElementById('notification');

// State variables
let localStream;
let peer;
let currentPeerId;
let currentCall;
let isMicOn = true;
let isVideoOn = true;
let callStartTime;
let timerInterval;
let currentFacingMode = 'user';

// Initialize the app
async function init() {
    // Generate or get room ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    let roomId = urlParams.get('room');
    
    if (!roomId) {
        roomId = 'spark-' + Math.random().toString(36).substr(2, 6);
        window.history.replaceState({}, '', `?room=${roomId}`);
    }
    
    roomIdElement.textContent = roomId;

    // Initialize PeerJS
    peer = new Peer({
        host: '0.peerjs.com',
        port: 443,
        secure: true,
        debug: 3
    });

    peer.on('open', (id) => {
        currentPeerId = id;
        updateStatus('Connected', 'success');
        showNotification('Ready for calls');
    });

    peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        updateStatus('Connection error', 'error');
        showNotification('Connection error: ' + err.type);
    });

    peer.on('call', (call) => {
        // Answer the call with our stream
        call.answer(localStream);
        currentCall = call;
        updateStatus('In call', 'success');
        
        call.on('stream', (remoteStream) => {
            remoteVideo.srcObject = remoteStream;
            startCallTimer();
            showNotification('Call connected');
        });
        
        call.on('close', () => {
            endCall();
        });
    });

    // Get user media
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: currentFacingMode },
            audio: true
        });
        localVideo.srcObject = localStream;
        
        // If joining an existing room
        if (urlParams.get('join')) {
            const call = peer.call(urlParams.get('join'), localStream);
            currentCall = call;
            
            call.on('stream', (remoteStream) => {
                remoteVideo.srcObject = remoteStream;
                updateStatus('In call', 'success');
                startCallTimer();
            });
            
            call.on('close', endCall);
        }
    } catch (err) {
        console.error('Media error:', err);
        showNotification('Camera/mic access denied');
        updateStatus('Media blocked', 'error');
    }
}

// Update connection status UI
function updateStatus(text, type) {
    statusText.textContent = text;
    statusDot.className = 'status-dot';
    
    if (type === 'success') {
        statusDot.classList.add('connected');
    } else if (type === 'error') {
        statusDot.style.backgroundColor = 'var(--danger)';
    }
}

// Start call timer
function startCallTimer() {
    callStartTime = new Date();
    clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now - callStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        callTimer.textContent = `${minutes}:${seconds}`;
    }, 1000);
}

// End current call
function endCall() {
    if (currentCall) {
        currentCall.close();
    }
    
    if (remoteVideo.srcObject) {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
    }
    
    clearInterval(timerInterval);
    callTimer.textContent = '00:00';
    updateStatus('Disconnected', 'error');
    
    // Return to precall screen after delay
    setTimeout(() => {
        precallScreen.classList.remove('hidden');
        callScreen.classList.add('hidden');
    }, 1000);
}

// Flip camera
async function flipCamera() {
    if (!localStream) return;
    
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    
    try {
        // Stop previous video tracks
        localStream.getVideoTracks().forEach(track => track.stop());
        
        // Get new stream
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: currentFacingMode },
            audio: isMicOn
        });
        
        // Replace video track
        const videoTrack = stream.getVideoTracks()[0];
        localStream.addTrack(videoTrack);
        localVideo.srcObject = localStream;
        
        showNotification(`Switched to ${currentFacingMode === 'user' ? 'front' : 'rear'} camera`);
    } catch (err) {
        console.error('Camera flip error:', err);
        showNotification('Failed to switch camera');
    }
}

// Toggle microphone
function toggleMic() {
    if (!localStream) return;
    
    isMicOn = !isMicOn;
    localStream.getAudioTracks().forEach(track => {
        track.enabled = isMicOn;
    });
    
    micBtn.innerHTML = isMicOn 
        ? '<i class="fas fa-microphone"></i>' 
        : '<i class="fas fa-microphone-slash"></i>';
    
    showNotification(isMicOn ? 'Microphone on' : 'Microphone off');
}

// Toggle video
function toggleVideo() {
    if (!localStream) return;
    
    isVideoOn = !isVideoOn;
    localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOn;
    });
    
    videoBtn.innerHTML = isVideoOn 
        ? '<i class="fas fa-video"></i>' 
        : '<i class="fas fa-video-slash"></i>';
    
    showNotification(isVideoOn ? 'Video on' : 'Video off');
}

// Show notification
function showNotification(message, duration = 3000) {
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

// Copy room ID to clipboard
function copyRoomId() {
    navigator.clipboard.writeText(roomIdElement.textContent).then(() => {
        showNotification('Room ID copied!');
    }).catch(err => {
        showNotification('Failed to copy');
        console.error('Copy failed:', err);
    });
}

// Start a new call
function startNewCall() {
    precallScreen.classList.add('hidden');
    callScreen.classList.remove('hidden');
    updateStatus('Waiting for peer...', 'pending');
}

// Join an existing call
function joinCall() {
    const roomId = prompt('Enter Room ID:');
    if (roomId) {
        window.location.href = `${window.location.pathname}?room=${roomId}&join=true`;
    }
}

// Event listeners
startCallBtn.addEventListener('click', startNewCall);
joinCallBtn.addEventListener('click', joinCall);
endCallBtn.addEventListener('click', endCall);
micBtn.addEventListener('click', toggleMic);
videoBtn.addEventListener('click', toggleVideo);
flipCameraBtn.addEventListener('click', flipCamera);
copyRoomIdBtn.addEventListener('click', copyRoomId);

// Initialize the app when loaded
window.addEventListener('DOMContentLoaded', init);
