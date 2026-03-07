import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { API_BASE_URL } from '../config';

import { useAlert } from '../hooks/useAlert';
import { storiesService } from '../utils/storiesService'
import type { Status } from '../utils/storiesService'

interface StoriesProps {
  layout?: 'sidebar' | 'banner' | 'mobile'
}


export default function Stories({ layout = 'mobile' }: StoriesProps) {
  const [statuses, setStatuses] = useState<Status[]>(storiesService.getStories())
  const [uploading, setUploading] = useState(false)
  const [viewingStatus, setViewingStatus] = useState<Status[] | null>(null)
  const [composer, setComposer] = useState<{ file: File; previewUrl: string } | null>(null)
  const [captionDraft, setCaptionDraft] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showAlert } = useAlert()

  useEffect(() => {
    fetchStatuses()
  }, [])

  const fetchStatuses = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const data = await storiesService.fetchStories(token)
      setStatuses(data)
    } catch (err: any) {
      console.error('Stories - Error:', err.message)
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
      // Open an in-app composer instead of using window.prompt (no "localhost says" dialog).
      const previewUrl = URL.createObjectURL(file)
      setCaptionDraft('')
      setComposer({ file, previewUrl })
    } catch (err: any) {
      console.error('Status upload failed:', err)
      showAlert(err.message || 'Status upload failed', 'error')
    } finally {
      // Clear file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const closeComposer = () => {
    if (composer?.previewUrl) URL.revokeObjectURL(composer.previewUrl)
    setComposer(null)
    setCaptionDraft('')
  }

  // Compress image client-side so upload finishes quickly (max 1024px, JPEG ~0.8).
  const compressForStatus = (file: File): Promise<{ blob: Blob; fileName: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (e) => {
        const img = new Image()
        img.src = (e.target?.result as string) ?? ''
        img.onload = () => {
          const MAX = 1024
          let w = img.width
          let h = img.height
          if (w > h && w > MAX) {
            h = (h * MAX) / w
            w = MAX
          } else if (h > MAX) {
            w = (w * MAX) / h
            h = MAX
          }
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          if (!ctx) return reject(new Error('Canvas not supported'))
          ctx.drawImage(img, 0, 0, w, h)
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('Compress failed'))
              resolve({ blob, fileName: `status-${Date.now()}.jpg` })
            },
            'image/jpeg',
            0.82
          )
        }
        img.onerror = () => reject(new Error('Image load failed'))
      }
      reader.onerror = () => reject(new Error('File read failed'))
    })
  }

  const submitStatus = async () => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (!composer?.file || !token || !userStr) return

    const caption = captionDraft.trim()
    setUploading(true)

    // Optimistic UI: show the new status immediately using the local preview URL.
    let optimisticId = `temp_${Date.now()}`
    try {
      const me = JSON.parse(userStr)
      const optimistic: Status = {
        _id: optimisticId,
        user: {
          _id: me._id || me.id,
          firstName: me.firstName || 'You',
          lastName: me.lastName || '',
          avatarUrl: me.avatarUrl || null,
        },
        imageUrl: composer.previewUrl,
        text: caption || undefined,
        createdAt: new Date().toISOString(),
      }

      const next = [optimistic, ...statuses]
      setStatuses(next)
      storiesService.setStories(next)

      // Compress image first so upload is fast
      const { blob, fileName } = await compressForStatus(composer.file)

      // 1) Get presigned URL for R2 upload
      const urlRes = await fetch(`${API_BASE_URL}/api/media/presigned-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileName,
          fileType: 'image/jpeg'
        })
      })
      if (!urlRes.ok) throw new Error('Failed to prepare upload')
      const { uploadUrl, publicUrl } = await urlRes.json()

      // 2) Upload compressed image to R2
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': 'image/jpeg' }
      })
      if (!putRes.ok) throw new Error('Upload failed')

      // 3) Save status record
      const saveRes = await fetch(`${API_BASE_URL}/api/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ imageUrl: publicUrl, ...(caption ? { text: caption } : {}) })
      })

      if (!saveRes.ok) {
        const data = await saveRes.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to save status')
      }

      // Refresh from server to replace optimistic item with real one
      await fetchStatuses()
      showAlert('Status posted', 'success')
    } catch (err: any) {
      // Roll back optimistic item
      const rolledBack = statuses.filter(s => s._id !== optimisticId)
      setStatuses(rolledBack)
      storiesService.setStories(rolledBack)
      console.error('Status upload failed:', err)
      showAlert(err.message || 'Status upload failed', 'error')
    } finally {
      setUploading(false)
      closeComposer()
    }
  }

  const groupedStatuses = statuses.reduce((acc: { [key: string]: Status[] }, status) => {
    // Robust userId check: try _id then id, handles populated or unpopulated
    const userId = (typeof status.user === 'object' && status.user !== null)
      ? (status.user._id || (status.user as any).id)
      : (status.user as unknown as string);

    if (!userId) {
      console.warn('Stories - Status item has no valid userId:', status);
      return acc;
    }

    if (!acc[userId]) acc[userId] = [];
    acc[userId].push(status);
    return acc;
  }, {});

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

      {/* Status Composer Modal */}
      {composer && createPortal(
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0b0c22] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <div className="text-white font-black tracking-widest text-xs">NEW STATUS</div>
              <button onClick={closeComposer} className="text-white/70 hover:text-white transition-colors px-2 py-1 text-sm">
                Close
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-black/40 border border-white/10">
                <img src={composer.previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-widest text-white/60">
                  CAPTION (OPTIONAL)
                </label>
                <textarea
                  value={captionDraft}
                  onChange={(e) => setCaptionDraft(e.target.value)}
                  placeholder="Add a caption…"
                  rows={2}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-purple-500/60 resize-none"
                />
              </div>

              <button
                onClick={submitStatus}
                disabled={uploading}
                className="w-full bg-white text-black font-black tracking-widest py-3 rounded-xl hover:bg-gray-200 transition-all active:scale-[0.99] disabled:opacity-60"
              >
                {uploading ? 'POSTING…' : 'POST'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

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
