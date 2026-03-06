import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAlert } from '../hooks/useAlert'
import { API_BASE_URL } from '../config';
import { safeLocalStorageSet } from '../utils/storageUtils';

interface Attendee {
    _id: string
    firstName: string
    lastName: string
    avatarUrl?: string
}

interface EventData {
    _id: string
    title: string
    description: string
    date: string
    endDate?: string
    location: string
    imageUrl?: string
    maxAttendees: number
    attendees: Attendee[]
    createdBy: {
        _id: string
        firstName: string
        lastName: string
        avatarUrl?: string
    }
}

export default function EventDetails({ session }: { session: any }) {
    const { id } = useParams()
    const navigate = useNavigate()
    const { showAlert } = useAlert()
    const [event, setEvent] = useState<EventData | null>(() => {
        const cached = localStorage.getItem(`event_detail_${id}`)
        return cached ? JSON.parse(cached) : null
    })
    const [loading, setLoading] = useState(() => !localStorage.getItem(`event_detail_${id}`))
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (id) {
            fetchEvent(!!event)
        }
    }, [id])

    const fetchEvent = async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true)
            setError(null)
            const token = localStorage.getItem('token')
            const res = await fetch(`${API_BASE_URL}/api/events/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                const data = await res.json()
                setEvent(data)
                safeLocalStorageSet(`event_detail_${id}`, data);
            } else {
                const errData = await res.json().catch(() => ({}))
                setError(errData.message || 'Event not found')
                if (!isSilent) showAlert(errData.message || 'Event not found', 'error')
            }
        } catch (err) {
            if (!isSilent) {
                setError('Something went wrong. Please check your connection.')
                showAlert('Something went wrong', 'error')
            }
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr)
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        } catch (e) { return 'Invalid Date' }
    }

    const formatTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr)
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
        } catch (e) { return 'Invalid Time' }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-10 h-10 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                <p className="text-gray-500 text-xs font-bold tracking-widest">Loading convergence...</p>
            </div>
        )
    }

    if (error || !event) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                    <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">Signal Lost</h2>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto font-medium">
                        {error || "The event you are looking for does not exist or has been moved to a different coordinate."}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/events')}
                    className="bg-white text-black px-8 py-3 rounded-xl text-xs font-black tracking-widest hover:bg-gray-200 transition-all active:scale-95 shadow-xl shadow-white/5"
                >
                    Return to feed
                </button>
            </div>
        )
    }

    const isOwner = event.createdBy?._id === (session?.user?._id || session?.user?.id)

    return (
        <div className="flex-1 pt-24 pb-24 px-6 sm:px-12 lg:px-20 max-w-5xl mx-auto w-full">
            {/* Header Section */}
            <div className="flex flex-col gap-8 mb-16">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 tracking-widest capitalize">
                        <span className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('/events')}>Events</span>
                        <span className="text-gray-700">/</span>
                        <span className="text-purple-400">{isOwner ? 'Hosting' : 'Attending'}</span>
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tight leading-tight">
                        {event.title}
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {isOwner && (
                        <button
                            onClick={() => navigate(`/events/edit/${event._id}`)}
                            className="h-11 px-8 bg-purple-600 text-white hover:bg-purple-500 rounded-xl text-xs font-black tracking-widest transition-all shadow-lg shadow-purple-500/20"
                        >
                            Manage
                        </button>
                    )}
                </div>
            </div>

            {/* Main Info Section */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 lg:gap-24">
                <div className="space-y-12 sm:space-y-16">
                    {/* About Section */}
                    <section className="space-y-6">
                        <h3 className="text-[11px] font-bold text-gray-500 border-b border-white/5 pb-2">About the experience</h3>
                        <p className="text-base sm:text-lg text-gray-300 leading-relaxed font-medium">
                            {event.description}
                        </p>
                    </section>

                    {/* Attending Section */}
                    <section className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[11px] font-bold text-gray-500">Convergence tracking</h3>
                            <span className="text-xs text-purple-400 font-bold">{event.attendees?.length || 0} / {event.maxAttendees} Going</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, ((event.attendees?.length || 0) / event.maxAttendees) * 100)}%` }}
                            ></div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        <th className="pb-4 pr-4 w-16">Profile</th>
                                        <th className="pb-4 pr-4">Member</th>
                                        <th className="pb-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {event.attendees?.map((attendee) => (
                                        <tr key={attendee._id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="py-4 pr-4">
                                                <div className="w-10 h-10 rounded-full border border-purple-500/20 overflow-hidden bg-white/5">
                                                    {attendee.avatarUrl ? (
                                                        <img src={attendee.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs text-purple-400 font-bold">
                                                            {attendee.firstName?.[0] || 'A'}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 pr-4">
                                                <p className="text-white text-sm font-bold">{attendee.firstName} {attendee.lastName}</p>
                                                <p className="text-gray-500 text-[10px]">Verified Node</p>
                                            </td>
                                            <td className="py-4 text-right">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                    Confirmed
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-8 lg:gap-12">
                        <div className="space-y-2">
                            <p className="text-[11px] font-bold text-gray-500">Temporal coordinate</p>
                            <p className="text-white font-bold text-sm">{formatDate(event.date)}</p>
                            <p className="text-gray-400 text-xs font-medium">{formatTime(event.date)} GMT+01:00</p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[11px] font-bold text-gray-500">Spatial coordinate</p>
                            <p className="text-white font-bold text-sm leading-snug">{event.location}</p>
                            <button className="text-purple-400 text-[10px] font-bold hover:text-purple-300 transition-colors">View on maps</button>
                        </div>

                        <div className="pt-0 lg:pt-8 lg:border-t lg:border-white/5 space-y-6 sm:col-span-2 lg:col-span-1">
                            <p className="text-[11px] font-bold text-gray-500">Architect</p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white/5 overflow-hidden ring-2 ring-purple-500/20">
                                    {event.createdBy?.avatarUrl ? (
                                        <img src={event.createdBy.avatarUrl} alt="Host" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-purple-400 font-black">
                                            {event.createdBy?.firstName?.[0] || 'H'}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-white text-xs font-bold leading-tight truncate">{event.createdBy?.firstName} {event.createdBy?.lastName}</p>
                                    <button className="text-[10px] text-purple-400 font-bold hover:text-purple-300">Contact</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
