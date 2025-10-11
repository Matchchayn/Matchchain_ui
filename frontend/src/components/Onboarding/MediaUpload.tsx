import { useState, useEffect } from 'react'
import { supabase } from '../../client'
import type { Session } from '@supabase/supabase-js'
import RelaxConnectMatchCard from '../RelaxConnectMatchCard'

interface MediaUploadProps {
  session: Session
  onComplete: () => void
}

export default function MediaUpload({ session, onComplete }: MediaUploadProps) {
  const [loading, setLoading] = useState(false)

  const [introVideo, setIntroVideo] = useState<File | null>(null)
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(null)
  const [photo1, setPhoto1] = useState<File | null>(null)
  const [photo1Url, setPhoto1Url] = useState<string | null>(null)
  const [photo2, setPhoto2] = useState<File | null>(null)
  const [photo2Url, setPhoto2Url] = useState<string | null>(null)

  useEffect(() => {
    loadExistingMedia()
  }, [])

  const loadExistingMedia = async () => {
    try {
      const { data, error } = await supabase
        .from('user_media')
        .select('*')
        .eq('user_id', session.user.id)

      if (error) throw error

      if (data) {
        data.forEach((media) => {
          const publicUrl = supabase.storage.from('user-videos').getPublicUrl(media.media_url).data.publicUrl

          if (media.media_type === 'intro_video') {
            setIntroVideoUrl(publicUrl)
          } else if (media.media_type === 'photo') {
            if (media.display_order === 1) setPhoto1Url(publicUrl)
            if (media.display_order === 2) setPhoto2Url(publicUrl)
          }
        })
      }
    } catch (error) {
      console.error('Error loading media:', error)
    }
  }

  const uploadFile = async (file: File, type: 'intro_video' | 'photo', displayOrder?: number) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = type === 'intro_video'
        ? `intro_video.${fileExt}`
        : `photo${displayOrder}.${fileExt}`
      const filePath = `${session.user.id}/${fileName}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('user-videos')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Delete existing record if any
      await supabase
        .from('user_media')
        .delete()
        .eq('user_id', session.user.id)
        .eq('media_type', type)
        .eq('display_order', displayOrder || null)

      // Save to database
      const { error: dbError } = await supabase.from('user_media').insert({
        user_id: session.user.id,
        media_type: type,
        media_url: filePath,
        display_order: displayOrder || null,
      })

      if (dbError) throw dbError

      return true
    } catch (error) {
      console.error('Error uploading:', error)
      throw error
    }
  }

  const handleSubmit = async () => {
    if (!introVideo && !introVideoUrl) {
      return
    }

    try {
      setLoading(true)

      // Upload intro video
      if (introVideo) {
        await uploadFile(introVideo, 'intro_video')
      }

      // Upload photo 1
      if (photo1) {
        await uploadFile(photo1, 'photo', 1)
      }

      // Upload photo 2
      if (photo2) {
        await uploadFile(photo2, 'photo', 2)
      }

      onComplete()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type.startsWith('video/')) {
        setIntroVideo(file)
        setIntroVideoUrl(URL.createObjectURL(file))
      }
    }
  }

  const handlePhoto1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type.startsWith('image/')) {
        setPhoto1(file)
        setPhoto1Url(URL.createObjectURL(file))
      }
    }
  }

  const handlePhoto2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type.startsWith('image/')) {
        setPhoto2(file)
        setPhoto2Url(URL.createObjectURL(file))
      }
    }
  }

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-[#0a0a1f] overflow-hidden">
      {/* Left Side - Image (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative p-4 bg-[#0a0a1f]">
        <div className="relative w-full h-full rounded-2xl overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop"
            alt="Background"
            className="w-full h-full object-cover"
          />
          <RelaxConnectMatchCard />
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 lg:w-1/2 flex flex-col overflow-y-auto bg-[#0a0a1f]">
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">MATCHCHAYN</h1>
              
              {/* Progress Bar */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-8 h-1 bg-purple-500 rounded-full"></div>
                <div className="w-8 h-1 bg-purple-500 rounded-full"></div>
                <div className="w-8 h-1 bg-purple-500 rounded-full"></div>
                <div className="w-8 h-1 bg-purple-500 rounded-full"></div>
                <span className="text-gray-400 text-sm ml-2">4/4</span>
              </div>

              <h2 className="text-2xl lg:text-3xl font-semibold text-white mb-2">
                Upload an intro video
              </h2>
              <h2 className="text-2xl lg:text-3xl font-semibold text-white mb-4">
                and Photos
              </h2>
              <p className="text-gray-400 text-sm">
                To boost your match potential,<br />
                upload an intro video and photos.
              </p>
            </div>

            {/* Intro Video Upload */}
            <div className="mb-6">
              <label className="block w-full h-48 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer overflow-hidden relative bg-[#1f1f3a] hover:border-purple-500 transition-colors">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                />
                {introVideoUrl ? (
                  <video
                    src={introVideoUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center mb-3">
                      <span className="text-2xl text-white">▶</span>
                    </div>
                    <span className="text-sm">Upload Video</span>
                  </div>
                )}
              </label>
            </div>

            {/* Photos Upload */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {/* Photo 1 */}
              <label className="block h-40 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer overflow-hidden relative bg-[#1f1f3a] hover:border-purple-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhoto1Change}
                  className="hidden"
                />
                {photo1Url ? (
                  <img
                    src={photo1Url}
                    alt="Photo 1"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                      <span className="text-2xl text-white">+</span>
                    </div>
                  </div>
                )}
              </label>

              {/* Photo 2 */}
              <label className="block h-40 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer overflow-hidden relative bg-[#1f1f3a] hover:border-purple-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhoto2Change}
                  className="hidden"
                />
                {photo2Url ? (
                  <img
                    src={photo2Url}
                    alt="Photo 2"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                      <span className="text-2xl text-white">+</span>
                    </div>
                  </div>
                )}
              </label>
            </div>

            {/* Buttons */}
            <div>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-4 rounded-full bg-purple-500 text-white text-lg font-semibold hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Uploading...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
