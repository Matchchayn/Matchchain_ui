import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Header from '../Home/Header'
import Sidebar from './Sidebar'
import MobileBottomNav from './MobileBottomNav'
import { useAlert } from '../hooks/useAlert'
import { API_BASE_URL } from '../config';

export default function CreateEvent({ }: { session?: any }) {
    const navigate = useNavigate()
    const { id } = useParams() // Check if we're in edit mode
    const isEditMode = Boolean(id)
    const { showAlert } = useAlert()
    const [loading, setLoading] = useState(false)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        location: '',
        maxAttendees: 100,
        imageUrl: ''
    })

    useEffect(() => {
        if (isEditMode && id) {
            fetchEventData()
        }
    }, [isEditMode, id])

    const fetchEventData = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${API_BASE_URL}/api/events/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()

                const start = new Date(data.date)
                const end = data.endDate ? new Date(data.endDate) : null

                setFormData({
                    title: data.title,
                    description: data.description,
                    startDate: start.toISOString().split('T')[0],
                    startTime: start.toTimeString().split(' ')[0].slice(0, 5),
                    endDate: end ? end.toISOString().split('T')[0] : '',
                    endTime: end ? end.toTimeString().split(' ')[0].slice(0, 5) : '',
                    location: data.location,
                    maxAttendees: data.maxAttendees,
                    imageUrl: data.imageUrl || ''
                })
                setImagePreview(data.imageUrl || null)
            }
        } catch (err) {
            console.error('Error fetching event data:', err)
            showAlert('Failed to load event data', 'error')
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = () => {
            setImagePreview(reader.result as string)
            setFormData({ ...formData, imageUrl: reader.result as string })
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setLoading(true)
            const token = localStorage.getItem('token')

            // Combine date and time for the backend
            const eventDate = new Date(`${formData.startDate}T${formData.startTime}`)
            const eventEndDate = (formData.endDate && formData.endTime) ? new Date(`${formData.endDate}T${formData.endTime}`) : undefined

            const res = await fetch(isEditMode ? `${API_BASE_URL}/api/events/${id}` : `${API_BASE_URL}/api/events`, {
                method: isEditMode ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    date: eventDate,
                    endDate: eventEndDate,
                    location: formData.location,
                    maxAttendees: formData.maxAttendees,
                    imageUrl: formData.imageUrl
                })
            })

            if (res.ok) {
                showAlert(isEditMode ? 'Event updated successfully!' : 'Event created successfully!', 'success')
                navigate('/events')
            } else {
                const data = await res.json()
                showAlert(data.message || 'Failed to create event', 'error')
            }
        } catch (err) {
            showAlert('Something went wrong', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#090a1e] flex flex-col">
            <Header />
            <Sidebar />

            <div className="flex-1 lg:pl-64 flex flex-col">
                <main className="flex-1 pt-24 pb-24 px-4 sm:px-8 lg:px-12 xl:px-16 w-full max-w-[1200px] mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-12 border-b border-white/5 pb-8">
                        <button
                            onClick={() => navigate('/events')}
                            className="p-2 hover:bg-white/5 rounded-full transition-colors group"
                        >
                            <svg className="w-6 h-6 text-gray-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="text-3xl font-black text-white italic tracking-tight hover:text-purple-400 transition-colors cursor-default">
                            {isEditMode ? 'Edit' : 'Host an'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Event</span>
                        </h1>
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        {/* Left: Image Selection */}
                        <div className="lg:col-span-5 space-y-6">
                            <label className="block group cursor-pointer">
                                <div className={`aspect-square rounded-[2.5rem] overflow-hidden transition-all duration-300 flex flex-col items-center justify-center relative ${imagePreview ? 'shadow-2xl shadow-purple-500/10' : 'bg-white/5'}`}>
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 p-8 text-center">
                                            <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-white font-bold mb-1">Upload Event Banner</p>
                                                <p className="text-gray-500 text-xs">Recommend 1080x1080px</p>
                                            </div>
                                        </div>
                                    )}
                                    <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
                                </div>
                            </label>
                        </div>

                        {/* Right: Form Details */}
                        <div className="lg:col-span-7 space-y-8">
                            {/* Event Name */}
                            <div>
                                <input
                                    type="text"
                                    placeholder="Event Name"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-transparent border-none p-0 text-5xl sm:text-6xl font-black text-white placeholder-white/20 focus:ring-0 italic tracking-tighter"
                                    required
                                />
                            </div>

                            {/* Date-Time Blocks */}
                            <div className="bg-white/5 rounded-3xl p-6 space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-gray-600 mb-1"></div>
                                        <div className="w-0.5 h-12 bg-gray-800"></div>
                                        <div className="w-2 h-2 rounded-full border border-gray-600"></div>
                                    </div>

                                    <div className="flex-1 space-y-6">
                                        <div className="flex flex-wrap items-center gap-4">
                                            <span className="text-gray-400 font-bold text-sm w-12">Start</span>
                                            <input
                                                type="date"
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                                className="bg-white/10 border-none rounded-xl px-4 py-2 text-white text-sm focus:ring-purple-500"
                                                required
                                            />
                                            <input
                                                type="time"
                                                value={formData.startTime}
                                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                                className="bg-white/10 border-none rounded-xl px-4 py-2 text-white text-sm focus:ring-purple-500"
                                                required
                                            />
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <span className="text-gray-400 font-bold text-sm w-12">End</span>
                                            <input
                                                type="date"
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                                className="bg-white/10 border-none rounded-xl px-4 py-2 text-white text-sm focus:ring-purple-500"
                                            />
                                            <input
                                                type="time"
                                                value={formData.endTime}
                                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                                className="bg-white/10 border-none rounded-xl px-4 py-2 text-white text-sm focus:ring-purple-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="hidden sm:flex flex-col items-center justify-center p-4 text-center">
                                        <svg className="w-6 h-6 text-gray-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9-3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                        <p className="text-[10px] text-gray-500 font-bold tracking-widest">GMT+01:00</p>
                                    </div>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="bg-white/5 rounded-3xl p-6 flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-2xl bg-purple-600/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Add Event Location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 text-base"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="bg-white/5 rounded-3xl p-6 flex items-start gap-4 group">
                                <div className="w-10 h-10 rounded-2xl bg-pink-600/10 flex items-center justify-center group-hover:scale-110 transition-transform mt-1">
                                    <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                    </svg>
                                </div>
                                <textarea
                                    placeholder="Add Description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 text-base resize-none"
                                    required
                                />
                            </div>

                            {/* Event Options */}
                            <div className="space-y-4">
                                <p className="text-gray-500 text-xs font-black tracking-wider px-2">Event Options</p>
                                <div className="bg-white/5 rounded-3xl p-6 flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-9 h-9 rounded-xl bg-green-600/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <span className="text-gray-400 font-bold text-sm">Capacity</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={formData.maxAttendees}
                                            onChange={(e) => setFormData({ ...formData, maxAttendees: parseInt(e.target.value) })}
                                            className="bg-transparent border-none text-white text-right font-black text-sm focus:ring-0 w-20 p-0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black rounded-3xl transition-all active:scale-[0.98] shadow-2xl shadow-purple-500/20 disabled:opacity-50"
                                >
                                    {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Event')}
                                </button>

                                {isEditMode && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
                                                try {
                                                    setLoading(true)
                                                    const token = localStorage.getItem('token')
                                                    const res = await fetch(`${API_BASE_URL}/api/events/${id}`, {
                                                        method: 'DELETE',
                                                        headers: { 'Authorization': `Bearer ${token}` }
                                                    })
                                                    if (res.ok) {
                                                        showAlert('Event deleted successfully', 'success')
                                                        navigate('/events')
                                                    } else {
                                                        showAlert('Failed to delete event', 'error')
                                                    }
                                                } catch (err) {
                                                    showAlert('Something went wrong', 'error')
                                                } finally {
                                                    setLoading(false)
                                                }
                                            }
                                        }}
                                        disabled={loading}
                                        className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-2xl transition-all active:scale-[0.98] border border-red-500/20 disabled:opacity-50"
                                    >
                                        Delete Event
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </main>

                <footer className="lg:hidden">
                    <MobileBottomNav />
                </footer>
            </div>
        </div>
    )
}
