import { useState, useEffect } from 'react'
import { supabase } from '../../client'
import type { Session } from '@supabase/supabase-js'
import RelaxConnectMatchCard from '../RelaxConnectMatchCard'

interface MediaUploadProps {
  session: Session
  onComplete: () => void
  onBack?: () => void
}

export default function MediaUpload({ session, onComplete, onBack }: MediaUploadProps) {
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onBack) {
        onBack()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBack])

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
    // Check if intro video exists (either newly uploaded or already existing)
    if (!introVideo && !introVideoUrl) {
      alert('Please upload an intro video to continue.')
      return
    }

    // Check if photo 1 exists (either newly uploaded or already existing)
    if (!photo1 && !photo1Url) {
      alert('Please upload at least the first photo (profile picture) to continue.')
      return
    }

    try {
      setLoading(true)

      // Upload intro video only if it's a new file
      if (introVideo) {
        await uploadFile(introVideo, 'intro_video')
      }

      // Upload photo 1 and set as profile picture only if it's a new file
      if (photo1) {
        const fileExt = photo1.name.split('.').pop()
        const fileName = `photo1.${fileExt}`
        const filePath = `${session.user.id}/${fileName}`

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('user-videos')
          .upload(filePath, photo1, { upsert: true })

        if (uploadError) throw uploadError

        // Save to user_media
        await supabase
          .from('user_media')
          .delete()
          .eq('user_id', session.user.id)
          .eq('media_type', 'photo')
          .eq('display_order', 1)

        const { error: dbError } = await supabase.from('user_media').insert({
          user_id: session.user.id,
          media_type: 'photo',
          media_url: filePath,
          display_order: 1,
        })

        if (dbError) throw dbError

        // Update Profile table with avatar_url
        const publicUrl = supabase.storage.from('user-videos').getPublicUrl(filePath).data.publicUrl

        const { error: profileError } = await supabase
          .from('Profile')
          .update({ avatar_url: publicUrl })
          .eq('id', session.user.id)

        if (profileError) throw profileError
      } else if (photo1Url && !photo1) {
        // If photo1Url exists but no new photo1 file, it means they already uploaded
        // We still need to ensure avatar_url is set in Profile table
        const { error: profileError } = await supabase
          .from('Profile')
          .update({ avatar_url: photo1Url })
          .eq('id', session.user.id)

        if (profileError) {
          console.error('Error updating profile with existing avatar:', profileError)
        }
      }

      // Upload photo 2 only if it's a new file
      if (photo2) {
        await uploadFile(photo2, 'photo', 2)
      }

      // Small delay to ensure all database transactions are complete
      await new Promise(resolve => setTimeout(resolve, 500))

      onComplete()
    } catch (error) {
      console.error('Error:', error)
      alert('Error uploading media. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Check for .mov files
      if (file.name.toLowerCase().endsWith('.mov')) {
        alert('⚠️ .MOV files may not play in all browsers. For best compatibility, please convert to .MP4 format.\n\nYou can use free online converters like:\n- CloudConvert.com\n- FreeConvert.com')
      }

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
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0a0a1f]">
      {/* Left Side - Image (Hidden on mobile) */}
      <div className="hidden lg:block lg:w-1/2 lg:flex-shrink-0 relative bg-[#0a0a1f]">
        <div className="relative w-full h-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop"
            alt="Background"
            className="w-full h-full object-cover"
          />
          <RelaxConnectMatchCard />
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 min-h-screen bg-[#0a0a1f]">
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
              {/* Photo 1 - Profile Picture */}
              <label className="block h-40 border-2 border-dashed border-purple-500 rounded-xl cursor-pointer overflow-hidden relative bg-[#1f1f3a] hover:border-purple-600 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhoto1Change}
                  className="hidden"
                />
                {photo1Url ? (
                  <img
                    src={photo1Url}
                    alt="Profile Picture"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center mb-2">
                      <span className="text-2xl text-white">+</span>
                    </div>
                    <span className="text-xs text-purple-400 font-semibold">Profile Pic</span>
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
