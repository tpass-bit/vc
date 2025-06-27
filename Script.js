document.addEventListener('DOMContentLoaded', () => {
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
    
    // Simulate WebRTC connection
    function initCall() {
        // Simulate getting user media
        setTimeout(() => {
            callStatus.textContent = 'Connected - 00:45';
            videoOverlay.style.display = 'none';
            
            // Simulate remote video stream
            remoteVideo.style.backgroundColor = 'transparent';
            
            // Simulate connection quality
            qualityIndicator.classList.add('medium');
            
            // Start call timer
            startCallTimer();
        }, 2000);
    }
    
    // Call timer simulation
    function startCallTimer() {
        let seconds = 45;
        setInterval(() => {
            seconds++;
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            callStatus.textContent = `Connected - ${minutes}:${secs < 10 ? '0' + secs : secs}`;
        }, 1000);
    }
    
    // Toggle microphone
    micToggle.addEventListener('click', () => {
        micMuted = !micMuted;
        micToggle.innerHTML = micMuted ? 
            '<i class="fas fa-microphone-slash" style="color: var(--danger);"></i>' : 
            '<i class="fas fa-microphone"></i>';
        
        showNotification(micMuted ? 'Microphone muted' : 'Microphone unmuted');
    });
    
    // Toggle video
    videoToggle.addEventListener('click', () => {
        videoOff = !videoOff;
        videoToggle.innerHTML = videoOff ? 
            '<i class="fas fa-video-slash" style="color: var(--danger);"></i>' : 
            '<i class="fas fa-video"></i>';
        
        localVideo.style.backgroundColor = videoOff ? '#333' : '#000';
        showNotification(videoOff ? 'Video turned off' : 'Video turned on');
    });
    
    // Screen sharing
    screenShare.addEventListener('click', () => {
        screenSharing = !screenSharing;
        
        if(screenSharing) {
            showNotification('Screen sharing started');
            screenShare.innerHTML = '<i class="fas fa-stop" style="color: white;"></i>';
            screenShare.classList.add('danger');
        } else {
            screenShare.innerHTML = '<i class="fas fa-desktop"></i>';
            screenShare.classList.remove('danger');
            showNotification('Screen sharing stopped');
        }
    });
    
    // Record call
    document.getElementById('record').addEventListener('click', function() {
        recording = !recording;
        
        if(recording) {
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
        if(callActive) {
            showNotification('Call ended');
            callActive = false;
            
            setTimeout(() => {
                videoOverlay.style.display = 'flex';
                callStatus.textContent = 'Call ended - 00:52';
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
        showNotification('Invitation link copied to clipboard');
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
    
    // Simulate changing connection quality
    setInterval(() => {
        if(!callActive) return;
        
        const qualities = ['good', 'medium', 'poor'];
        const quality = qualities[Math.floor(Math.random() * qualities.length)];
        
        qualityIndicator.className = 'quality-indicator';
        switch(quality) {
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
    
    // Initialize the call
    initCall();
});
