import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../Home/Header'
import Sidebar from './Sidebar'
import MobileBottomNav from './MobileBottomNav'
import { useAlert } from '../hooks/useAlert'
import { API_BASE_URL } from '../config';

interface Event {
    _id: string
    title: string
    description: string
    date: string
    location: string
    imageUrl?: string
    attendees: {
        _id: string
        id?: string
        firstName: string
        lastName: string
        avatarUrl?: string
    }[]
    maxAttendees: number
    createdBy: {
        _id: string
        id?: string
        firstName: string
        lastName: string
        avatarUrl?: string
    }
}

// Module-level cache to persist across navigations and refreshes during glitches
let cachedEvents: Event[] | null = null

export default function Events({ session }: { session: any }) {
    const navigate = useNavigate()
    const [events, setEvents] = useState<Event[]>(cachedEvents || [])
    const [loading, setLoading] = useState(!cachedEvents)
    const [userRole, setUserRole] = useState('user')
    const { showAlert } = useAlert()

    useEffect(() => {
        fetchEvents()
        syncUserRole()
    }, [])

    const syncUserRole = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const cachedUser = JSON.parse(localStorage.getItem('user') || '{}')
            if (cachedUser.role) setUserRole(cachedUser.role)
            const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const freshUser = await res.json()
                setUserRole(freshUser.role || 'user')
                localStorage.setItem('user', JSON.stringify(freshUser))
            }
        } catch (err) { }
    }

    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${API_BASE_URL}/api/events`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setEvents(data)
                cachedEvents = data
            }
        } catch (err) {
            console.error('Error fetching events:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleJoinEvent = async (e: React.MouseEvent, eventId: string) => {
        e.stopPropagation()
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/join`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) {
                showAlert('You have joined the event!', 'success')
                fetchEvents()
            } else {
                showAlert(data.message || 'Failed to join event', 'error')
            }
        } catch (err) {
            showAlert('Something went wrong', 'error')
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="min-h-screen bg-[#090a1e] flex flex-col">
            <Header />
            <Sidebar />

            <div className="flex-1 lg:pl-64 flex flex-col">
                <main className="flex-1 pt-24 pb-24 px-4 sm:px-8 lg:px-12 xl:px-16 w-full max-w-[1600px] mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-8">
                        <div className="space-y-2">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
                                Experience <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">MatchChain</span>
                            </h1>
                            <p className="text-gray-500 text-xs sm:text-sm font-bold">
                                Exclusively curated gatherings for the on-chain elite.
                            </p>
                        </div>

                        {userRole === 'admin' && (
                            <button
                                onClick={() => navigate('/events/create')}
                                className="bg-white text-black font-black tracking-widest px-8 py-4 rounded-2xl hover:bg-gray-200 transition-all active:scale-95 text-xs shadow-2xl shadow-white/5 whitespace-nowrap"
                            >
                                Host an event
                            </button>
                        )}
                    </div>

                    {loading && events.length === 0 ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-24 bg-[#1a1a2e]/20 rounded-[2rem] border border-white/5 backdrop-blur-sm">
                            <div className="w-24 h-24 bg-purple-500/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-purple-500/10">
                                <svg className="w-12 h-12 text-purple-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-white text-2xl font-bold mb-3">No incoming signals</h3>
                            <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed font-medium">
                                We are curating the next generation of digital experiences. <br /> Check back soon for the convergence.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                            {events.map((event) => (
                                <div
                                    key={event._id}
                                    onClick={() => navigate(`/events/${event._id}`)}
                                    className="group relative bg-[#0d0e24] rounded-2xl overflow-hidden transition-all shadow-2xl cursor-pointer"
                                >
                                    {/* Banner Color / Image */}
                                    <div className="h-48 bg-gradient-to-br from-purple-900/40 to-[#0d0e24] relative overflow-hidden">
                                        {event.imageUrl ? (
                                            <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e24] via-transparent to-transparent opacity-60"></div>
                                        <div className="absolute top-4 left-4">
                                            <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                                                <p className="text-purple-400 text-[10px] font-bold">{formatDate(event.date).split(',')[0]}</p>
                                                <p className="text-white text-lg font-black tracking-tighter leading-none">{formatDate(event.date).split(',')[1].trim().split(' ')[1]}</p>
                                            </div>
                                        </div>
                                        <div className="absolute top-4 right-4 bg-purple-600 px-3 py-1 rounded-full text-[9px] font-black text-white tracking-tighter shadow-xl">
                                            {event.attendees.length} / {event.maxAttendees} Going
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-purple-400 transition-colors truncate">
                                                {event.title}
                                            </h3>
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-8 h-8 rounded-full border border-purple-500/30 overflow-hidden bg-purple-900/20 shadow-lg shadow-purple-500/10" title={`Hosted by ${event.createdBy?.firstName}`}>
                                                    {event.createdBy?.avatarUrl ? (
                                                        <img src={event.createdBy.avatarUrl} alt="Host" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-purple-400 font-bold">
                                                            {event.createdBy?.firstName?.[0] || 'H'}
                                                        </div>
                                                    )}
                                                </div>
                                                {(event.createdBy?._id === (session?.user?._id || session?.user?.id) || userRole === 'admin') && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/events/edit/${event._id}`) }}
                                                            className="text-[10px] font-bold text-purple-400 hover:text-white transition-colors bg-purple-500/10 px-2 py-0.5 rounded-md"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation()
                                                                if (window.confirm('Delete this event?')) {
                                                                    try {
                                                                        const token = localStorage.getItem('token')
                                                                        const res = await fetch(`${API_BASE_URL}/api/events/${event._id}`, {
                                                                            method: 'DELETE',
                                                                            headers: { 'Authorization': `Bearer ${token}` }
                                                                        })
                                                                        if (res.ok) {
                                                                            fetchEvents()
                                                                            showAlert('Event deleted', 'success')
                                                                        }
                                                                    } catch (err) { }
                                                                }
                                                            }}
                                                            className="text-[10px] font-bold text-red-500 hover:text-white transition-colors bg-red-500/10 px-2 py-0.5 rounded-md"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-gray-500 mb-4 text-xs font-bold">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {event.location}
                                        </div>

                                        <p className="text-gray-400 text-sm line-clamp-1 mb-6 leading-relaxed font-medium opacity-80">
                                            {event.description}
                                        </p>

                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex -space-x-3 overflow-hidden">
                                                {event.attendees.slice(0, 5).map((att, idx) => (
                                                    <div
                                                        key={att._id || idx}
                                                        className="w-10 h-10 rounded-full border-2 border-[#090a1e] bg-[#1a1c3a] flex items-center justify-center overflow-hidden relative group/pfp shadow-lg transition-transform hover:scale-110 hover:z-10"
                                                        title={`${att.firstName} ${att.lastName}`}
                                                    >
                                                        {att.avatarUrl ? (
                                                            <img
                                                                src={att.avatarUrl}
                                                                alt={att.firstName}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div className={`w-full h-full flex items-center justify-center text-[10px] text-purple-400 font-black bg-purple-500/10 ${att.avatarUrl ? 'hidden' : ''}`}>
                                                            {att.firstName?.[0] || 'A'}
                                                        </div>

                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/pfp:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                            <span className="text-[6px] text-white font-black uppercase text-center leading-none px-1">
                                                                {att.firstName}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {event.attendees.length > 5 && (
                                                    <div className="w-10 h-10 rounded-full border-2 border-[#090a1e] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-[10px] text-white font-black shadow-lg">
                                                        +{event.attendees.length - 5}
                                                    </div>
                                                )}
                                                {event.attendees.length === 0 && (
                                                    <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-full border border-white/10">
                                                        <div className="w-6 h-6 rounded-full border border-dashed border-gray-600 bg-transparent flex items-center justify-center text-[10px] text-gray-600">
                                                            ?
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 font-bold tracking-widest pr-1">No signals yet</span>
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={(e) => handleJoinEvent(e, event._id)}
                                                disabled={event.attendees.some(a => (a._id || a.id) === (session?.user?._id || session?.user?.id))}
                                                className={`flex-1 py-3.5 px-4 rounded-xl font-black text-[10px] tracking-widest transition-all active:scale-95 ${event.attendees.some(a => (a._id || a.id) === (session?.user?._id || session?.user?.id))
                                                    ? 'bg-green-500/10 text-green-500 border border-green-500/20 cursor-default opacity-80'
                                                    : 'bg-white text-black hover:bg-gray-200 shadow-xl shadow-white/5'
                                                    }`}
                                            >
                                                {event.attendees.some(a => (a._id || a.id) === (session?.user?._id || session?.user?.id)) ? '✓ Registered' : 'Join Event'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>

                <footer className="lg:hidden">
                    <MobileBottomNav />
                </footer>
            </div>
        </div>
    )
}
