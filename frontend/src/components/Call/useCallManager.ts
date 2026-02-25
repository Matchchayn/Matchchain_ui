import { useState, useEffect, useRef, useCallback } from 'react'
import { socketService } from '../../utils/socketService'

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended'

interface UseCallManagerOptions {
    callType: 'phone' | 'video'
    currentUserId: string
    otherUserId: string
    onCallEnd: () => void
    incomingOffer?: RTCSessionDescriptionInit
}

export function useCallManager({ callType, currentUserId, otherUserId, onCallEnd, incomingOffer }: UseCallManagerOptions) {
    const [status, setStatus] = useState<CallStatus>(incomingOffer ? 'ringing' : 'calling')
    const [isMuted, setIsMuted] = useState(false)
    const [isCameraOn, setIsCameraOn] = useState(callType === 'video')
    const [isSpeakerOn, setIsSpeakerOn] = useState(true)
    const [callDuration, setCallDuration] = useState(0)
    const [permissionDenied, setPermissionDenied] = useState(false)
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)

    const peerRef = useRef<RTCPeerConnection | null>(null)
    const durationIntervalRef = useRef<any>(null)
    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const hasInitiated = useRef(false)

    const iceServers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
        ]
    }

    // ─── Get local media stream ───
    const getLocalStream = useCallback(async () => {
        try {
            const constraints: MediaStreamConstraints = {
                audio: true,
                video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false
            }
            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            setLocalStream(stream)
            setPermissionDenied(false)
            return stream
        } catch (err: any) {
            console.error('getUserMedia error:', err.name, err.message)
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setPermissionDenied(true)
            }
            // Try audio-only fallback for video calls
            if (callType === 'video') {
                try {
                    const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                    setLocalStream(audioOnly)
                    setIsCameraOn(false)
                    return audioOnly
                } catch {
                    return null
                }
            }
            return null
        }
    }, [callType])

    // ─── Sync local stream → video element ───
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream
        }
    }, [localStream])

    // ─── Sync remote stream → video element ───
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream
        }
    }, [remoteStream])

    // ─── Create peer connection ───
    const createPeer = useCallback((stream: MediaStream | null) => {
        const peer = new RTCPeerConnection(iceServers)

        // Add local tracks
        if (stream) {
            stream.getTracks().forEach(track => {
                peer.addTrack(track, stream)
            })
        }

        // Receive remote tracks
        peer.ontrack = (event) => {
            console.log('📹 ontrack fired, streams:', event.streams.length)
            if (event.streams[0]) {
                setRemoteStream(event.streams[0])
            }
        }

        // ICE candidates
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                const socket = socketService.getSocket()
                socket?.emit('call_ice_candidate', { to: otherUserId, candidate: event.candidate })
            }
        }

        // Connection state
        peer.onconnectionstatechange = () => {
            const state = peer.connectionState
            console.log('📞 Peer connection state:', state)
            if (state === 'connected') {
                setStatus('connected')
                if (!durationIntervalRef.current) {
                    durationIntervalRef.current = setInterval(() => setCallDuration(prev => prev + 1), 1000)
                }
            } else if (['disconnected', 'failed', 'closed'].includes(state)) {
                endCall(false)
            }
        }

        // ICE connection state (more reliable for connectivity)
        peer.oniceconnectionstatechange = () => {
            console.log('🧊 ICE state:', peer.iceConnectionState)
            if (peer.iceConnectionState === 'connected' || peer.iceConnectionState === 'completed') {
                setStatus('connected')
                if (!durationIntervalRef.current) {
                    durationIntervalRef.current = setInterval(() => setCallDuration(prev => prev + 1), 1000)
                }
            }
        }

        peerRef.current = peer
        return peer
    }, [otherUserId])

    // ─── Caller: create offer ───
    const initiateCall = useCallback(async () => {
        const stream = await getLocalStream()
        const peer = createPeer(stream)

        const offer = await peer.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: callType === 'video'
        })
        await peer.setLocalDescription(offer)

        const socket = socketService.getSocket()
        const userData = JSON.parse(localStorage.getItem('user') || '{}')
        socket?.emit('call_offer', {
            from: currentUserId,
            to: otherUserId,
            offer,
            callType,
            callerName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            callerAvatar: userData.avatarUrl || '',
        })

        console.log('📞 Call offer sent to', otherUserId)
    }, [getLocalStream, createPeer, currentUserId, otherUserId, callType])

    // ─── Callee: answer incoming offer ───
    const answerCall = useCallback(async (offer: RTCSessionDescriptionInit) => {
        const stream = await getLocalStream()
        const peer = createPeer(stream)

        await peer.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await peer.createAnswer()
        await peer.setLocalDescription(answer)

        const socket = socketService.getSocket()
        socket?.emit('call_answer', { to: otherUserId, answer })

        console.log('📞 Call answered, answer sent to', otherUserId)
    }, [getLocalStream, createPeer, otherUserId])

    // ─── Handle caller receiving the answer ───
    const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
        if (!peerRef.current) return
        try {
            if (peerRef.current.signalingState === 'have-local-offer') {
                await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer))
                console.log('📞 Remote description set from answer')
            }
        } catch (e) {
            console.error('Error setting remote description:', e)
        }
    }, [])

    // ─── Handle ICE candidates ───
    const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
        if (!peerRef.current) return
        try {
            await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (e) {
            console.error('ICE candidate error:', e)
        }
    }, [])

    // ─── Toggle mute ───
    const toggleMute = useCallback(() => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = isMuted // toggle: if currently muted, enable
            })
            setIsMuted(prev => !prev)
        }
    }, [localStream, isMuted])

    // ─── Toggle camera ───
    const toggleCamera = useCallback(() => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !isCameraOn
            })
            setIsCameraOn(prev => !prev)
        }
    }, [localStream, isCameraOn])

    // ─── End call ───
    const endCall = useCallback((notify = true) => {
        clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
        localStream?.getTracks().forEach(t => t.stop())
        peerRef.current?.close()
        peerRef.current = null

        if (notify) {
            const socket = socketService.getSocket()
            socket?.emit('call_end', { to: otherUserId, from: currentUserId })
        }
        setStatus('ended')
        setTimeout(onCallEnd, 600)
    }, [otherUserId, currentUserId, onCallEnd, localStream])

    const formattedDuration = `${String(Math.floor(callDuration / 60)).padStart(2, '0')}:${String(callDuration % 60).padStart(2, '0')}`

    // ─── Main lifecycle ───
    useEffect(() => {
        if (hasInitiated.current) return
        hasInitiated.current = true

        const socket = socketService.getSocket()
        if (!socket) {
            console.error('No socket connection for call')
            return
        }

        // Small delay to ensure video refs are attached by React
        const timer = setTimeout(() => {
            if (incomingOffer) {
                answerCall(incomingOffer)
            } else {
                initiateCall()
            }
        }, 100)

        socket.on('call_answered', ({ answer }: any) => {
            console.log('📞 Received call answer')
            handleAnswer(answer)
        })
        socket.on('call_ice_candidate', ({ candidate }: any) => handleIceCandidate(candidate))
        socket.on('call_rejected', () => {
            setStatus('ended')
            setTimeout(onCallEnd, 600)
        })
        socket.on('call_ended', () => {
            setStatus('ended')
            setTimeout(onCallEnd, 600)
        })

        return () => {
            clearTimeout(timer)
            socket.off('call_answered')
            socket.off('call_ice_candidate')
            socket.off('call_rejected')
            socket.off('call_ended')
            clearInterval(durationIntervalRef.current)
        }
    }, [])

    return {
        status,
        isMuted,
        isCameraOn,
        isSpeakerOn,
        setIsSpeakerOn,
        callDuration,
        formattedDuration,
        localVideoRef,
        remoteVideoRef,
        localStream,
        remoteStream,
        permissionDenied,
        toggleMute,
        toggleCamera,
        endCall: () => endCall(true),
    }
}
