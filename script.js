// DOM Elements
const precallScreen = document.getElementById('precallScreen');
const callScreen = document.getElementById('callScreen');
const startCallBtn = document.getElementById('startCallBtn');
const joinCallBtn = document.getElementById('joinCallBtn');
const endCallBtn = document.getElementById('endCallBtn');
const micBtn = document.getElementById('micBtn');
const videoBtn = document.getElementById('videoBtn');
const flipCameraBtn = document.getElementById('flipCameraBtn');
const shareBtn = document.getElementById('shareBtn');
const minimizeBtn = document.getElementById('minimizeBtn');
const copyRoomIdBtn = document.getElementById('copyRoomId');
const remoteVideo = document.getElementById('remoteVideo');
const localVideo = document.getElementById('localVideo');
const callTimer = document.getElementById('callTimer');
const connectionStatus = document.getElementById('connectionStatus');
const notification = document.getElementById('notification');
const roomIdElement = document.getElementById('roomId');

// State variables
let localStream;
let isMicOn = true;
let isVideoOn = true;
let isCallActive = false;
let callStartTime;
let timerInterval;
let currentFacingMode = 'user';
const roomId = generateRoomId();

// Generate random room ID
function generateRoomId() {
    return `vc-${Math.random().toString(36).substr(2, 6)}`;
}

// Show notification
function showNotification(message, duration = 3000) {
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

// Update call timer
function updateCallTimer() {
    const now = new Date();
    const elapsed = Math.floor((now - callStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    callTimer.textContent = `${minutes}:${seconds}`;
}

// Start call timer
function startCallTimer() {
    callStartTime = new Date();
    timerInterval = setInterval(updateCallTimer, 1000);
}

// Stop call timer
function stopCallTimer() {
    clearInterval(timerInterval);
}

// Toggle microphone
function toggleMic() {
    if (!localStream) return;
    
    isMicOn = !isMicOn;
    localStream.getAudioTracks().forEach(track => {
        track.enabled = isMicOn;
    });
    
    micBtn.innerHTML = isMicOn ? 
        '<i class="fas fa-microphone"></i>' : 
        '<i class="fas fa-microphone-slash"></i>';
    
    showNotification(isMicOn ? 'Microphone on' : 'Microphone off');
}

// Toggle video
function toggleVideo() {
    if (!localStream) return;
    
    isVideoOn = !isVideoOn;
    localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOn;
    });
    
    videoBtn.innerHTML = isVideoOn ? 
        '<i class="fas fa-video"></i>' : 
        '<i class="fas fa-video-slash"></i>';
    
    showNotification(isVideoOn ? 'Video on' : 'Video off');
}

// Flip camera
async function flipCamera() {
    if (!localStream) return;
    
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    
    try {
        // Stop previous video tracks
        localStream.getVideoTracks().forEach(track => track.stop());
        
        // Get new stream with flipped camera
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: currentFacingMode },
            audio: isMicOn
        });
        
        // Replace video track
        const videoTrack = stream.getVideoTracks()[0];
        localStream.addTrack(videoTrack);
        localVideo.srcObject = localStream;
        
        showNotification(`Camera switched to ${currentFacingMode === 'user' ? 'front' : 'back'}`);
    } catch (error) {
        console.error('Error flipping camera:', error);
        showNotification('Failed to switch camera');
    }
}

// Start call
async function startCall() {
    try {
        // Get user media
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        });
        
        // Display local video
        localVideo.srcObject = localStream;
        
        // Show call screen
        precallScreen.classList.add('hidden');
        callScreen.classList.remove('hidden');
        
        // Simulate connection process
        connectionStatus.classList.remove('connected');
        
        // Simulate connection delay
        setTimeout(() => {
            // Simulate remote connection
            remoteVideo.style.backgroundColor = 'transparent';
            connectionStatus.classList.add('connected');
            
            // Start call timer
            isCallActive = true;
            startCallTimer();
            
            showNotification('Call connected successfully');
        }, 2000);
        
    } catch (error) {
        console.error('Error accessing media devices:', error);
        showNotification('Error accessing camera/microphone');
    }
}

// End call
function endCall() {
    if (!isCallActive) return;
    
    // Stop local stream
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    
    // Reset UI
    precallScreen.classList.remove('hidden');
    callScreen.classList.add('hidden');
    isCallActive = false;
    stopCallTimer();
    
    // Clear video streams
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    remoteVideo.style.backgroundColor = '#000';
    
    showNotification('Call ended');
}

// Share room link
function shareRoomLink() {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Join my video call',
            text: 'Click the link to join my video call',
            url: url
        }).catch(err => {
            console.error('Error sharing:', err);
            copyToClipboard(url);
        });
    } else {
        copyToClipboard(url);
    }
}

// Copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Link copied to clipboard');
    }).catch(err => {
        console.error('Could not copy text:', err);
        showNotification('Failed to copy link');
    });
}

// Initialize room ID
roomIdElement.textContent = roomId;

// Event listeners
startCallBtn.addEventListener('click', startCall);
joinCallBtn.addEventListener('click', startCall); // Same function for demo
endCallBtn.addEventListener('click', endCall);
micBtn.addEventListener('click', toggleMic);
videoBtn.addEventListener('click', toggleVideo);
flipCameraBtn.addEventListener('click', flipCamera);
shareBtn.addEventListener('click', shareRoomLink);
minimizeBtn.addEventListener('click', () => {
    callScreen.classList.add('hidden');
    precallScreen.classList.remove('hidden');
});
copyRoomIdBtn.addEventListener('click', () => copyToClipboard(roomId));

// Show initial notification
showNotification(`Your room ID: ${roomId}`, 5000);

// Check for room ID in URL
function checkUrlForRoom() {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    
    if (room) {
        roomIdElement.textContent = room;
        showNotification(`Joining room: ${room}`);
    }
}

checkUrlForRoom();
