document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    const callTimer = document.querySelector('.call-timer');
    const callStatus = document.querySelector('.call-status');
    const micToggle = document.getElementById('micToggle');
    const videoToggle = document.getElementById('videoToggle');
    const endCall = document.getElementById('endCall');
    const switchCamera = document.getElementById('switchCamera');
    const moreOptions = document.getElementById('moreOptions');
    const optionsMenu = document.querySelector('.options-menu');
    const blurBackground = document.getElementById('blurBackground');
    const virtualBackground = document.getElementById('virtualBackground');
    const shareScreen = document.getElementById('shareScreen');

    // State
    let localStream;
    let remoteStream;
    let callActive = false;
    let micEnabled = true;
    let videoEnabled = true;
    let facingMode = 'user';
    let seconds = 0;
    let timerInterval;
    let optionsVisible = false;

    // Initialize call
    async function initCall() {
        try {
            callStatus.textContent = 'Connecting...';
            
            // Get user media
            localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: {
                    facingMode: facingMode,
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            // Set local video source
            localVideo.srcObject = localStream;

            // Simulate remote stream (in real app, this would be from WebRTC)
            remoteStream = new MediaStream();
            // Clone local tracks to simulate remote (for demo)
            localStream.getTracks().forEach(track => {
                remoteStream.addTrack(track.clone());
            });
            remoteVideo.srcObject = remoteStream;

            // Start call
            callActive = true;
            startCallTimer();
            callStatus.textContent = 'Connected';
            
            // Set up event listeners
            setupEventListeners();

        } catch (error) {
            console.error('Error initializing call:', error);
            callStatus.textContent = 'Failed to connect';
            showNotification('Could not access camera/microphone');
        }
    }

    // Start call timer
    function startCallTimer() {
        seconds = 0;
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            seconds++;
            updateTimerDisplay();
        }, 1000);
    }

    // Update timer display
    function updateTimerDisplay() {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        callTimer.textContent = 
            `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Setup event listeners
    function setupEventListeners() {
        // Mic toggle
        micToggle.addEventListener('click', () => {
            micEnabled = !micEnabled;
            localStream.getAudioTracks().forEach(track => {
                track.enabled = micEnabled;
            });
            micToggle.innerHTML = micEnabled 
                ? '<i class="fas fa-microphone"></i>' 
                : '<i class="fas fa-microphone-slash"></i>';
            showNotification(micEnabled ? 'Microphone on' : 'Microphone off');
        });

        // Video toggle
        videoToggle.addEventListener('click', () => {
            videoEnabled = !videoEnabled;
            localStream.getVideoTracks().forEach(track => {
                track.enabled = videoEnabled;
            });
            videoToggle.innerHTML = videoEnabled 
                ? '<i class="fas fa-video"></i>' 
                : '<i class="fas fa-video-slash"></i>';
            localVideo.style.backgroundColor = videoEnabled ? 'transparent' : '#333';
            showNotification(videoEnabled ? 'Video on' : 'Video off');
        });

        // End call
        endCall.addEventListener('click', endCurrentCall);

        // Switch camera
        switchCamera.addEventListener('click', switchCameraHandler);

        // More options
        moreOptions.addEventListener('click', () => {
            optionsVisible = !optionsVisible;
            optionsMenu.classList.toggle('hidden', !optionsVisible);
        });

        // Background options
        blurBackground.addEventListener('click', () => {
            showNotification('Background blur enabled');
            optionsMenu.classList.add('hidden');
            optionsVisible = false;
        });

        virtualBackground.addEventListener('click', () => {
            showNotification('Virtual background enabled');
            optionsMenu.classList.add('hidden');
            optionsVisible = false;
        });

        shareScreen.addEventListener('click', async () => {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: false
                });
                
                // Replace video track with screen share
                const videoTrack = screenStream.getVideoTracks()[0];
                const sender = localStream.getVideoTracks()[0];
                localStream.removeTrack(sender);
                localStream.addTrack(videoTrack);
                
                showNotification('Screen sharing started');
                optionsMenu.classList.add('hidden');
                optionsVisible = false;
                
                // When screen sharing stops
                videoTrack.onended = () => {
                    showNotification('Screen sharing stopped');
                };
                
            } catch (error) {
                console.error('Screen sharing error:', error);
                showNotification('Could not share screen');
            }
        });
    }

    // Switch camera handler
    async function switchCameraHandler() {
        try {
            facingMode = facingMode === 'user' ? 'environment' : 'user';
            
            // Get new stream
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode }
            });
            
            // Replace video track
            const oldVideoTrack = localStream.getVideoTracks()[0];
            const newVideoTrack = newStream.getVideoTracks()[0];
            
            localStream.removeTrack(oldVideoTrack);
            localStream.addTrack(newVideoTrack);
            oldVideoTrack.stop();
            
            showNotification(`Switched to ${facingMode === 'user' ? 'front' : 'rear'} camera`);
            
        } catch (error) {
            console.error('Error switching camera:', error);
            showNotification('Could not switch camera');
        }
    }

    // End current call
    function endCurrentCall() {
        if (!callActive) return;
        
        callActive = false;
        clearInterval(timerInterval);
        callStatus.textContent = 'Call ended';
        
        // Stop all tracks
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
        }
        
        showNotification('Call ended');
        
        // Reset UI after delay
        setTimeout(() => {
            localVideo.srcObject = null;
            remoteVideo.srcObject = null;
            callTimer.textContent = '00:00';
        }, 1000);
    }

    // Show notification
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animation
        notification.style.animation = 'fadeIn 0.3s ease';
        
        // Remove after delay
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Add fadeOut animation dynamically
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(20px); }
        }
        
        .notification {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary);
            color: white;
            padding: 12px 25px;
            border-radius: 30px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            z-index: 100;
        }
    `;
    document.head.appendChild(style);

    // Initialize the call
    initCall();
});
