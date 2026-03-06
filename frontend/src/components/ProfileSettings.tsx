import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchUserProfile, clearProfileCache } from '../utils/userProfileService'
import { API_BASE_URL } from '../config';

interface UserData {
  _id: string
  email: string
  firstName: string
  lastName: string
  username: string
  gender: string
  dateOfBirth: string
  city: string
  country: string
  relationshipStatus: string
  bio: string
  avatarUrl: string
  secondaryPhotoUrl: string
  thirdPhotoUrl: string
  videoUrl: string
  interests: string[]
}

interface Interest {
  id: string
  name: string
}

interface ProfileSettingsProps {
  user: any
}

export default function ProfileSettings({ user }: ProfileSettingsProps) {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Profile Form State
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [gender, setGender] = useState('')
  const [relationshipStatus, setRelationshipStatus] = useState('')
  const [bio, setBio] = useState('')

  // Media State
  const [avatarUrl, setAvatarUrl] = useState('')
  const [secondaryPhotoUrl, setSecondaryPhotoUrl] = useState('')
  const [thirdPhotoUrl, setThirdPhotoUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')

  // Interests State
  const [interests, setInterests] = useState<string[]>([])
  const [availableInterests, setAvailableInterests] = useState<Interest[]>([])

  // Edit Mode Toggles
  const [isEditingHeader, setIsEditingHeader] = useState(false)
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [isEditingPersonal, setIsEditingPersonal] = useState(false)
  const [isEditingInterests, setIsEditingInterests] = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchInterests()
  }, [])

  const fetchInterests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/interests`)
      if (response.ok) {
        const data = await response.json()
        setAvailableInterests(data || [])
      }
    } catch (error) {
      console.error('Error fetching interests:', error)
    }
  }

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const data: UserData = await fetchUserProfile(token || '')
      if (data) {
        setFirstName(data.firstName || '')
        setLastName(data.lastName || '')
        setUsername(data.username || '')
        let formattedDate = ''
        if (data.dateOfBirth) {
          formattedDate = new Date(data.dateOfBirth).toISOString().split('T')[0]
        }
        setDateOfBirth(formattedDate)
        setCountry(data.country || '')
        setCity(data.city || '')
        setGender(data.gender || '')
        setRelationshipStatus(data.relationshipStatus || '')
        setBio(data.bio || '')
        setAvatarUrl(data.avatarUrl || '')
        setSecondaryPhotoUrl(data.secondaryPhotoUrl || '')
        setThirdPhotoUrl(data.thirdPhotoUrl || '')
        setVideoUrl(data.videoUrl || '')
        setInterests(data.interests || [])
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true)
      setMessage(null)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName, lastName, username, dateOfBirth, country, city, gender, relationshipStatus, bio
        })
      })

      if (!res.ok) throw new Error('Failed to update profile')

      clearProfileCache()
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setIsEditingHeader(false)
      setIsEditingBio(false)
      setIsEditingPersonal(false)
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error updating profile!' })
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateInterests = async () => {
    try {
      setUpdating(true)
      setMessage(null)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/user/interests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ interests })
      })

      if (!res.ok) throw new Error('Failed to update interests')

      setMessage({ type: 'success', text: 'Interests updated successfully!' })
      setIsEditingInterests(false)
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error updating interests!' })
    } finally {
      setUpdating(false)
    }
  }

  const toggleInterest = (interestName: string) => {
    if (interests.includes(interestName)) {
      setInterests(interests.filter(name => name !== interestName))
    } else {
      if (interests.length >= 5) {
        setMessage({ type: 'error', text: 'Maximum 5 interests allowed.' })
        setTimeout(() => setMessage(null), 3000)
        return
      }
      setInterests([...interests, interestName])
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600; // Avatars can be smaller
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8)); // 80% quality for avatars
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  }

  const uploadToR2 = async (file: File) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/api/media/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ fileName: file.name, fileType: file.type })
    })

    const { uploadUrl, publicUrl } = await response.json()
    if (!response.ok) throw new Error('Failed to get upload authorization')

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type }
    })

    if (!uploadResponse.ok) throw new Error('Failed to upload video to storage')
    return publicUrl
  }

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'secondary' | 'third' | 'video') => {
    try {
      if (!event.target.files || event.target.files.length === 0) return
      setUpdating(true)
      setMessage(null)

      const file = event.target.files[0]
      let newAvatarUrl = avatarUrl
      let newSecondaryPhotoUrl = secondaryPhotoUrl
      let newThirdPhotoUrl = thirdPhotoUrl
      let newVideoUrl = videoUrl

      if (type === 'video') {
        if (file.size > 20 * 1024 * 1024) throw new Error('Video must be under 20MB')
        newVideoUrl = await uploadToR2(file)
        setVideoUrl(newVideoUrl)
      } else {
        const base64Url = await fileToBase64(file)
        if (type === 'avatar') {
          newAvatarUrl = base64Url
          setAvatarUrl(base64Url)
        } else if (type === 'secondary') {
          newSecondaryPhotoUrl = base64Url
          setSecondaryPhotoUrl(base64Url)
        } else if (type === 'third') {
          newThirdPhotoUrl = base64Url
          setThirdPhotoUrl(base64Url)
        }
      }

      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/user/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          avatarUrl: newAvatarUrl,
          secondaryPhotoUrl: newSecondaryPhotoUrl,
          thirdPhotoUrl: newThirdPhotoUrl,
          videoUrl: newVideoUrl
        })
      })

      if (!res.ok) throw new Error(`Failed to update ${type}`)

      clearProfileCache()
      setMessage({ type: 'success', text: 'Media updated!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setUpdating(false)
    }
  }

  const calculateAge = (dob: string) => {
    if (!dob) return null
    const today = new Date()
    const birth = new Date(dob)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  const age = calculateAge(dateOfBirth)

  const isSavingNeeded = isEditingHeader || isEditingBio || isEditingPersonal

  return (
    <div className="min-h-screen bg-[#090a1e] text-white">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4" style={{ paddingTop: '80px' }}>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/profile')} className="text-white hover:text-gray-300 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold">Edit Profile</h1>
          </div>

          {isSavingNeeded && (
            <button
              onClick={handleUpdateProfile}
              disabled={updating}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-full transition-colors disabled:opacity-50"
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>

        {message && (
          <div className={`fixed top-[90px] right-4 z-50 ${message.type === 'success' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-400'} border rounded-xl p-4 text-sm font-medium shadow-lg backdrop-blur-md transition-all duration-300`}>
            {message.text}
          </div>
        )}

        {/* Header Info */}
        <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-purple-500/10">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <label htmlFor="avatar-upload" className="cursor-pointer block relative group">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-purple-500" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center text-3xl font-bold">
                    {firstName?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </label>
              <input id="avatar-upload" type="file" accept="image/*" onChange={(e) => handleMediaUpload(e, 'avatar')} disabled={updating} className="hidden" />
            </div>

            <div className="flex-1 min-w-0">
              {isEditingHeader ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" className="w-full bg-[#0a0a1f] text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none" />
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" className="w-full bg-[#0a0a1f] text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none" />
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="w-full bg-[#0a0a1f] text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none" />
                    <input type="text" value={country} onChange={e => setCountry(e.target.value)} placeholder="Country" className="w-full bg-[#0a0a1f] text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none" />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold truncate">{firstName} {lastName}</h2>
                  <p className="text-gray-400 text-sm mt-1">{city && country ? `${city}, ${country}` : 'Location not set'}</p>
                </>
              )}
            </div>
            <button onClick={() => setIsEditingHeader(!isEditingHeader)} className="text-gray-400 hover:text-white p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-purple-500/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-400 uppercase tracking-wider text-sm">Bio</h3>
            <button onClick={() => setIsEditingBio(!isEditingBio)} className="text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
          </div>
          {isEditingBio ? (
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} className="w-full bg-[#0a0a1f] text-white p-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none resize-none" placeholder="Tell us about yourself..." />
          ) : (
            <p className="text-gray-200 text-sm leading-relaxed">{bio || 'No bio added yet.'}</p>
          )}
        </div>

        {/* Personal Info */}
        <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-purple-500/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-400 uppercase tracking-wider text-sm">Personal Info</h3>
            <button onClick={() => setIsEditingPersonal(!isEditingPersonal)} className="text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-xs mb-1">Username</p>
              {isEditingPersonal ? (
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-[#0a0a1f] text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none" />
              ) : (
                <p className="text-white text-sm font-medium">{username || 'N/A'}</p>
              )}
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Date of Birth</p>
              {isEditingPersonal ? (
                <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className="w-full bg-[#0a0a1f] text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none" />
              ) : (
                <p className="text-white text-sm font-medium">{dateOfBirth ? `${dateOfBirth} ${age ? `(${age})` : ''}` : 'N/A'}</p>
              )}
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Gender</p>
              {isEditingPersonal ? (
                <select value={gender} onChange={e => setGender(e.target.value)} className="w-full bg-[#0a0a1f] text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none capitalize">
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p className="text-white text-sm font-medium capitalize">{gender || 'N/A'}</p>
              )}
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Relationship</p>
              {isEditingPersonal ? (
                <select value={relationshipStatus} onChange={e => setRelationshipStatus(e.target.value)} className="w-full bg-[#0a0a1f] text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none capitalize">
                  <option value="">Select...</option>
                  <option value="single">Single</option>
                  <option value="in_relationship">In a Relationship</option>
                  <option value="married">Married</option>
                  <option value="complicated">It's Complicated</option>
                </select>
              ) : (
                <p className="text-white text-sm font-medium capitalize">{relationshipStatus?.replace('_', ' ') || 'N/A'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-purple-500/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-400 uppercase tracking-wider text-sm">Interests</h3>
            {isEditingInterests ? (
              <button onClick={handleUpdateInterests} disabled={updating} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-full text-xs font-semibold">
                {updating ? 'Saving...' : 'Save Interests'}
              </button>
            ) : (
              <button onClick={() => setIsEditingInterests(true)} className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
            )}
          </div>
          {isEditingInterests ? (
            <div className="flex flex-wrap gap-2">
              {availableInterests.map((interest) => {
                const isSelected = interests.includes(interest.name)
                return (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.name)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${isSelected
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-[#0a0a1f] border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                      }`}
                  >
                    {interest.name}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {interests.length > 0 ? (
                interests.map((interest, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-purple-600/20 text-purple-300 rounded-full text-sm font-medium border border-purple-500/20">
                    {interest}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No interests selected</p>
              )}
            </div>
          )}
        </div>

        {/* Media Gallery */}
        <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-purple-500/10">
          <h3 className="font-semibold text-gray-400 uppercase tracking-wider text-sm mb-4">Media Gallery</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

            {/* Secondary Photo */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-500 text-xs px-1">Secondary Photo</label>
              <label htmlFor="secondary-upload" className="aspect-square bg-[#0a0a1f] border border-gray-700 rounded-xl overflow-hidden relative cursor-pointer group flex items-center justify-center">
                {secondaryPhotoUrl ? (
                  <img src={secondaryPhotoUrl} alt="Secondary" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                )}
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-6 h-6 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-xs text-white">Change</span>
                </div>
              </label>
              <input id="secondary-upload" type="file" accept="image/*" onChange={(e) => handleMediaUpload(e, 'secondary')} disabled={updating} className="hidden" />
            </div>

            {/* Third Photo */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-500 text-xs px-1">Third Photo</label>
              <label htmlFor="third-upload" className="aspect-square bg-[#0a0a1f] border border-gray-700 rounded-xl overflow-hidden relative cursor-pointer group flex items-center justify-center">
                {thirdPhotoUrl ? (
                  <img src={thirdPhotoUrl} alt="Third" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                )}
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-6 h-6 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-xs text-white">Change</span>
                </div>
              </label>
              <input id="third-upload" type="file" accept="image/*" onChange={(e) => handleMediaUpload(e, 'third')} disabled={updating} className="hidden" />
            </div>

            {/* Intro Video */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-500 text-xs px-1">Intro Video</label>
              <label htmlFor="video-upload" className="aspect-square bg-[#0a0a1f] border border-gray-700 rounded-xl overflow-hidden relative cursor-pointer group flex items-center justify-center">
                {videoUrl ? (
                  <video src={videoUrl} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2-2v8a2 2 0 002 2z" /></svg>
                )}
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <svg className="w-6 h-6 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  <span className="text-xs text-white">Upload</span>
                </div>
              </label>
              <input id="video-upload" type="file" accept="video/*" onChange={(e) => handleMediaUpload(e, 'video')} disabled={updating} className="hidden" />
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
