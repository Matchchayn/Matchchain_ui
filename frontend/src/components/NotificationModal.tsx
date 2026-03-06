import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { API_BASE_URL } from '../config';
import { useAlert } from '../hooks/useAlert';

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
    const { showAlert, showConfirm } = useAlert()
    const [notifications, setNotifications] = useState<Notification[]>(cachedNotifications || [])
    const [loading, setLoading] = useState(!cachedNotifications)

    useEffect(() => {
        if (isOpen) {
            fetchNotifications()
        }
    }, [isOpen])

    const fetchNotifications = async () => {
        try {
            // Only show spinner if we have absolutely nothing to show
            if (!cachedNotifications || cachedNotifications.length === 0) {
                setLoading(true)
            }

            const res = await fetch(`${API_BASE_URL}/api/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!res.ok) {
                setLoading(false)
                return
            }

            const data = await res.json()
            const valid = data.filter((n: any) => n.sender && n.sender.firstName)

            setNotifications(valid)
            cachedNotifications = valid

            // Mark as read in background
            if (valid.length > 0 && valid.some((n: any) => !n.isRead)) {
                fetch(`${API_BASE_URL}/api/notifications/read`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => { })
            }
        } catch (err) {
            // Silently fail if we have cache, otherwise log
            if (!cachedNotifications) console.error('Error in fetchNotifications:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            const res = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (res.ok) {
                const updated = notifications.filter(n => n._id !== id)
                setNotifications(updated)
                cachedNotifications = updated
            } else {
                const responseData = await res.json().catch(() => ({}));
                const errorMsg = responseData.message || 'Server error';
                showAlert(`Failed to delete: ${errorMsg}`, 'error');
            }
        } catch (err: any) {
            showAlert(`Network error: ${err.message}`, 'error');
        }
    }

    const handleClearAll = async () => {
        const confirmed = await showConfirm('Clear all notifications?', 'This action cannot be undone.', 'Clear All');
        if (!confirmed) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/notifications`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                setNotifications([]);
                cachedNotifications = [];
                showAlert('All notifications cleared', 'success');
            } else {
                showAlert('Failed to clear notifications', 'error');
            }
        } catch (err) {
            console.error('Error clearing notifications:', err);
            showAlert('A network error occurred', 'error');
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
                <div className="p-4 border-b border-purple-500/20 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-white font-bold text-lg">Notifications</h3>
                        {notifications.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="text-[10px] text-purple-400 hover:text-purple-300 font-bold uppercase tracking-widest bg-purple-500/10 px-2 py-1 rounded-md transition-all active:scale-95"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors flex-shrink-0">
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
                                <div key={notif._id} className={`p-4 flex items-start gap-3 hover:bg-purple-500/5 transition-colors group ${!notif.isRead ? 'bg-purple-500/10' : ''}`}>
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
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-gray-500 text-[10px] uppercase tracking-wider font-medium italic">
                                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            <button
                                                onClick={(e) => handleDeleteNotification(notif._id, e)}
                                                className="opacity-40 group-hover:opacity-100 p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded transition-all cursor-pointer z-[170]"
                                                title="Delete notification"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
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
