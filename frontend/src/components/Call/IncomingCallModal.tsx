import { createPortal } from 'react-dom'
import { Phone, Video, PhoneOff, PhoneIncoming } from 'lucide-react'

interface IncomingCallModalProps {
    callType: 'phone' | 'video'
    callerName: string
    callerAvatar?: string
    onAccept: () => void
    onReject: () => void
}

export default function IncomingCallModal({ callType, callerName, callerAvatar, onAccept, onReject }: IncomingCallModalProps) {
    return createPortal(
        <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Card */}
            <div className="relative z-10 w-full max-w-sm bg-[#1a1a2e] border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-900/50 overflow-hidden animate-in slide-in-from-bottom-8 duration-400">
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />

                <div className="p-8 flex flex-col items-center gap-5">
                    {/* Call type badge */}
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
                        {callType === 'video'
                            ? <><Video className="w-3.5 h-3.5" /> Incoming Video Call</>
                            : <><PhoneIncoming className="w-3.5 h-3.5" /> Incoming Voice Call</>
                        }
                    </span>

                    {/* Avatar with ring animation */}
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-2 border-green-500/30 animate-ping absolute inset-0" style={{ animationDuration: '1.5s' }} />
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-green-500/70 shadow-2xl shadow-green-900/40 relative">
                            {callerAvatar ? (
                                <img src={callerAvatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-3xl font-black">
                                    {callerName?.charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Caller info */}
                    <div className="text-center">
                        <h2 className="text-white text-2xl font-black tracking-tight">{callerName}</h2>
                        <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1 animate-pulse">
                            is calling you...
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-8 mt-2">
                        {/* Reject */}
                        <button onClick={onReject} className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-90 flex items-center justify-center text-white shadow-xl shadow-red-900/40 transition-all">
                                <PhoneOff className="w-7 h-7" />
                            </div>
                            <span className="text-red-400 text-[10px] font-black uppercase tracking-widest">Decline</span>
                        </button>

                        {/* Accept */}
                        <button onClick={onAccept} className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-400 active:scale-90 flex items-center justify-center text-white shadow-xl shadow-green-900/40 transition-all">
                                {callType === 'video' ? <Video className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
                            </div>
                            <span className="text-green-400 text-[10px] font-black uppercase tracking-widest">Accept</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
