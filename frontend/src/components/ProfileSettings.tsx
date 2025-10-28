import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../client'
import type { User } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'
import Header from '../Home/Header'
import Sidebar from './Sidebar'

interface ProfileSettingsProps {
  user: User | null
}

export default function ProfileSettings({ user }: ProfileSettingsProps) {
  const navigate = useNavigate()
  // Loading state removed - content loads in background
  const [first_name, setFirstName] = useState<string | null>(null)
  const [last_name, setLastName] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [dateofbirth, setDateOfBirth] = useState<string | null>(null)
  const [country, setCountry] = useState<string | null>(null)
  const [city, setCity] = useState<string | null>(null)
  const [gender, setGender] = useState<string | null>(null)
  const [relationshipstatus, setRelationshipStatus] = useState<string | null>(null)
  const [bio, setBio] = useState<string | null>(null)
  const [avatar_url, setAvatarUrl] = useState<string | null>(null)
  const [avatarBlobUrl, setAvatarBlobUrl] = useState<string | null>(null)
  const [interests, setInterests] = useState<string[]>([])
  const [galleryImages, setGalleryImages] = useState<(string | null)[]>([])
  const [galleryMedia, setGalleryMedia] = useState<Array<{id: string, media_url: string, media_type: string}>>([])
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isEditingHeader, setIsEditingHeader] = useState(false)
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [isEditingPersonal, setIsEditingPersonal] = useState(false)

  const getProfile = useCallback(async () => {
    try {
      // Background loading - no UI blocking

      const { data, error, status } = await supabase
        .from('Profile')
        .select(`first_name, last_name, username, dateofbirth, country, city, gender, relationshipstatus, bio, avatar_url`)
        .eq('id', user?.id)
        .single()

      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setFirstName(data.first_name)
        setLastName(data.last_name)
        setUsername(data.username)
        setDateOfBirth(data.dateofbirth)
        setCountry(data.country)
        setCity(data.city)
        setGender(data.gender)
        setRelationshipStatus(data.relationshipstatus)
        setBio(data.bio)
        setAvatarUrl(data.avatar_url)

        // Download avatar if exists
        if (data.avatar_url) {
          const { data: imageData, error: downloadError } = await supabase.storage
            .from('avatars')
            .download(data.avatar_url)

          if (!downloadError && imageData) {
            const url = URL.createObjectURL(imageData)
            setAvatarBlobUrl(url)
          }
        }
      }

      // Fetch interests
      const { data: interestsData, error: interestsError } = await supabase
        .from('user_interests')
        .select('interest_id')
        .eq('user_id', user?.id)

      console.log('User ID:', user?.id)
      console.log('Interests Data:', interestsData)
      console.log('Interests Error:', interestsError)

      if (interestsData && interestsData.length > 0) {
        const interestIds = interestsData.map(i => i.interest_id)
        console.log('Interest IDs:', interestIds)

        // Fetch all columns to see the actual column names
        const { data: interestNames, error: namesError } = await supabase
          .from('interests')
          .select('*')
          .in('id', interestIds)

        console.log('Interest Names:', interestNames)
        console.log('Names Error:', namesError)

        if (interestNames && interestNames.length > 0) {
          // Check what columns exist and use the correct one
          const firstItem = interestNames[0]
          console.log('First interest item:', firstItem)

          // Try common column names
          if ('name' in firstItem) {
            setInterests(interestNames.map(i => i.name))
          } else if ('interest' in firstItem) {
            setInterests(interestNames.map(i => i.interest))
          } else if ('title' in firstItem) {
            setInterests(interestNames.map(i => i.title))
          } else {
            console.error('Unknown interest column structure:', firstItem)
          }
        }
      }

      // Fetch gallery media from user_media table
      const { data: mediaData, error: mediaError } = await supabase
        .from('user_media')
        .select('id, media_url, media_type')
        .eq('user_id', user?.id)

      console.log('Gallery Media Data:', mediaData)
      console.log('Gallery Media Error:', mediaError)

      if (mediaData && mediaData.length > 0) {
        setGalleryMedia(mediaData)
        
        // Download gallery media and create blob URLs (same approach as profile picture)
        const imagePromises = mediaData.map(async (media) => {
          try {
            // All gallery media is stored in user-videos bucket
            const { data: mediaData, error: downloadError } = await supabase.storage
              .from('user-videos')
              .download(media.media_url)

            if (downloadError) {
              console.error(`Error downloading ${media.media_type}:`, downloadError)
              return null
            }

            // Create blob URL for reliable playback
            return URL.createObjectURL(mediaData)
          } catch (err) {
            console.error('Error downloading media:', err)
            return null
          }
        })

        const images = await Promise.all(imagePromises)
        console.log('Gallery blob URLs:', images)
        console.log('Gallery media count:', mediaData.length)
        console.log('Image URLs count:', images.length)
        console.log('Media data:', mediaData)
        setGalleryImages(images)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }, [user])

  useEffect(() => {
    getProfile()
  }, [user, getProfile])

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      galleryImages.forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [galleryImages])

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true)
      setMessage(null)

      const { error } = await supabase.from('Profile').upsert({
        id: user?.id as string,
        first_name,
        last_name,
        username,
        dateofbirth,
        country,
        city,
        gender,
        relationshipstatus,
        bio,
        avatar_url,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error
      setMessage({ type: 'success', text: 'Profile updated successfully!' })

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error updating profile!' })
      console.error('Error updating profile:', error)
    } finally {
      setUpdating(false)
    }
  }

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUpdating(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${user?.id}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Update avatar_url in database
      const { error: updateError } = await supabase.from('Profile').update({
        avatar_url: filePath,
        updated_at: new Date().toISOString(),
      }).eq('id', user?.id)

      if (updateError) throw updateError

      setAvatarUrl(filePath)

      // Download and display new avatar
      const { data: imageData } = await supabase.storage
        .from('avatars')
        .download(filePath)

      if (imageData) {
        const url = URL.createObjectURL(imageData)
        setAvatarBlobUrl(url)
      }

      setMessage({ type: 'success', text: 'Avatar updated!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
      console.error('Error uploading avatar:', error)
    } finally {
      setUpdating(false)
    }
  }

  const uploadGalleryMedia = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUpdating(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select a file to upload.')
      }

      const file = event.target.files[0]
      const filePath = `${user?.id}/${file.name}`
      
      // Determine media type - all media goes to user-videos bucket
      const isVideo = file.type.startsWith('video/')
      const mediaType = isVideo ? 'intro_video' : 'photo'
      const bucketName = 'user-videos'

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Insert media record into user_media table
      const { error: insertError } = await supabase
        .from('user_media')
        .insert({
          user_id: user?.id,
          media_type: mediaType,
          media_url: filePath
        })

      if (insertError) throw insertError

      setMessage({ type: 'success', text: 'Media uploaded successfully!' })
      setTimeout(() => setMessage(null), 3000)
      
      // Refresh gallery
      await getProfile()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
      console.error('Error uploading gallery media:', error)
    } finally {
      setUpdating(false)
    }
  }

  // Delete functionality removed - gallery is now view-only

  // Remove loading screen - let content load in background

  const age = calculateAge(dateofbirth)

  return (
    <>
      <Sidebar />
      <Header userId={user?.id || ''} />
      <div className="min-h-screen bg-[#0a0a1f] text-white lg:pl-64">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4" style={{ paddingTop: '70px' }}>
        {/* Profile Settings Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => navigate('/')} className="text-white hover:text-gray-300 transition-colors">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold">Profile Settings</h1>
          </div>
          <button onClick={handleSignOut} className="text-red-500 text-xs sm:text-sm font-medium px-2 sm:px-4 py-1.5 sm:py-2 border border-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
            Logout
          </button>
        </div>
        {/* Success/Error Message */}
        {message && (
          <div className={`${message.type === 'success' ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'} border rounded-xl p-3 sm:p-4`}>
            <p className={`${message.type === 'success' ? 'text-green-400' : 'text-red-400'} text-xs sm:text-sm text-center`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-[#1a1a2e] rounded-2xl p-4 sm:p-6">
          <div className="flex items-start gap-2 sm:gap-4">
            <div className="relative flex-shrink-0">
              <label htmlFor="avatar-upload" className="cursor-pointer block">
                {avatarBlobUrl ? (
                  <img
                    src={avatarBlobUrl}
                    alt="Profile"
                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-purple-500"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-purple-600 flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-bold">
                    {first_name?.charAt(0) || 'U'}
                  </div>
                )}
                {/* Upload overlay */}
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={updating}
                className="hidden"
              />
            </div>
            <div className="flex-1 min-w-0">
              {isEditingHeader ? (
                <>
                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <input
                      type="text"
                      value={first_name || ''}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="flex-1 bg-[#0a0a1f] text-white text-sm sm:text-base md:text-lg font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={last_name || ''}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="flex-1 bg-[#0a0a1f] text-white text-sm sm:text-base md:text-lg font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={city || ''}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="flex-1 bg-[#0a0a1f] text-gray-300 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={country || ''}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Country"
                      className="flex-1 bg-[#0a0a1f] text-gray-300 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold truncate">{first_name} {last_name}</h2>
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <p className="text-gray-400 text-xs sm:text-sm flex items-center gap-1 truncate">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <span className="truncate">{city}, {country}</span>
                  </p>
                </>
              )}
            </div>
            <button
              onClick={() => setIsEditingHeader(!isEditingHeader)}
              className="text-gray-400 hover:text-white flex-shrink-0 mt-1"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-[#1a1a2e] rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm sm:text-base">Bio</h3>
            <button
              onClick={() => setIsEditingBio(!isEditingBio)}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
          {isEditingBio ? (
            <textarea
              value={bio || ''}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write something about yourself..."
              className="w-full bg-[#0a0a1f] text-gray-300 text-xs sm:text-sm px-3 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none resize-none"
              rows={4}
            />
          ) : (
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
              {bio || 'No bio added yet'}
            </p>
          )}
        </div>

        {/* Personal Information */}
        <div className="bg-[#1a1a2e] rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-semibold text-sm sm:text-base">Personal Information</h3>
            <button
              onClick={() => setIsEditingPersonal(!isEditingPersonal)}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p className="text-gray-400 text-xs mb-1.5">Date of Birth</p>
              {isEditingPersonal ? (
                <>
                  <input
                    type="date"
                    value={dateofbirth || ''}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full bg-[#0a0a1f] text-white text-xs sm:text-sm font-medium px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                  />
                  {age && <p className="text-gray-500 text-xs mt-1">{age} years old</p>}
                </>
              ) : (
                <p className="text-white text-xs sm:text-sm font-medium">{dateofbirth ? `${dateofbirth}${age ? ` (${age} years)` : ''}` : 'N/A'}</p>
              )}
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1.5">Username</p>
              {isEditingPersonal ? (
                <input
                  type="text"
                  value={username || ''}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@username"
                  className="w-full bg-[#0a0a1f] text-white text-xs sm:text-sm font-medium px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                />
              ) : (
                <p className="text-white text-xs sm:text-sm font-medium">{username || 'N/A'}</p>
              )}
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1.5">Gender</p>
              {isEditingPersonal ? (
                <select
                  value={gender || ''}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-[#0a0a1f] text-white text-xs sm:text-sm font-medium px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none capitalize"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p className="text-white text-xs sm:text-sm font-medium capitalize">{gender || 'N/A'}</p>
              )}
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1.5">Relationship status</p>
              {isEditingPersonal ? (
                <select
                  value={relationshipstatus || ''}
                  onChange={(e) => setRelationshipStatus(e.target.value)}
                  className="w-full bg-[#0a0a1f] text-white text-xs sm:text-sm font-medium px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none capitalize"
                >
                  <option value="">Select status</option>
                  <option value="single">Single</option>
                  <option value="in_relationship">In a Relationship</option>
                  <option value="married">Married</option>
                  <option value="complicated">It's Complicated</option>
                </select>
              ) : (
                <p className="text-white text-xs sm:text-sm font-medium capitalize">{relationshipstatus?.replace('_', ' ') || 'N/A'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Interest */}
        <div className="bg-[#1a1a2e] rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-semibold text-sm sm:text-base">Interest</h3>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {interests.length > 0 ? (
              interests.map((interest, idx) => (
                <span key={idx} className="px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-purple-600 rounded-full text-xs sm:text-sm font-medium">
                  {interest}
                </span>
              ))
            ) : (
              <p className="text-gray-400 text-xs sm:text-sm">No interests added</p>
            )}
          </div>
        </div>

        {/* Gallery */}
        <div className="bg-[#1a1a2e] rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-semibold text-sm sm:text-base">Gallery</h3>
            <label htmlFor="gallery-upload" className="text-gray-400 hover:text-white cursor-pointer">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </label>
          </div>
          <input
            id="gallery-upload"
            type="file"
            accept="image/*,video/*"
            onChange={uploadGalleryMedia}
            disabled={updating}
            className="hidden"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {galleryMedia.length > 0 ? (
              <>
                {galleryMedia.map((media, idx) => {
                  const imageUrl = galleryImages[idx]
                  const isVideo = media.media_type === 'intro_video'
                  
                  return (
                    <div key={media.id} className="aspect-square bg-gray-800 rounded-xl overflow-hidden relative group">
                      {imageUrl ? (
                        <>
                          {isVideo ? (
                            <video 
                              src={imageUrl} 
                              className="w-full h-full object-cover"
                              controls
                              preload="metadata"
                              style={{ zIndex: 1 }}
                            />
                          ) : (
                            <img src={imageUrl} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                          )}
                          {/* Delete button removed */}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <p className="text-xs">Failed to load</p>
                          </div>
                          {/* Delete button removed */}
                        </div>
                      )}
                    </div>
                  )
                })}
                {/* Add placeholder slots if less than 6 media items */}
                {Array.from({ length: Math.max(0, 3 - galleryMedia.length) }).map((_, idx) => (
                  <label 
                    key={`placeholder-${idx}`} 
                    htmlFor="gallery-upload"
                    className="aspect-square bg-gray-800 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </label>
                ))}
              </>
            ) : (
              <>
                {/* Show 6 placeholder slots when no media/ UPDATED to 4 */}
                {Array.from({ length: 4 }).map((_, idx) => (
                  <label 
                    key={`empty-${idx}`} 
                    htmlFor="gallery-upload"
                    className="aspect-square bg-gray-800 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </label>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Update Profile Button */}
        <button
          onClick={handleUpdateProfile}
          disabled={updating}
          className="w-full py-3 sm:py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white text-sm sm:text-base font-semibold rounded-full transition-colors"
        >
          {updating ? 'Updating...' : 'Update Profile'}
        </button>
        </div>
      </div>
    </>
  )
}
