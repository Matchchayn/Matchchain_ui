import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { API_BASE_URL } from '../config';

interface StatusUser {
    _id: string
    firstName: string
    lastName: string
    avatarUrl: string | null
}

interface Status {
    _id: string
    user: StatusUser
    imageUrl: string
    createdAt: string
}

export default function StatusTray() {
    const [statuses, setStatuses] = useState<Status[]>([])
    const [uploading, setUploading] = useState(false)
    const [viewingStatus, setViewingStatus] = useState<Status[] | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const token = localStorage.getItem('token')

    useEffect(() => {
        fetchStatuses()
    }, [])

    const fetchStatuses = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/status/feed`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setStatuses(data)
            }
        } catch (err) {
            console.error('Error fetching statuses:', err)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !token) return

        try {
            setUploading(true)
            // 1. Get presigned URL
            const urlRes = await fetch(`${API_BASE_URL}/api/media/presigned-url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type
                })
            })
            const { uploadUrl, publicUrl } = await urlRes.json()

            // 2. Upload to R2
            await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type }
            })

            // 3. Save to Status API
            const saveRes = await fetch(`${API_BASE_URL}/api/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ imageUrl: publicUrl })
            })

            if (saveRes.ok) {
                fetchStatuses()
            }
        } catch (err) {
            console.error('Status upload failed:', err)
        } finally {
            setUploading(false)
        }
    }

    // Group statuses by user
    const groupedStatuses = statuses.reduce((acc: { [key: string]: Status[] }, status) => {
        const userId = status.user._id
        if (!acc[userId]) acc[userId] = []
        acc[userId].push(status)
        return acc
    }, {})

    const usersWithStatus = Object.values(groupedStatuses).map(userStatuses => ({
        user: userStatuses[0].user,
        items: userStatuses
    }))

    return (
        <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide px-4 pt-4">
            {/* Create Button */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5 shadow-lg shadow-purple-500/20 active:scale-95 transition-transform overflow-hidden group"
                >
                    <div className="w-full h-full rounded-full bg-[#0a0a1f] flex items-center justify-center border-2 border-[#0a0a1f] group-hover:bg-transparent transition-colors">
                        {uploading ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        )}
                    </div>
                </button>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Create</span>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*"
                />
            </div>

            {/* Status List */}
            {usersWithStatus.map(({ user, items }) => (
                <div key={user._id} className="flex flex-col items-center gap-2 flex-shrink-0">
                    <button
                        onClick={() => setViewingStatus(items)}
                        className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 shadow-lg active:scale-95 transition-transform"
                    >
                        <div className="w-full h-full rounded-full border-2 border-[#0a0a1f] overflow-hidden">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white font-bold text-xl">
                                    {user.firstName.charAt(0)}
                                </div>
                            )}
                        </div>
                    </button>
                    <span className="text-[10px] font-bold text-white truncate w-16 text-center">
                        {user.firstName}
                    </span>
                </div>
            ))}

            {/* Status Viewer Modal */}
            {viewingStatus && <StatusViewer statuses={viewingStatus} onClose={() => setViewingStatus(null)} />}
        </div>
    )
}

function StatusViewer({ statuses, onClose }: { statuses: Status[], onClose: () => void }) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const timerRef = useRef<any>(null)

    useEffect(() => {
        startTimer()
        return () => clearTimeout(timerRef.current)
    }, [currentIndex])

    const startTimer = () => {
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
            if (currentIndex < statuses.length - 1) {
                setCurrentIndex(prev => prev + 1)
            } else {
                onClose()
            }
        }, 5000) // 5 seconds per status
    }

    const currentStatus = statuses[currentIndex]

    return createPortal(
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
            {/* Progress Bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
                {statuses.map((_, i) => (
                    <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-white transition-all duration-[5000ms] ease-linear ${i < currentIndex ? 'w-full' : i === currentIndex ? 'w-full' : 'w-0'}`}
                            style={{ transitionDuration: i === currentIndex ? '5000ms' : '0ms' }}
                        />
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="absolute top-10 left-4 right-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <img src={currentStatus.user.avatarUrl || ''} className="w-10 h-10 rounded-full border border-white/20" alt="" />
                    <div>
                        <p className="text-white font-bold">{currentStatus.user.firstName} {currentStatus.user.lastName}</p>
                        <p className="text-white/60 text-xs italic">
                            {new Date(currentStatus.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 text-white/80 hover:text-white">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Image */}
            <img
                src={currentStatus.imageUrl}
                alt=""
                className="max-h-screen w-full object-contain"
            />

            {/* Navigation Helpers */}
            <div className="absolute inset-0 flex">
                <div className="flex-1" onClick={() => currentIndex > 0 ? setCurrentIndex(prev => prev - 1) : null} />
                <div className="flex-1" onClick={() => currentIndex < statuses.length - 1 ? setCurrentIndex(prev => prev + 1) : onClose()} />
            </div>
        </div>,
        document.body
    )
}
