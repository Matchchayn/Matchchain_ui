import React, { useState, useEffect } from 'react'
import RelaxConnectMatchCard from '../RelaxConnectMatchCard'
import onboardingstock from '../../assets/onboardingstock.jpg'
import { clearProfileCache } from '../../utils/userProfileService'

import { useAlert } from '../../hooks/useAlert'
import { API_BASE_URL } from '../../config';

interface MediaUploadProps {
  session: any
  onComplete: () => void
  onBack?: () => void
}

export default function MediaUpload({ session, onComplete, onBack }: MediaUploadProps) {
  const { showAlert } = useAlert()
  const [loading, setLoading] = useState(false)

  const [introVideo, setIntroVideo] = useState<File | null>(null)
  const [photo1, setPhoto1] = useState<File | null>(null)
  const [photo2, setPhoto2] = useState<File | null>(null)

  const [introVideoPrev, setIntroVideoPrev] = useState<string | null>(null)
  const [photo1Prev, setPhoto1Prev] = useState<string | null>(null)
  const [photo2Prev, setPhoto2Prev] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onBack) {
        onBack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBack])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'photo1' | 'photo2') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit file size (e.g., 20MB for video)
    if (type === 'video' && file.size > 20 * 1024 * 1024) {
      showAlert("Video file is too large. Please select a clip under 20MB.", 'warning')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      if (type === 'video') {
        setIntroVideo(file)
        setIntroVideoPrev(base64)
      } else if (type === 'photo1') {
        setPhoto1(file)
        setPhoto1Prev(base64)
      } else if (type === 'photo2') {
        setPhoto2(file)
        setPhoto2Prev(base64)
      }
    }
    reader.readAsDataURL(file)
  }

  const uploadToR2 = async (file: File) => {
    // 1. Get Presigned URL from our backend
    const response = await fetch(`${API_BASE_URL}/api/media/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.token}`
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type
      })
    });

    const { uploadUrl, publicUrl } = await response.json();
    if (!response.ok) throw new Error('Failed to get upload authorization');

    // 2. Upload directly to Cloudflare R2
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });

    if (!uploadResponse.ok) throw new Error('Failed to upload video to storage');

    return publicUrl;
  };

  // Convert File to base64 string for MongoDB storage
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    if (!photo1) {
      showAlert('Please upload at least a profile photo.', 'warning')
      return
    }

    try {
      setLoading(true)
      showAlert('Saving your photos... 📸', 'info')

      // Convert images to base64 for MongoDB (fast, small files)
      let avatarUrl = '';
      let secondaryPhotoUrl = '';
      let videoUrl = '';

      if (photo1) {
        avatarUrl = await fileToBase64(photo1);
      }
      if (photo2) {
        secondaryPhotoUrl = await fileToBase64(photo2);
      }

      // Only videos go to Cloudflare R2 (large files need edge storage)
      if (introVideo) {
        showAlert('Uploading video to the edge... 🎬', 'info')
        videoUrl = await uploadToR2(introVideo);
      }

      showAlert('Syncing with your profile... 🔗', 'info')

      // Save to MongoDB: images as base64, video as R2 URL
      const saveResponse = await fetch(`${API_BASE_URL}/api/user/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`
        },
        body: JSON.stringify({
          avatarUrl,
          secondaryPhotoUrl,
          videoUrl
        }),
      })

      if (!saveResponse.ok) throw new Error('Failed to finalize profile media');

      clearProfileCache()
      showAlert('Media uploaded successfully!', 'success')
      onComplete()
    } catch (error: any) {
      console.error('Upload Error:', error)
      if (error.message === 'Failed to fetch') {
        showAlert('Upload Failed: Likely a CORS policy issue on your R2 bucket. Please check your Cloudflare settings.', 'error')
      } else {
        showAlert(`Error: ${error.message}`, 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#090a1e] text-white">
      {/* Left Side - Image */}
      <div className="hidden lg:block lg:w-1/2 lg:flex-shrink-0 relative bg-[#090a1e]">
        <div className="relative w-full h-full overflow-hidden">
          <img
            src={onboardingstock}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          <RelaxConnectMatchCard />
        </div>
      </div>

      {/* Right Side - Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 min-h-screen bg-[#090a1e]">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/favicon.png" alt="Matchchayn" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
            <h1 className="text-2xl font-bold tracking-widest uppercase">MATCHCHAYN</h1>
          </div>

          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-1 flex-1 bg-purple-600 rounded-full"></div>
            <div className="h-1 flex-1 bg-purple-600 rounded-full"></div>
            <div className="h-1 flex-1 bg-purple-600 rounded-full"></div>
            <div className="h-1 flex-1 bg-purple-600 rounded-full"></div>
            <span className="text-gray-400 text-xs ml-2 font-mono">4/4</span>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-3">Unlimited Vibe</h2>
            <p className="text-gray-400 text-sm">
              Your media is now secured by Cloudflare R2 with unlimited bandwidth. No buffering, just swiping.
            </p>
          </div>

          <div className="space-y-6 mb-10">
            <div className="relative group">
              <label className="block w-full h-48 border-2 border-dashed border-gray-700 rounded-3xl cursor-pointer overflow-hidden bg-[#16162d] hover:border-purple-500 transition-all">
                <input type="file" accept="video/*" onChange={(e) => handleFileChange(e, 'video')} className="hidden" />
                {introVideoPrev ? (
                  <video src={introVideoPrev} className="w-full h-full object-cover" autoPlay muted loop />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <div className="w-14 h-14 rounded-full bg-purple-600/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <span className="text-xl">▶</span>
                    </div>
                    <span className="text-sm font-mono uppercase tracking-widest">Intro Video</span>
                  </div>
                )}
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="relative group">
                <label className="block h-44 border-2 border-dashed border-purple-500/50 rounded-3xl cursor-pointer overflow-hidden bg-[#16162d] hover:border-purple-400 transition-all">
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'photo1')} className="hidden" />
                  {photo1Prev ? (
                    <img src={photo1Prev} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                        <span className="text-xl">+</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400">Profile Pic</span>
                    </div>
                  )}
                </label>
              </div>

              <div className="relative group">
                <label className="block h-44 border-2 border-dashed border-gray-700 rounded-3xl cursor-pointer overflow-hidden bg-[#16162d] hover:border-purple-500 transition-all">
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'photo2')} className="hidden" />
                  {photo2Prev ? (
                    <img src={photo2Prev} className="w-full h-full object-cover" alt="Secondary" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <span className="text-xl">+</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">More</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>


          <div className="flex gap-4">
            {onBack && (
              <button
                onClick={onBack}
                disabled={loading}
                className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-full transition-all active:scale-[0.98]"
              >
                Back
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-[2] py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-bold rounded-full transition-all active:scale-[0.98]"
            >
              {loading ? 'Processing...' : 'Continue'}
            </button>
          </div>

          {!loading && (
            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  const response = await fetch(`${API_BASE_URL}/api/user/media`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${session?.token}`
                    },
                    body: JSON.stringify({ onboardingSkip: true }),
                  });
                  if (response.ok) {
                    clearProfileCache();
                    showAlert('Step skipped', 'info');
                    onComplete();
                  }
                } catch (e) {
                  console.error(e);
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full mt-4 py-2 text-gray-500 hover:text-gray-300 text-sm font-medium transition-colors"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
