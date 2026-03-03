import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { API_BASE_URL } from '../config';
import { useAlert } from '../hooks/useAlert';

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
  text?: string
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
  const { showAlert } = useAlert()

  useEffect(() => {
    fetchStatuses()
  }, [])

  const fetchStatuses = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

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
    const token = localStorage.getItem('token')

    if (!file) return
    if (!token) {
      showAlert('Please login to upload status', 'error')
      return
    }

    try {
      setUploading(true)
      const promptResult = window.prompt('Add a caption to your status (optional):')
      const caption = promptResult || '' // Ensure it's never null (if cancelled)

      showAlert('Saving status to Matchchayn Database...', 'info')

      // Convert to Base64
      const reader = new FileReader()
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const base64String = await base64Promise as string

      const saveRes = await fetch(`${API_BASE_URL}/api/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ imageUrl: base64String, text: caption })
      })

      if (saveRes.ok) {
        showAlert('Status uploaded successfully', 'success')
        fetchStatuses()
      } else {
        const data = await saveRes.json()
        showAlert(data.message || 'Failed to save status', 'error')
      }
    } catch (err: any) {
      console.error('Status upload failed:', err)
      showAlert(err.message || 'Status upload failed', 'error')
    } finally {
      setUploading(false)
      // Clear file input
      if (fileInputRef.current) fileInputRef.current.value = ''
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
    user: (userStatuses as Status[])[0].user,
    items: userStatuses as Status[]
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
          <span className="text-white/60 text-[10px] font-bold uppercase tracking-tight">Post</span>
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
          <button
            key={user._id}
            onClick={() => setViewingStatus(items)}
            className="flex flex-col items-center gap-2 flex-shrink-0 group"
          >
            <div className={`${isSidebar ? 'w-12 h-12' : 'w-16 h-16'} rounded-full p-[2px] bg-gradient-to-tr from-purple-600 to-pink-500 group-active:scale-95 transition-all shadow-lg shadow-purple-500/10`}>
              <div className="w-full h-full rounded-full border-2 border-[#090a1e] overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.firstName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-purple-900/40 flex items-center justify-center">
                    <span className="text-white text-lg font-bold">{user.firstName[0]}</span>
                  </div>
                )}
              </div>
            </div>
            <span className="text-white text-[10px] font-medium truncate w-16 text-center">
              {user.firstName}
            </span>
          </button>
        ))}
      </div>

      {/* Viewer Modal */}
      {viewingStatus && createPortal(
        <StatusViewer
          items={viewingStatus}
          onClose={() => setViewingStatus(null)}
        />,
        document.body
      )}
    </div>
  )
}

function StatusViewer({ items, onClose }: { items: Status[], onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const current = items[index]

  useEffect(() => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (index < items.length - 1) {
            setIndex(i => i + 1)
          } else {
            onClose()
          }
          return 0
        }
        return p + 1
      })
    }, 50) // 5 seconds per status

    return () => clearInterval(interval)
  }, [index])

  return (
    <div className="fixed inset-0 z-[1000] bg-black flex items-center justify-center animate-in fade-in duration-300">
      <div className="relative w-full max-w-md h-full sm:h-[90vh] sm:rounded-2xl overflow-hidden bg-gray-900 shadow-2xl">
        {/* Progress Bars */}
        <div className="absolute top-4 left-4 right-4 z-50 flex gap-1.5">
          {items.map((_, i) => (
            <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{ width: `${i === index ? progress : (i < index ? 100 : 0)}%` }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 z-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
              {current.user.avatarUrl ? (
                <img src={current.user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-purple-600 flex items-center justify-center font-bold text-white">
                  {current.user.firstName[0]}
                </div>
              )}
            </div>
            <div>
              <p className="text-white font-bold text-sm shadow-black drop-shadow-lg">
                {current.user.firstName} {current.user.lastName}
              </p>
              <p className="text-white/60 text-[10px]">Just now</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Image */}
        <img src={current.imageUrl} alt="" className="w-full h-full object-contain" />

        {/* Caption */}
        {current.text && (
          <div className="absolute bottom-12 left-0 right-0 p-6 text-center z-50">
            <div className="inline-block bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 max-w-[80%]">
              <p className="text-white text-base font-medium leading-relaxed italic">
                "{current.text}"
              </p>
            </div>
          </div>
        )}

        {/* Tap areas for navigation */}
        <div className="absolute inset-x-0 inset-y-20 flex">
          <div className="flex-1 cursor-pointer" onClick={() => index > 0 && setIndex(i => i - 1)} />
          <div className="flex-1 cursor-pointer" onClick={() => index < items.length - 1 ? setIndex(i => i + 1) : onClose()} />
        </div>
      </div>
    </div>
  )
}
