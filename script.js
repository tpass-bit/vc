// DOM Elements
const remoteVideo = document.getElementById('remoteVideo');
const localVideo = document.getElementById('localVideo');
const videoOverlay = document.getElementById('videoOverlay');
const joinBtn = document.getElementById('joinBtn');
const micBtn = document.getElementById('micBtn');
const videoBtn = document.getElementById('videoBtn');
const hangupBtn = document.getElementById('hangupBtn');
const shareBtn = document.getElementById('shareBtn');
const chatBtn = document.getElementById('chatBtn');
const chatContainer = document.getElementById('chatContainer');
const closeChatBtn = document.getElementById('closeChatBtn');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const callTimer = document.getElementById('callTimer');
const callStatus = document.getElementById('callStatus');
const remoteName = document.getElementById('remoteName');
const remoteAvatar = document.getElementById('remoteAvatar');
const notification = document.getElementById('notification');

// State variables
let localStream;
let remoteStream;
let isMicOn = true;
let isVideoOn = true;
let isCallActive = false;
let callStartTime;
let timerInterval;
let roomId = generateRoomId();

// Generate a random room ID
function generateRoomId() {
    return Math.random().toString(36).substring(2, 8);
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
        
        // Simulate remote connection (in a real app, this would use WebRTC)
        setTimeout(() => {
            videoOverlay.style.display = 'none';
            isCallActive = true;
            callStatus.style.color = 'var(--success)';
            startCallTimer();
            
            // Simulate remote video
            remoteVideo.style.backgroundColor = 'transparent';
            
            // Set remote user info
            remoteName.textContent = 'Remote User';
            remoteAvatar.textContent = 'R';
        }, 1500);
        
        showNotification('Call started');
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
    videoOverlay.style.display = 'flex';
    isCallActive = false;
    callStatus.style.color = 'var(--danger)';
    stopCallTimer();
    
    // Clear video streams
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    remoteVideo.style.backgroundColor = 'var(--dark)';
    
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

// Toggle chat
function toggleChat() {
    chatContainer.classList.toggle('hidden');
}

// Send chat message
function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add message to chat
    const messageElement = document.createElement('div');
    messageElement.className = 'message local';
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
    
    // Clear input
    messageInput.value = '';
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Simulate reply after a short delay
    if (isCallActive) {
        setTimeout(() => {
            const replies = [
                "Thanks for your message!",
                "I agree with that.",
                "Let me think about it...",
                "Can you explain more?",
                "That's interesting!"
            ];
            const reply = replies[Math.floor(Math.random() * replies.length)];
            
            const replyElement = document.createElement('div');
            replyElement.className = 'message remote';
            replyElement.textContent = reply;
            chatMessages.appendChild(replyElement);
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1000);
    }
}

// Check for room ID in URL
function checkUrlForRoom() {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    
    if (room) {
        roomId = room;
        remoteName.textContent = 'Joining call...';
        joinBtn.textContent = 'Join Call';
        showNotification(`Joining room: ${room}`);
    }
}

// Event Listeners
joinBtn.addEventListener('click', startCall);
micBtn.addEventListener('click', toggleMic);
videoBtn.addEventListener('click', toggleVideo);
hangupBtn.addEventListener('click', endCall);
shareBtn.addEventListener('click', shareRoomLink);
chatBtn.addEventListener('click', toggleChat);
closeChatBtn.addEventListener('click', toggleChat);
sendMessageBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Initialize
checkUrlForRoom();
showNotification(`Your room ID: ${roomId}`, 5000);
