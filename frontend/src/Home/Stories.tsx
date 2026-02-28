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

interface StoriesProps {
  layout?: 'sidebar' | 'banner' | 'mobile'
}

// Module-level cache to persist across navigations and refreshes
let cachedStatuses: Status[] | null = null

export default function Stories({ layout = 'mobile' }: StoriesProps) {
  const [statuses, setStatuses] = useState<Status[]>(cachedStatuses || [])
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
        cachedStatuses = data
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

      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      })

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

  const groupedStatuses = statuses.reduce((acc: { [key: string]: Status[] }, status) => {
    const userId = status.user?._id
    if (!userId) return acc
    if (!acc[userId]) acc[userId] = []
    acc[userId].push(status)
    return acc
  }, {})

  const usersWithStatus = Object.values(groupedStatuses).map(userStatuses => ({
    user: userStatuses[0].user,
    items: userStatuses
  }))

  if (layout === 'banner') {
    return null
  }

  const isSidebar = layout === 'sidebar'

  return (
    <div className={`w-full ${isSidebar ? 'px-0' : 'px-4 mb-6'} select-none`}>
      <div className={`flex gap-3 overflow-x-auto scrollbar-hide py-2 ${isSidebar ? 'pb-4' : 'justify-start items-start'}`}>
        {/* Create Button */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`${isSidebar ? 'w-12 h-12' : 'w-16 h-16'} rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 active:scale-95 transition-all overflow-hidden hover:brightness-110 relative group`}
          >
            <div className="absolute inset-[2px] bg-[#090a1e] rounded-full flex items-center justify-center group-hover:bg-transparent transition-colors">
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className={`${isSidebar ? 'w-6 h-6' : 'w-8 h-8'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              )}
            </div>
          </button>
          <span className={`text-[9px] font-black ${isSidebar ? 'text-gray-500' : 'text-gray-400'} tracking-[0.15em]`}>Create</span>
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
          <div key={user._id} className="flex flex-col items-center gap-2 flex-shrink-0 animate-in fade-in slide-in-from-right-4 duration-500">
            <button
              onClick={() => setViewingStatus(items)}
              className={`${isSidebar ? 'w-12 h-12' : 'w-16 h-16'} rounded-full p-[2px] bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 shadow-xl active:scale-95 transition-all hover:p-[3px]`}
            >
              <div className="w-full h-full rounded-full border-2 border-[#090a1e] overflow-hidden bg-[#1a1a2e]">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-black text-xs">
                    {user.firstName?.charAt(0) || '?'}
                  </div>
                )}
              </div>
            </button>
            <span className={`text-[9px] font-black ${isSidebar ? 'text-gray-500' : 'text-white'} truncate ${isSidebar ? 'w-12' : 'w-16'} text-center tracking-tight`}>
              {user.firstName}
            </span>
          </div>
        ))}
      </div>

      {viewingStatus && <StatusViewer statuses={viewingStatus} onClose={() => setViewingStatus(null)} />}
    </div>
  )
}

function StatusViewer({ statuses, onClose }: { statuses: Status[], onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)
  const timerRef = useRef<any>(null)

  // Prefetch next image
  useEffect(() => {
    if (currentIndex < statuses.length - 1) {
      const img = new Image()
      img.src = statuses[currentIndex + 1].imageUrl
    }
  }, [currentIndex, statuses])

  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setImageLoaded(false)
      setCurrentIndex(prev => prev + 1)
    } else {
      onClose()
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setImageLoaded(false)
      setCurrentIndex(prev => prev - 1)
    }
  }

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (imageLoaded) {
      timerRef.current = setTimeout(handleNext, 5000)
    }
    return () => clearTimeout(timerRef.current)
  }, [currentIndex, imageLoaded])

  const currentStatus = statuses[currentIndex]
  if (!currentStatus) return null

  return createPortal(
    <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
      {/* Immersive Background */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
        <img
          src={currentStatus.imageUrl}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover scale-110 blur-3xl opacity-30 transition-opacity duration-1000 ${imageLoaded ? 'opacity-30' : 'opacity-0'}`}
        />

        {/* Main Content Container (Mobile-first Aspect Ratio) */}
        <div className="relative z-30 w-full max-w-lg h-full max-h-[90vh] md:max-h-[800px] flex items-center justify-center px-2">
          <img
            src={currentStatus.imageUrl}
            alt=""
            onLoad={() => setImageLoaded(true)}
            onError={handleNext}
            className={`max-w-full max-h-full rounded-2xl md:rounded-3xl object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-500 ${imageLoaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          />
        </div>
      </div>

      {/* Progress Bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-40 max-w-xl mx-auto">
        {statuses.map((_, i) => (
          <div key={i} className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-md">
            <div
              className={`h-full bg-white transition-all ease-linear ${i < currentIndex ? 'w-full' : i === currentIndex && imageLoaded ? 'w-full' : 'w-0'}`}
              style={{ transitionDuration: i === currentIndex && imageLoaded ? '5000ms' : '0ms' }}
            />
          </div>
        ))}
      </div>

      {/* Header Overlay */}
      <div className="absolute top-10 left-4 right-4 flex items-center justify-between z-40 max-w-xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/20">
            {currentStatus.user.avatarUrl ? (
              <img src={currentStatus.user.avatarUrl} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white font-black">
                {currentStatus.user?.firstName?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <div>
            <p className="text-white font-black text-sm tracking-tight italic drop-shadow-md">
              {currentStatus.user.firstName} {currentStatus.user.lastName}
            </p>
            <p className="text-white/50 text-[9px] font-bold tracking-[0.2em]">
              {new Date(currentStatus.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/40 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation Areas */}
      <div className="absolute inset-0 flex z-20">
        <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev} />
        <div className="w-2/3 h-full cursor-pointer" onClick={handleNext} />
      </div>
    </div>,
    document.body
  )
}
