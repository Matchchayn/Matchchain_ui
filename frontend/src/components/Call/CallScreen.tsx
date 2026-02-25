import { createPortal } from 'react-dom'
import { useCallManager } from './useCallManager'
import {
    Mic, MicOff, Video, VideoOff,
    Volume2, VolumeX, PhoneOff,
    PhoneCall, PhoneIncoming, Camera
} from 'lucide-react'

interface CallScreenProps {
    callType: 'phone' | 'video'
    currentUserId: string
    otherUser: {
        id: string
        first_name: string
        last_name: string
        avatar_url?: string
    }
    onClose: () => void
    incomingOffer?: RTCSessionDescriptionInit
}

export default function CallScreen({ callType, currentUserId, otherUser, onClose, incomingOffer }: CallScreenProps) {
    const {
        status,
        isMuted,
        isCameraOn,
        isSpeakerOn,
        setIsSpeakerOn,
        formattedDuration,
        localVideoRef,
        remoteVideoRef,
        localStream,
        remoteStream,
        permissionDenied,
        toggleMute,
        toggleCamera,
        endCall,
    } = useCallManager({
        callType,
        currentUserId,
        otherUserId: otherUser.id,
        onCallEnd: onClose,
        incomingOffer,
    })

    const statusLabel = {
        calling: incomingOffer ? 'Answering...' : 'Calling...',
        ringing: 'Ringing...',
        connected: formattedDuration,
        ended: 'Call Ended',
        idle: ''
    }[status]

    const hasLocalVideo = localStream && localStream.getVideoTracks().length > 0 && localStream.getVideoTracks()[0].enabled
    const hasRemoteVideo = remoteStream && remoteStream.getVideoTracks().length > 0

    return createPortal(
        <div className="fixed inset-0 z-[500] flex flex-col bg-[#090a1e] animate-in fade-in duration-300">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-[#090a1e] to-[#090a1e] pointer-events-none" />

            {/* Permission denied banner */}
            {permissionDenied && (
                <div className="absolute top-0 left-0 right-0 z-50 bg-red-500/90 text-white text-center py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium">
                    <Camera className="w-4 h-4" />
                    Camera/microphone access was denied. Please allow access in your browser settings and refresh.
                </div>
            )}

            {/* Content */}
            <div className="relative z-20 flex flex-col h-full">
                {/* Top bar */}
                <div className="flex items-center justify-between p-4 sm:p-6 pt-8 sm:pt-12">
                    <span className="text-white/50 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        {callType === 'video'
                            ? <><Video className="w-3.5 h-3.5" /> Video Call</>
                            : <><PhoneCall className="w-3.5 h-3.5" /> Voice Call</>
                        }
                    </span>
                    <div className="flex items-center gap-2">
                        {status === 'connected' ? (
                            <>
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-green-400 text-xs font-bold uppercase tracking-widest">{formattedDuration}</span>
                            </>
                        ) : (
                            <span className="text-white/30 text-xs font-bold uppercase tracking-widest animate-pulse">{statusLabel}</span>
                        )}
                    </div>
                </div>

                {/* Center area */}
                {callType === 'video' ? (
                    /* ─── VIDEO CALL: Side-by-side equal frames ─── */
                    <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-4">
                        <div className="flex flex-row gap-3 sm:gap-4 w-full max-w-5xl h-full max-h-[70vh]">
                            {/* Remote user video (left) */}
                            <div className="flex-1 relative rounded-2xl overflow-hidden bg-[#1a1a2e] border border-purple-500/20 min-h-[200px]">
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className={`w-full h-full object-cover ${hasRemoteVideo && status === 'connected' ? 'opacity-100' : 'opacity-0'}`}
                                />
                                {/* Name label */}
                                <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5 z-10">
                                    {otherUser.avatar_url ? (
                                        <img src={otherUser.avatar_url} className="w-6 h-6 rounded-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                                            {otherUser.first_name?.charAt(0)}
                                        </div>
                                    )}
                                    <span className="text-white text-xs font-bold">{otherUser.first_name}</span>
                                </div>
                                {/* Placeholder when no remote video */}
                                {(!hasRemoteVideo || status !== 'connected') && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a2e]">
                                        <div className="relative mb-4">
                                            <div className="w-20 h-20 rounded-full border-2 border-purple-500/20 animate-ping absolute inset-0" style={{ animationDuration: '2s' }} />
                                            <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-purple-500/50 relative">
                                                {otherUser.avatar_url ? (
                                                    <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-2xl font-black">
                                                        {otherUser.first_name?.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-white font-bold text-sm">{otherUser.first_name} {otherUser.last_name}</p>
                                        <p className="text-purple-400 text-[10px] uppercase font-bold tracking-widest animate-pulse mt-1">
                                            {status === 'connected' ? 'Camera off' : statusLabel}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Local user video (right — you) */}
                            <div className="flex-1 relative rounded-2xl overflow-hidden bg-[#1a1a2e] border border-purple-500/20 min-h-[200px]">
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className={`w-full h-full object-cover ${hasLocalVideo ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                                />
                                {/* Camera off / permission denied overlay */}
                                {!hasLocalVideo && (
                                    <div className="absolute inset-0 bg-[#1a1a2e] flex flex-col items-center justify-center">
                                        {permissionDenied ? (
                                            <>
                                                <Camera className="w-10 h-10 text-red-400/60 mb-3" />
                                                <span className="text-red-400/80 text-xs font-bold uppercase tracking-widest text-center px-4">
                                                    Camera access denied
                                                </span>
                                                <span className="text-white/30 text-[10px] mt-1 text-center px-4">
                                                    Allow camera in browser settings
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <VideoOff className="w-10 h-10 text-purple-400/50 mb-2" />
                                                <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Camera Off</span>
                                            </>
                                        )}
                                    </div>
                                )}
                                {/* You label */}
                                <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5 z-10">
                                    <span className="text-white text-xs font-bold">You</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ─── VOICE CALL: Avatar + name centered ─── */
                    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full border-2 border-purple-500/20 animate-ping absolute inset-0" style={{ animationDuration: '2s' }} />
                            <div className="w-32 h-32 rounded-full border border-purple-500/10 animate-ping absolute inset-0" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500/60 shadow-2xl shadow-purple-900/60 relative">
                                {otherUser.avatar_url ? (
                                    <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-5xl font-black">
                                        {otherUser.first_name?.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-center">
                            <h2 className="text-white text-3xl font-black tracking-tight mb-1">
                                {otherUser.first_name} {otherUser.last_name}
                            </h2>
                            <p className={`text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 ${status === 'connected' ? 'text-green-400' : 'text-purple-400 animate-pulse'}`}>
                                {incomingOffer ? <PhoneIncoming className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />}
                                {statusLabel}
                            </p>
                        </div>
                    </div>
                )}

                {/* Bottom Controls */}
                <div className="p-6 sm:p-8 pb-10 sm:pb-14">
                    <div className="flex items-center justify-center gap-5 sm:gap-6 mb-6 sm:mb-8">
                        {/* Mute */}
                        <button onClick={toggleMute} className="flex flex-col items-center gap-2">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-white text-[#090a1e]' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                                {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
                            </div>
                            <span className="text-white/50 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                                {isMuted ? 'Unmute' : 'Mute'}
                            </span>
                        </button>

                        {/* Camera (video only) */}
                        {callType === 'video' && (
                            <button onClick={toggleCamera} className="flex flex-col items-center gap-2">
                                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${!isCameraOn ? 'bg-white text-[#090a1e]' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                                    {isCameraOn ? <Video className="w-5 h-5 sm:w-6 sm:h-6" /> : <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />}
                                </div>
                                <span className="text-white/50 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                                    {isCameraOn ? 'Camera' : 'No Cam'}
                                </span>
                            </button>
                        )}

                        {/* Speaker */}
                        <button onClick={() => setIsSpeakerOn(!isSpeakerOn)} className="flex flex-col items-center gap-2">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${!isSpeakerOn ? 'bg-white text-[#090a1e]' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                                {isSpeakerOn ? <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" /> : <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />}
                            </div>
                            <span className="text-white/50 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Speaker</span>
                        </button>
                    </div>

                    {/* End Call */}
                    <div className="flex justify-center">
                        <button
                            onClick={endCall}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-500 hover:bg-red-600 active:scale-90 flex items-center justify-center text-white shadow-2xl shadow-red-900/50 transition-all"
                        >
                            <PhoneOff className="w-7 h-7 sm:w-9 sm:h-9" />
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
