document.addEventListener('DOMContentLoaded', async () => {
    // DOM elements
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    const videoOverlay = document.getElementById('videoOverlay');
    const callStatus = document.getElementById('callStatus');
    const micToggle = document.getElementById('micToggle');
    const videoToggle = document.getElementById('videoToggle');
    const screenShare = document.getElementById('screenShare');
    const hangup = document.getElementById('hangup');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const sendMessage = document.getElementById('sendMessage');
    const qualityIndicator = document.getElementById('qualityIndicator');
    
    // State variables
    let micMuted = false;
    let videoOff = false;
    let callActive = true;
    let recording = false;
    let screenSharing = false;
    let localStream = null;
    let remoteStream = null;
    
    // Initialize video streams
    async function initStreams() {
        try {
            // Get user media
            localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });
            
            // Assign to local video element
            localVideo.srcObject = localStream;
            
            // Simulate remote stream (in a real app, this would come from WebRTC)
            remoteStream = new MediaStream();
            
            // Add some dummy tracks to simulate remote video
            // In a real app, these would come from the remote peer
            const tracks = localStream.getTracks();
            tracks.forEach(track => {
                if (track.kind === 'video') {
                    remoteStream.addTrack(track.clone());
                }
            });
            
            remoteVideo.srcObject = remoteStream;
            
            // Show call status
            callStatus.textContent = 'Connected - 00:00';
            videoOverlay.style.display = 'none';
            
            // Start call timer
            startCallTimer();
            
            // Simulate connection quality
            simulateConnectionQuality();
            
        } catch (err) {
            console.error('Error accessing media devices:', err);
            showNotification('Could not access camera/microphone');
        }
    }
    
    // Call timer
    function startCallTimer() {
        let seconds = 0;
        setInterval(() => {
            seconds++;
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            callStatus.textContent = `Connected - ${minutes}:${secs < 10 ? '0' + secs : secs}`;
        }, 1000);
    }
    
    // Simulate connection quality changes
    function simulateConnectionQuality() {
        setInterval(() => {
            if (!callActive) return;
            
            const qualities = ['good', 'medium', 'poor'];
            const quality = qualities[Math.floor(Math.random() * qualities.length)];
            
            qualityIndicator.className = 'quality-indicator';
            switch (quality) {
                case 'good':
                    qualityIndicator.classList.add('good');
                    break;
                case 'medium':
                    qualityIndicator.classList.add('medium');
                    break;
                case 'poor':
                    qualityIndicator.classList.add('poor');
                    break;
            }
        }, 5000);
    }
    
    // Toggle microphone
    micToggle.addEventListener('click', () => {
        if (!localStream) return;
        
        micMuted = !micMuted;
        const audioTracks = localStream.getAudioTracks();
        audioTracks.forEach(track => {
            track.enabled = !micMuted;
        });
        
        micToggle.innerHTML = micMuted ? 
            '<i class="fas fa-microphone-slash" style="color: var(--danger);"></i>' : 
            '<i class="fas fa-microphone"></i>';
        
        showNotification(micMuted ? 'Microphone muted' : 'Microphone unmuted');
    });
    
    // Toggle video
    videoToggle.addEventListener('click', () => {
        if (!localStream) return;
        
        videoOff = !videoOff;
        const videoTracks = localStream.getVideoTracks();
        videoTracks.forEach(track => {
            track.enabled = !videoOff;
        });
        
        videoToggle.innerHTML = videoOff ? 
            '<i class="fas fa-video-slash" style="color: var(--danger);"></i>' : 
            '<i class="fas fa-video"></i>';
        
        localVideo.style.backgroundColor = videoOff ? '#333' : '#000';
        showNotification(videoOff ? 'Video turned off' : 'Video turned on');
    });
    
    // Screen sharing
    screenShare.addEventListener('click', async () => {
        try {
            if (screenSharing) {
                // Stop screen sharing
                const videoTracks = localStream.getVideoTracks();
                videoTracks.forEach(track => track.stop());
                
                // Get back camera stream
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true
                });
                
                const newVideoTrack = stream.getVideoTracks()[0];
                localStream.addTrack(newVideoTrack);
                
                screenShare.innerHTML = '<i class="fas fa-desktop"></i>';
                screenShare.classList.remove('danger');
                showNotification('Screen sharing stopped');
            } else {
                // Start screen sharing
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true
                });
                
                const videoTracks = localStream.getVideoTracks();
                videoTracks.forEach(track => track.stop());
                localStream.removeTrack(videoTracks[0]);
                
                const newVideoTrack = stream.getVideoTracks()[0];
                localStream.addTrack(newVideoTrack);
                
                screenShare.innerHTML = '<i class="fas fa-stop" style="color: white;"></i>';
                screenShare.classList.add('danger');
                showNotification('Screen sharing started');
            }
            
            screenSharing = !screenSharing;
        } catch (err) {
            console.error('Error with screen sharing:', err);
            showNotification('Could not start screen sharing');
        }
    });
    
    // Record call
    document.getElementById('record').addEventListener('click', function() {
        recording = !recording;
        
        if (recording) {
            this.innerHTML = '<i class="fas fa-square" style="color: white;"></i>';
            this.classList.add('danger');
            showNotification('Recording started');
        } else {
            this.innerHTML = '<i class="fas fa-circle"></i>';
            this.classList.remove('danger');
            showNotification('Recording saved');
        }
    });
    
    // End call
    hangup.addEventListener('click', () => {
        if (callActive) {
            callActive = false;
            
            // Stop all tracks
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (remoteStream) {
                remoteStream.getTracks().forEach(track => track.stop());
            }
            
            showNotification('Call ended');
            
            setTimeout(() => {
                videoOverlay.style.display = 'flex';
                callStatus.textContent = 'Call ended';
                remoteVideo.style.backgroundColor = '#0f172a';
                hangup.classList.remove('danger');
                hangup.classList.add('disabled');
            }, 1000);
        }
    });
    
    // Chat functionality
    sendMessage.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
    
    function sendChatMessage() {
        const message = chatInput.value.trim();
        if (message) {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            const messageEl = document.createElement('div');
            messageEl.className = 'message local';
            messageEl.innerHTML = `
                <div>${message}</div>
                <div class="message-time">${timeString}</div>
            `;
            
            chatMessages.appendChild(messageEl);
            chatInput.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Simulate reply after a short delay
            setTimeout(() => {
                const replies = [
                    "That's a great point!",
                    "I completely agree with you.",
                    "Let me think about that...",
                    "Could you elaborate on that?",
                    "Thanks for sharing your thoughts!"
                ];
                const reply = replies[Math.floor(Math.random() * replies.length)];
                
                const replyEl = document.createElement('div');
                replyEl.className = 'message remote';
                replyEl.innerHTML = `
                    <div>${reply}</div>
                    <div class="message-time">${timeString}</div>
                `;
                
                chatMessages.appendChild(replyEl);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 1000);
        }
    }
    
    // Feature buttons
    document.getElementById('blurBg').addEventListener('click', () => {
        showNotification('Background blur applied');
    });
    
    document.getElementById('virtualBg').addEventListener('click', () => {
        showNotification('Virtual background activated');
    });
    
    document.getElementById('raiseHand').addEventListener('click', () => {
        showNotification('You raised your hand');
    });
    
    document.getElementById('invite').addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href)
            .then(() => showNotification('Invitation link copied to clipboard'))
            .catch(() => showNotification('Could not copy invitation link'));
    });
    
    // Show notification
    function showNotification(text) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = text;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Initialize the call
    initStreams();
});
