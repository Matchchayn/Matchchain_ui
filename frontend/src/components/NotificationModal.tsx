import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { API_BASE_URL } from '../config';

interface Notification {
    _id: string
    type: 'like' | 'match' | 'message'
    isRead: boolean
    sender: {
        firstName: string
        lastName: string
        avatarUrl: string | null
    }
    createdAt: string
}

interface NotificationModalProps {
    isOpen: boolean
    onClose: () => void
    token: string
}

// Module-level cache for instant display
let cachedNotifications: Notification[] | null = null

export default function NotificationModal({ isOpen, onClose, token }: NotificationModalProps) {
    const [notifications, setNotifications] = useState<Notification[]>(cachedNotifications || [])
    const [loading, setLoading] = useState(!cachedNotifications)

    useEffect(() => {
        if (isOpen) {
            fetchNotifications()
        }
    }, [isOpen])

    const fetchNotifications = async () => {
        try {
            if (!cachedNotifications) setLoading(true)
            const res = await fetch(`${API_BASE_URL}/api/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!res.ok) {
                console.error(`Notification API error (${res.status})`)
                setLoading(false)
                return
            }

            const data = await res.json()
            // Filter out notifications where sender was deleted
            const valid = data.filter((n: any) => n.sender && n.sender.firstName)
            setNotifications(valid)
            cachedNotifications = valid

            // Mark as read
            if (valid.length > 0 && valid.some((n: any) => !n.isRead)) {
                fetch(`${API_BASE_URL}/api/notifications/read`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => { })
            }
        } catch (err) {
            console.error('Error in fetchNotifications:', err)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[150] bg-black/40"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 w-[calc(100vw-2rem)] sm:w-96 z-[160] bg-[#1a1a2e] border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-right-4 fade-in duration-300"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-purple-500/20 flex items-center justify-between">
                    <h3 className="text-white font-bold text-lg">Notifications</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="p-10 flex flex-col items-center justify-center">
                            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-400 text-sm">Syncing alerts...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-10 text-center">
                            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-purple-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <p className="text-gray-400 font-medium">No new alerts</p>
                            <p className="text-gray-500 text-xs mt-1">We'll notify you when someone likes you!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-purple-500/10">
                            {notifications.map((notif) => (
                                <div key={notif._id} className={`p-4 flex items-start gap-3 hover:bg-purple-500/5 transition-colors ${!notif.isRead ? 'bg-purple-500/10' : ''}`}>
                                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                                        {notif.sender.avatarUrl ? (
                                            <img src={notif.sender.avatarUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                {notif.sender?.firstName?.charAt(0) || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm">
                                            <span className="font-bold">{notif.sender.firstName}</span>
                                            {notif.type === 'like' && ' liked your profile.'}
                                            {notif.type === 'match' && " It's a match! Send a message now. 💖"}
                                            {notif.type === 'message' && ' sent you a message.'}
                                        </p>
                                        <p className="text-gray-500 text-[10px] uppercase tracking-wider mt-1 font-medium italic">
                                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    {!notif.isRead && (
                                        <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-purple-500/20 text-center">
                    <button onClick={onClose} className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95">
                        Close
                    </button>
                </div>
            </div>
        </>,
        document.body
    )
}
