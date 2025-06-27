// DOM Elements
const connectionScreen = document.getElementById('connectionScreen');
const callScreen = document.getElementById('callScreen');
const chatPanel = document.getElementById('chatPanel');
const startCallBtn = document.getElementById('startCallBtn');
const joinCallBtn = document.getElementById('joinCallBtn');
const endCallBtn = document.getElementById('endCallBtn');
const micControlBtn = document.getElementById('micControlBtn');
const videoControlBtn = document.getElementById('videoControlBtn');
const flipCameraBtn = document.getElementById('flipCameraBtn');
const chatBtn = document.getElementById('chatBtn');
const closeChatBtn = document.getElementById('closeChatBtn');
const minimizeBtn = document.getElementById('minimizeBtn');
const copyRoomIdBtn = document.getElementById('copyRoomId');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const messageInput = document.getElementById('messageInput');
const chatMessages = document.getElementById('chatMessages');
const remoteVideo = document.getElementById('remoteVideo');
const localVideo = document.getElementById('localVideo');
const callTimer = document.getElementById('callTimer');
const connectionStatus = document.getElementById('connectionStatus');
const notification = document.getElementById('notification');
const roomIdInput = document.getElementById('roomId');

// State variables
let localStream;
let remoteStream;
let isMicOn = true;
let isVideoOn = true;
let isCallActive = false;
let callStartTime;
let timerInterval;
let currentFacingMode = 'user';
let roomId = generateRoomId();

// Generate random room ID
function generateRoomId() {
    return `spark-${Math.random().toString(36).substr(2, 6)}`;
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
    
    micControlBtn.innerHTML = isMicOn ? 
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
    
    videoControlBtn.innerHTML = isVideoOn ? 
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
        connectionScreen.classList.add('hidden');
        callScreen.classList.remove('hidden');
        
        // Simulate connection process
        connectionStatus.classList.remove('connected');
        connectionStatus.querySelector('span').textContent = 'Connecting...';
        
        // Simulate connection delay
        setTimeout(() => {
            // Simulate remote connection
            remoteVideo.style.backgroundColor = 'transparent';
            connectionStatus.classList.add('connected');
            connectionStatus.querySelector('span').textContent = 'Connected';
            
            // Start call timer
            isCallActive = true;
            startCallTimer();
            
            // Show welcome message in chat
            addChatMessage('remote', 'Hello! Welcome to the call.');
            
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
    connectionScreen.classList.remove('hidden');
    callScreen.classList.add('hidden');
    chatPanel.classList.add('hidden');
    isCallActive = false;
    stopCallTimer();
    
    // Clear video streams
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    remoteVideo.style.backgroundColor = '#000';
    
    showNotification('Call ended');
}

// Toggle chat panel
function toggleChat() {
    chatPanel.classList.toggle('hidden');
}

// Add message to chat
function addChatMessage(sender, message) {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;
    messageElement.innerHTML = `
        <div class="message-content">${message}</div>
        <div class="message-time">${time}</div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send message
function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    addChatMessage('local', message);
    messageInput.value = '';
    
    // Simulate reply after delay if call is active
    if (isCallActive) {
        setTimeout(() => {
            const replies = [
                "Thanks for your message!",
                "I agree with that.",
                "Interesting point!",
                "Let me think about that...",
                "Can you explain more?",
                "That's a great idea!"
            ];
            const reply = replies[Math.floor(Math.random() * replies.length)];
            addChatMessage('remote', reply);
        }, 1000 + Math.random() * 2000);
    }
}

// Copy room ID to clipboard
function copyRoomId() {
    navigator.clipboard.writeText(roomIdInput.value).then(() => {
        showNotification('Room ID copied to clipboard');
    }).catch(err => {
        console.error('Could not copy text:', err);
        showNotification('Failed to copy Room ID');
    });
}

// Initialize room ID
roomIdInput.value = roomId;

// Event listeners
startCallBtn.addEventListener('click', startCall);
joinCallBtn.addEventListener('click', startCall); // Same function for demo
endCallBtn.addEventListener('click', endCall);
micControlBtn.addEventListener('click', toggleMic);
videoControlBtn.addEventListener('click', toggleVideo);
flipCameraBtn.addEventListener('click', flipCamera);
chatBtn.addEventListener('click', toggleChat);
closeChatBtn.addEventListener('click', toggleChat);
minimizeBtn.addEventListener('click', () => {
    callScreen.classList.add('hidden');
    connectionScreen.classList.remove('hidden');
});
copyRoomIdBtn.addEventListener('click', copyRoomId);
sendMessageBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Show initial notification
showNotification(`Your room ID: ${roomId}`, 5000);
