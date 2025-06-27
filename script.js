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

    // WebRTC variables
    let localStream;
    let peerConnection;
    let isCaller = false;
    let roomId = null;
    
    // For signaling - using simple WebSocket for demo
    const signalingServer = 'wss://your-signaling-server.com'; // Replace with your server
    let socket;
    
    // Initialize the call
    async function init() {
        // Create or join room from URL
        roomId = window.location.hash.substring(1) || generateRoomId();
        isCaller = !window.location.hash;
        
        if (isCaller) {
            window.location.hash = roomId;
            callStatus.textContent = 'Creating room...';
        } else {
            callStatus.textContent = 'Joining room...';
        }
        
        // Connect to signaling server
        await connectSignaling();
        
        // Get user media
        try {
            localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: { width: 640, height: 480 }
            });
            localVideo.srcObject = localStream;
            
            if (isCaller) {
                createPeerConnection();
                callStatus.textContent = 'Waiting for participant...';
            }
        } catch (err) {
            console.error('Media device error:', err);
            callStatus.textContent = 'Could not access camera/microphone';
        }
    }
    
    // Connect to signaling server
    async function connectSignaling() {
        socket = new WebSocket(signalingServer);
        
        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'join',
                roomId: roomId
            }));
        };
        
        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            
            if (message.type === 'offer') {
                if (!isCaller) {
                    await createPeerConnection();
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(message));
                    const answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);
                    socket.send(JSON.stringify({
                        type: 'answer',
                        answer: answer,
                        roomId: roomId
                    }));
                }
            } else if (message.type === 'answer') {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(message));
            } else if (message.type === 'candidate') {
                try {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
                } catch (err) {
                    console.error('Error adding ICE candidate:', err);
                }
            } else if (message.type === 'room_full') {
                callStatus.textContent = 'Room is full';
            }
        };
    }
    
    // Create peer connection
    async function createPeerConnection() {
        peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                // Add your TURN server here if needed
                // { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
            ]
        });
        
        // Add local stream to connection
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
        
        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.send(JSON.stringify({
                    type: 'candidate',
                    candidate: event.candidate,
                    roomId: roomId
                }));
            }
        };
        
        // Handle remote stream
        peerConnection.ontrack = (event) => {
            remoteVideo.srcObject = event.streams[0];
            callStatus.textContent = 'Connected';
            startCallTimer();
        };
        
        // If caller, create offer
        if (isCaller) {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.send(JSON.stringify({
                type: 'offer',
                offer: offer,
                roomId: roomId
            }));
        }
    }
    
    // Generate random room ID
    function generateRoomId() {
        return Math.random().toString(36).substring(2, 8);
    }
    
    // Start call timer
    let seconds = 0;
    let timerInterval;
    function startCallTimer() {
        seconds = 0;
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            seconds++;
            updateTimerDisplay();
        }, 1000);
    }
    
    function updateTimerDisplay() {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        callTimer.textContent = 
            `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // End call
    function endCurrentCall() {
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
        }
        
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localVideo.srcObject = null;
        }
        
        if (remoteVideo.srcObject) {
            remoteVideo.srcObject.getTracks().forEach(track => track.stop());
            remoteVideo.srcObject = null;
        }
        
        clearInterval(timerInterval);
        callStatus.textContent = 'Call ended';
        
        if (socket) {
            socket.close();
        }
    }
    
    // Initialize the app
    init();
    
    // Event listeners for UI controls
    micToggle.addEventListener('click', () => {
        if (localStream) {
            const audioTracks = localStream.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            micToggle.innerHTML = audioTracks[0].enabled 
                ? '<i class="fas fa-microphone"></i>' 
                : '<i class="fas fa-microphone-slash"></i>';
        }
    });
    
    videoToggle.addEventListener('click', () => {
        if (localStream) {
            const videoTracks = localStream.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            videoToggle.innerHTML = videoTracks[0].enabled 
                ? '<i class="fas fa-video"></i>' 
                : '<i class="fas fa-video-slash"></i>';
            localVideo.style.backgroundColor = videoTracks[0].enabled ? 'transparent' : '#333';
        }
    });
    
    endCall.addEventListener('click', endCurrentCall);
    
    switchCamera.addEventListener('click', async () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            const constraints = videoTrack.getConstraints();
            
            constraints.facingMode = constraints.facingMode === 'user' ? 'environment' : 'user';
            
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: constraints
                });
                
                const newVideoTrack = newStream.getVideoTracks()[0];
                const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
                await sender.replaceTrack(newVideoTrack);
                
                videoTrack.stop();
                localStream.removeTrack(videoTrack);
                localStream.addTrack(newVideoTrack);
                localVideo.srcObject = localStream;
            } catch (err) {
                console.error('Error switching camera:', err);
            }
        }
    });
    
    // Share link button
    moreOptions.addEventListener('click', () => {
        const link = `${window.location.origin}${window.location.pathname}#${roomId}`;
        navigator.clipboard.writeText(link)
            .then(() => alert('Call link copied to clipboard!'))
            .catch(() => alert('Could not copy link'));
    });
});
